from django.db import models
from django.contrib.auth.models import User

# 1. 사용자 프로필 모델
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # [수정] 가입 시점에는 입력을 안 하므로 null=True, blank=True 추가
    # 주의: nickname은 unique=True이므로, 값이 없을 때 DB에서 충돌하지 않으려면 null=True가 필수입니다.
    nickname = models.CharField(max_length=30, unique=True, null=True, blank=True, verbose_name='닉네임')
    
    # [수정] 나이와 성별도 나중에 입력하므로 빈 값 허용
    age = models.IntegerField(null=True, blank=True, verbose_name='나이')
    gender = models.CharField(max_length=1, choices=[('M', '남성'), ('F', '여성')], null=True, blank=True, verbose_name='성별')
    
    bio = models.TextField(blank=True, verbose_name='자기소개')
    interests = models.CharField(max_length=255, blank=True, verbose_name='관심사')

    location = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='거주지역'
    )

    # 프로필 사진 (회원가입 때 입력받음)
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        blank=True,
        null=True,
        verbose_name='프로필 사진'
    )

    def __str__(self):
        # 닉네임이 없으면 유저네임으로 표시
        return self.nickname if self.nickname else self.user.username


# 2. 좋아요 (Like) 모델 (기존 동일)
class Like(models.Model):
    liker = models.ForeignKey(
        User,
        related_name='given_likes',
        on_delete=models.CASCADE,
        verbose_name='좋아요 누른 사람'
    )
    receiver = models.ForeignKey(
        User,
        related_name='received_likes',
        on_delete=models.CASCADE,
        verbose_name='좋아요 받은 사람'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('liker', 'receiver')

    def __str__(self):
        return f"{self.liker.username} -> {self.receiver.username}"