import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User
from django.db.models import Q 
from .models import ChatRoom, Message

# 🔑 중요: 이 부분을 실제 UserProfile 모델 경로로 수정하세요!
from users.models import UserProfile 


class ChatConsumer(AsyncWebsocketConsumer):
    
    # WebSocket 연결 시 호출 (에러 핸들링 보강 완료)
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name
        self.user = self.scope['user']

        try:
            # 1. 비인증 사용자 차단
            if not self.user.is_authenticated:
                print("Error: 비인증 사용자 연결 시도. 연결 거부.")
                await self.close(code=4003) 
                return

            # 2. ChatRoom ID 파싱 및 유효성 확인
            parts = self.room_name.split('_')
            id1 = int(parts[1])
            id2 = int(parts[2])
            self.user_ids = sorted([id1, id2])

            # 현재 로그인한 사용자가 이 방의 유효한 참여자인지 확인
            if self.user.id not in (id1, id2):
                print(f"Error: 사용자 ID {self.user.id}는 방 {self.room_name}의 참여자가 아닙니다.")
                await self.close(code=4004)
                return

            # 실제 ChatRoom이 존재하는지 확인
            self.room = await self.get_chat_room(self.user_ids)
            if self.room is None:
                print(f"Error: ChatRoom {self.room_name}이 DB에 존재하지 않습니다.")
                await self.close(code=4004)
                return
                
            # 3. 방에 채널 그룹 조인
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()

            # 4. 연결 성공 시, 해당 방의 과거 메시지를 불러와 클라이언트에게 전송
            try:
                messages = await self.get_last_10_messages() 
                await self.send(text_data=json.dumps({
                    'type': 'chat_history',
                    'messages': messages
                }))
            except Exception as e:
                # 과거 메시지 로드 오류는 Warning 처리 후 연결 유지 (치명적이지 않음)
                print(f"Warning: 과거 메시지 로드 중 오류 발생: {e}. 연결은 유지됩니다.")
                pass 
            
        except (IndexError, ValueError) as e:
            # 방 이름 파싱 오류 처리
            print(f"Fatal Error: 방 이름 파싱 중 오류 발생: {e}")
            await self.close(code=4000)
        except Exception as e:
            # 기타 예상치 못한 모든 오류 처리 (연결 전에 발생했을 경우)
            print(f"Fatal Error: WebSocket 연결 중 예상치 못한 오류 발생: {e}")
            await self.close(code=1011)


    # WebSocket 연결 해제 시 호출
    async def disconnect(self, close_code):
        # 채널 그룹에서 리브
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # 클라이언트로부터 메시지를 받을 때 호출
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json['message']
            
            # 1. 메시지를 데이터베이스에 저장
            db_message_data = await self.save_message(message)
            
            # 2. 그룹(채팅방)으로 메시지 전송
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message', 
                    'message': message,
                    'user_id': self.user.id,
                    'nickname': db_message_data['nickname'], 
                    'timestamp': db_message_data['timestamp']
                }
            )
            
        except Exception as e:
            # 오류 발생 시 로그는 유지합니다.
            print(f"Error saving message or sending group message: {e}")
            pass


    # 채널 그룹으로부터 메시지를 받을 때 호출
    async def chat_message(self, event):
        # 3. WebSocket을 통해 클라이언트에게 메시지 전송
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'user_id': event['user_id'],
            'nickname': event['nickname'],
            'timestamp': event['timestamp']
        }))

    # ----------------------------------------------------------------------
    # 동기 함수를 비동기로 실행하기 위한 헬퍼 함수
    # ----------------------------------------------------------------------

    @sync_to_async
    def get_chat_room(self, user_ids):
        """ChatRoom을 찾고 존재하지 않으면 None을 반환"""
        try:
            return ChatRoom.objects.get(
                Q(user1_id=user_ids[0], user2_id=user_ids[1]) | 
                Q(user1_id=user_ids[1], user2_id=user_ids[0])
            )
        except ChatRoom.DoesNotExist:
            return None
    
    @sync_to_async
    def get_last_10_messages(self):
        # self.room이 connect에서 유효성이 확인되었으므로 바로 사용
        if not hasattr(self, 'room') or self.room is None:
             return [] 

        messages = Message.objects.filter(room=self.room).order_by('-timestamp')[:10]
        
        # 메시지 데이터를 클라이언트에게 보낼 형태로 직렬화
        data = []
        for message in messages:
            try:
                nickname = message.sender.userprofile.nickname
            except UserProfile.DoesNotExist: 
                nickname = message.sender.username 
                
            data.append({
                'content': message.content,
                'sender_id': message.sender.id,
                'nickname': nickname,
                'timestamp': message.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })
            
        return list(reversed(data)) 

    @sync_to_async
    def save_message(self, message):
        # self.room이 connect에서 유효성이 확인되었으므로 바로 사용
        if not hasattr(self, 'room') or self.room is None:
             raise Exception("Room context not established!") 

        # 메시지 저장
        msg = Message.objects.create(
            room=self.room,
            sender=self.user,
            content=message
        )
        
        # 저장 후 클라이언트에게 보낼 데이터 준비
        try:
            nickname = self.user.userprofile.nickname
        except UserProfile.DoesNotExist:
            nickname = self.user.username

        return {
            'nickname': nickname,
            'timestamp': msg.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }