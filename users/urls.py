from rest_framework.routers import DefaultRouter
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # 로그인 처리 (토큰 발급)
    TokenRefreshView,     # Access 토큰 재발급
)

# 📌 수정: views 모듈 대신 필요한 ViewSet 클래스만 정확히 임포트합니다.
from .views import UserProfileViewSet, LikeViewSet, RegistrationViewSet 

router = DefaultRouter()

# 📌 수정: 'views.' 접두어를 제거하고 클래스 이름만 사용합니다.
# 라우터 등록 시 ViewSet 클래스 이름만 직접 사용합니다.
router.register(r'userprofile', UserProfileViewSet)  # 기존 UserProfileViewSet 사용
router.register(r'like', LikeViewSet, basename='like')
router.register(r'register', RegistrationViewSet, basename='register')

urlpatterns = [
    # 📌 JWT 로그인/토큰 관련 경로 추가
    # 1. 로그인: username과 password를 받아 토큰을 발급합니다.
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # 2. 토큰 갱신: Refresh 토큰을 사용하여 새로운 Access 토큰을 발급합니다.
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('', include(router.urls)),
]