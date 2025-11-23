# chat/views.py

from rest_framework import viewsets, permissions
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer

from django.db.models import Q

class ChatRoomViewSet(viewsets.ModelViewSet):
    # 현재 로그인된 사용자가 포함된 채팅방만 조회
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # 현재 로그인된 사용자가 user1 또는 user2로 있는 방만 필터링합니다.
        return ChatRoom.objects.filter(Q(user1=self.request.user) | Q(user2=self.request.user))

    def perform_create(self, serializer):
        # ChatRoomSerializer의 create 메서드에서 모든 로직을 처리하므로, 여기는 비워둡니다.
        serializer.save()

# 메시지는 읽기 전용 (WebSocket으로 생성)
class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # 🔑 Q 객체를 사용하여 user1 또는 user2인 방을 명확하게 필터링합니다.
        my_rooms = ChatRoom.objects.filter(Q(user1=user) | Q(user2=user))
        return Message.objects.filter(room__in=my_rooms).order_by('timestamp') # 메시지는 시간 순 정렬 권장