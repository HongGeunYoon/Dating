# users/admin.py

from django.contrib import admin
from .models import UserProfile, Like # Like 모델도 함께 등록하면 좋습니다.

# UserProfile 모델을 Django 관리자 페이지에 등록합니다.
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    # 관리자 페이지에서 보여줄 필드 목록
    list_display = ('user', 'nickname', 'age', 'gender', 'profile_picture')
    # 검색 가능 필드
    search_fields = ('nickname', 'user__username')
    # 필터링 가능 필드
    list_filter = ('gender',)

# Like 모델을 등록합니다. (선택 사항이지만 데이터 확인에 유용합니다)
@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('liker', 'receiver', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('liker__username', 'receiver__username')

# 참고: 기본 User 모델에 인라인으로 UserProfile을 붙여서 관리할 수도 있지만,
# 현재는 독립적으로 등록하는 방식이 가장 간단합니다.