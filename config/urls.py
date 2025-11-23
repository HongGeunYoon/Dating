"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

# 🔑 [필수] 이미지 서빙을 위한 임포트
from django.conf import settings
from django.conf.urls.static import static

from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# 📌 1. ViewSet 임포트: users 앱과 chat 앱에서 필요한 ViewSet들을 임포트합니다.
from users.views import UserProfileViewSet, LikeViewSet, RegistrationViewSet
from chat.views import ChatRoomViewSet 

# 📌 2. 라우터 설정
router = routers.DefaultRouter()
router.register(r'users/userprofile', UserProfileViewSet)
router.register(r'users/like', LikeViewSet, basename='like')
router.register(r'users/register', RegistrationViewSet, basename='register')
router.register(r'chat/rooms', ChatRoomViewSet, basename='chatroom') 


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 📌 3. 라우터에 등록된 모든 ViewSet 경로를 'api/' 아래에 포함
    path('api/', include(router.urls)),
    
    # 🚨 [JWT 인증 엔드포인트]
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# 🔑 [핵심 추가] 개발 환경에서 MEDIA 파일을 서빙하도록 설정합니다. (urlpatterns의 마지막)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)