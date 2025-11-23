# chat/serializers.py
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ChatRoom, Message

# 1. 메시지 직렬화
class MessageSerializer(serializers.ModelSerializer):
    sender_nickname = serializers.CharField(source='sender.userprofile.nickname', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'sender_nickname', 'content', 'timestamp']
        read_only_fields = ['sender', 'room']

# 2. 채팅방 생성 및 조회 직렬화
class ChatRoomSerializer(serializers.ModelSerializer):
    # 채팅방에 속한 두 유저의 닉네임을 보여줍니다.
    user1_nickname = serializers.CharField(source='user1.userprofile.nickname', read_only=True)
    user2_nickname = serializers.CharField(source='user2.userprofile.nickname', read_only=True)
    
    # 방 생성 시 상대방 ID 하나만 받기 위해
    target_user_id = serializers.IntegerField(write_only=True) 

    class Meta:
        model = ChatRoom
        fields = ['id', 'user1', 'user2', 'name', 'user1_nickname', 'user2_nickname', 'target_user_id', 'created_at']
        read_only_fields = ['user1', 'user2', 'name']

    def validate(self, data):
        # target_user_id가 현재 로그인된 사용자와 같은지 확인
        request_user = self.context['request'].user
        target_user = User.objects.filter(id=data['target_user_id']).first()
        
        if not target_user:
            raise serializers.ValidationError("존재하지 않는 사용자 ID입니다.")
        
        if request_user == target_user:
            raise serializers.ValidationError("자신과 채팅방을 만들 수 없습니다.")
        
        # 채팅방 이름은 두 유저 ID를 오름차순으로 정렬하여 고유하게 만듭니다.
        user_ids = sorted([request_user.id, target_user.id])
        room_name = f"chat_{user_ids[0]}_{user_ids[1]}"
        
        # 이미 채팅방이 있는지 확인
        if ChatRoom.objects.filter(name=room_name).exists():
            raise serializers.ValidationError("이미 존재하는 채팅방입니다.")
        
        data['target_user'] = target_user
        data['room_name'] = room_name
        
        return data
    @transaction.atomic
    def create(self, validated_data):
        request_user = self.context['request'].user
        target_user = validated_data['target_user']
        room_name = validated_data['room_name']
        
        # user1을 ID가 더 작은 사용자로 저장하여 순서에 관계없이 고유성을 유지합니다.
        if request_user.id < target_user.id:
            user1 = request_user
            user2 = target_user
        else:
            user1 = target_user
            user2 = request_user
        
        # 🔑 디버깅 코드 시작: 함수 내부, 저장 시도 직전
        print("====== CHATROOM CREATION ATTEMPTED (1) ======") 
        print(f"User 1: {user1.username}, User 2: {user2.username}")
        # ----------------------------------------------------
        
        try:
            # 🔑 DB 저장 로직 (여기서 실제로 DB에 데이터를 저장합니다.)
            room = ChatRoom.objects.create(user1=user1, user2=user2, name=room_name)
            
            # 🔑 저장 성공 시 메시지 출력
            print(f"ROOM SUCCESSFULLY CREATED WITH ID: {room.id} (2)") 
            
            return room
        except Exception as e:
            # 🔑 저장 실패 시 예외 메시지 출력
            print(f"!!! DATABASE SAVE FAILED (3): {e}") 
            raise e