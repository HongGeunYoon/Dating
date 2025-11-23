# DatingApp/users/models.py (프로필 사진 + 거주지역 필드 추가)

from django.db import models
from django.contrib.auth.models import User  # Django의 기본 사용자 모델 임포트

# 1. 사용자 프로필 모델
class UserProfile(models.Model):
    # Django의 기본 User 모델과 1:1로 연결하여 확장
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    nickname = models.CharField(max_length=30, unique=True, verbose_name='닉네임')
    age = models.IntegerField(verbose_name='나이')
    gender = models.CharField(max_length=1, choices=[('M', '남성'), ('F', '여성')], verbose_name='성별')
    bio = models.TextField(blank=True, verbose_name='자기소개')
    
    # 예시 필드: 관심사 (CSV 형태로 저장)
    interests = models.CharField(max_length=255, blank=True, verbose_name='관심사')

    # 🔑 [추가] 거주지역 필드
    location = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='거주지역'
    )

    # 🔑 [추가] 프로필 사진 필드
    profile_picture = models.ImageField(
        upload_to='profile_pics/',    # media/profile_pics/ 경로에 파일 저장
        blank=True,                   # 필수가 아님
        null=True,                    # 데이터베이스에 Null 허용
        verbose_name='프로필 사진'
    )

    def __str__(self):
        return self.nickname


# 2. 좋아요 (Like) 모델
class Like(models.Model):
    # 좋아요를 누른 사용자 (누가)
    liker = models.ForeignKey(
        User,
        related_name='given_likes',
        on_delete=models.CASCADE,
        verbose_name='좋아요 누른 사람'
    )
    # 좋아요를 받은 사용자 (누구에게)
    receiver = models.ForeignKey(
        User,
        related_name='received_likes',
        on_delete=models.CASCADE,
        verbose_name='좋아요 받은 사람'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    # 동일한 사람이 동일한 사람에게 중복 좋아요를 누를 수 없도록 설정
    class Meta:
        unique_together = ('liker', 'receiver')

    def __str__(self):
        return f"{self.liker.username} -> {self.receiver.username}"
