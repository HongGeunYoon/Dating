# chat/models.py

from django.db import models
from django.contrib.auth.models import User

# 1. 채팅방 모델
class ChatRoom(models.Model):
    # 매칭된 두 사용자
    user1 = models.ForeignKey(User, related_name='chatrooms_as_user1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name='chatrooms_as_user2', on_delete=models.CASCADE)
    
    # 두 유저 ID를 조합한 고유한 방 이름 (예: 'chat_1_6')
    name = models.CharField(max_length=255, unique=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # 두 사용자 ID의 순서에 관계없이 방이 고유하도록 합니다.
        unique_together = ('user1', 'user2')
    
    def __str__(self):
        return f"ChatRoom between {self.user1.username} and {self.user2.username}"

# 2. 메시지 모델
class Message(models.Model):
    # 메시지가 속한 채팅방
    room = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE)
    # 메시지를 보낸 사용자
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    # 메시지 내용
    content = models.TextField()
    # 메시지 전송 시각
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        # 최신 메시지부터 조회하도록 전송 시각을 기준으로 내림차순 정렬
        ordering = ('timestamp',)

    def __str__(self):
        return f'{self.sender.username} in {self.room.name}: {self.content[:20]}'