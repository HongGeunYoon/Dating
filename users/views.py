# users/views.py (통계 기능 추가 완료)

from django.shortcuts import render
from django.contrib.auth.models import User 
from .models import UserProfile, Like

from rest_framework import viewsets, permissions, status, serializers 
from rest_framework.decorators import action
from rest_framework.response import Response

# 📌 수정: 필요한 시리얼라이저를 모두 임포트합니다.
from .serializers import UserProfileSerializer, LikeSerializer, UserRegistrationSerializer 
from .permissions import IsOwnerOrReadOnly 


# UserProfile ViewSet: 프로필 생성 및 조회 처리
class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    # 기본 권한: 로그인된 사용자만 접근 가능
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly] 

    def perform_create(self, serializer):
        # 이미 프로필을 가지고 있는지 확인
        if UserProfile.objects.filter(user=self.request.user).exists():
            raise serializers.ValidationError({"detail": "이미 프로필을 가지고 있습니다. 프로필은 하나만 생성할 수 있습니다."})

        # 현재 로그인된 사용자를 user 필드에 저장
        serializer.save(user=self.request.user)

    # 🔑 1. 로그인 상태 확인 및 프로필 존재 여부 확인용 엔드포인트 (GET /api/users/userprofile/me/)
    @action(detail=False, methods=['get'])
    def me(self, request):
        """현재 로그인된 사용자의 프로필을 반환하거나, 없으면 404를 반환합니다."""
        if not request.user.is_authenticated:
            return Response({"detail": "인증 정보가 없습니다."}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            # 단일 객체를 가져와서, 프로필이 있으면 200 OK와 데이터 반환
            profile = UserProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            # 프로필이 없으면 404 Not Found 반환
            return Response({"detail": "프로필이 아직 생성되지 않았습니다."}, status=status.HTTP_404_NOT_FOUND)

    # 🔑 2. 매칭 대상 목록 조회용 엔드포인트 (GET /api/users/userprofile/matches/)
    @action(detail=False, methods=['get'])
    def matches(self, request):
        """현재 로그인된 사용자를 제외한 모든 프로필 목록을 반환합니다. (최소 필터링 버전)"""
        
        # 1. 모든 프로필을 가져옵니다.
        profiles = self.queryset.all()
        
        # 2. 현재 로그인된 사용자(나)의 프로필만 제외합니다.
        profiles = profiles.exclude(user=request.user) 
        
        # 3. 목록을 직렬화하여 반환합니다.
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)

    # 🔑 3. [추가] 좋아요 통계 엔드포인트 (GET /api/users/userprofile/stats/)
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """사용자의 좋아요/받은 좋아요 통계를 제공합니다."""
        user = request.user
        
        # 1. 내가 좋아요를 보낸 사람 목록 (LikesSent)
        # 내가 liker인 Like 객체들을 찾고, 그 Like 객체의 receiver(상대방 User)의 프로필을 가져옵니다.
        sent_likes = Like.objects.filter(liker=user)
        # Like 객체에서 receiver의 UserProfile을 찾습니다.
        likes_sent_profiles = [like.receiver.userprofile for like in sent_likes if hasattr(like.receiver, 'userprofile')]
        likes_sent_data = UserProfileSerializer(likes_sent_profiles, many=True).data

        # 2. 나에게 좋아요를 보낸 사람 목록 (LikesReceived)
        # 내가 receiver인 Like 객체들을 찾고, 그 Like 객체의 liker(상대방 User)의 프로필을 가져옵니다.
        received_likes = Like.objects.filter(receiver=user)
        # Like 객체에서 liker의 UserProfile을 찾습니다.
        likes_received_profiles = [like.liker.userprofile for like in received_likes if hasattr(like.liker, 'userprofile')]
        
        # 📌 좋아요를 받은 사람이 나에게 좋아요를 보냈을 때 매칭이 되었는지 여부를 판별하기 위해 
        #    여기서도 UserProfileSerializer를 사용합니다.
        likes_received_data = UserProfileSerializer(likes_received_profiles, many=True).data

        return Response({
            'likes_sent': likes_sent_data,      # 내가 좋아요를 누른 사람
            'likes_received': likes_received_data # 나에게 좋아요를 누른 사람 (잠재적 매칭)
        })


# Like ViewSet: 좋아요 생성 및 매칭 확인 처리
class LikeViewSet(viewsets.GenericViewSet):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated] 

    # 📌 1. 받은 좋아요 목록을 조회하는 커스텀 액션 추가 (GET /api/users/like/received_likes/)
    @action(detail=False, methods=['get'])
    def received_likes(self, request):
        # 현재 로그인된 사용자를 receiver로 하는 Like 객체들을 필터링
        received_likes = self.get_queryset().filter(receiver=request.user)
        
        # 받은 좋아요 리스트를 시리얼라이즈합니다.
        serializer = self.get_serializer(received_likes, many=True)
        return Response(serializer.data)


    # POST /api/users/like/ (좋아요 생성 및 매칭 확인)
    def create(self, request):
        sender = request.user 
        
        # 👈 이 아래 모든 코드를 추가로 들여쓰기합니다.
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # receiver_id 추출
        # validated_data에는 'receiver' 객체가 포함되어 있습니다.
        receiver_obj = serializer.validated_data['receiver']
        receiver_id = receiver_obj.id
        
        # 🚨 중복 좋아요 방지: 이미 좋아요를 보냈는지 확인
        if Like.objects.filter(liker=sender, receiver_id=receiver_id).exists(): 
            return Response(
                {"detail": "이미 상대방에게 좋아요를 보냈습니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 1. 좋아요 객체 생성 및 저장
        like = serializer.save(liker=sender) 
        
        # 📌 2. 매칭 로직: 상대방도 나에게 좋아요를 보냈는지 확인
        is_matched = Like.objects.filter(liker_id=receiver_id, receiver=sender).exists()

        if is_matched:
            # 매칭 성공 시, 매칭되었다는 응답 반환
            return Response({
                'detail': "🎉 매칭 성공! 축하합니다!", 
                'is_matched': True,
                'receiver_id': receiver_id
            }, status=status.HTTP_201_CREATED)
        
        # 매칭 실패 시, 일반 좋아요 성공 응답 반환
        return Response({
            'detail': "좋아요 성공!", 
            'is_matched': False,
            'receiver_id': receiver_id
        }, status=status.HTTP_201_CREATED)

# 📌 추가: User Registration ViewSet: 회원가입 처리
class RegistrationViewSet(viewsets.GenericViewSet):
    serializer_class = UserRegistrationSerializer 
    # 회원가입은 로그인하지 않은 사용자도 가능해야 합니다.
    permission_classes = [permissions.AllowAny] 
    
    # POST 요청을 처리하여 사용자 생성 (POST /api/users/register/)
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        return Response({
            "user_id": user.id,
            "username": user.username,
            "message": "회원가입이 성공적으로 완료되었습니다."
        }, status=status.HTTP_201_CREATED)