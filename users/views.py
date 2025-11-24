from django.shortcuts import render
from django.contrib.auth.models import User 
from .models import UserProfile, Like

from rest_framework import viewsets, permissions, status, serializers 
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser 

from .serializers import UserProfileSerializer, LikeSerializer, UserRegistrationSerializer 
from .permissions import IsOwnerOrReadOnly 


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly] 

    def perform_create(self, serializer):
        if UserProfile.objects.filter(user=self.request.user).exists():
            raise serializers.ValidationError({"detail": "이미 프로필을 가지고 있습니다."})
        serializer.save(user=self.request.user)

    # 🚀 [중요 수정] methods에 'patch'가 반드시 있어야 수정이 가능합니다!
    @action(detail=False, methods=['get', 'patch']) 
    def me(self, request):
        # 1. 로그인 확인
        if not request.user.is_authenticated:
            return Response({"detail": "인증 정보가 없습니다."}, status=status.HTTP_401_UNAUTHORIZED)
        
        # 2. 프로필 찾기
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({"detail": "프로필이 없습니다."}, status=status.HTTP_404_NOT_FOUND)

        # 3. GET 요청: 내 정보 조회
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        
        # 4. PATCH 요청: 내 정보 수정 (이게 있어야 ProfileForm.js가 작동함)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def matches(self, request):
        profiles = self.queryset.all().exclude(user=request.user)
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        sent_likes = Like.objects.filter(liker=user)
        likes_sent_profiles = [like.receiver.userprofile for like in sent_likes if hasattr(like.receiver, 'userprofile')]
        likes_sent_data = UserProfileSerializer(likes_sent_profiles, many=True).data

        received_likes = Like.objects.filter(receiver=user)
        likes_received_profiles = [like.liker.userprofile for like in received_likes if hasattr(like.liker, 'userprofile')]
        likes_received_data = UserProfileSerializer(likes_received_profiles, many=True).data

        return Response({
            'likes_sent': likes_sent_data,
            'likes_received': likes_received_data
        })


class LikeViewSet(viewsets.GenericViewSet):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated] 

    @action(detail=False, methods=['get'])
    def received_likes(self, request):
        received_likes = self.get_queryset().filter(receiver=request.user)
        serializer = self.get_serializer(received_likes, many=True)
        return Response(serializer.data)

    def create(self, request):
        sender = request.user 
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        receiver_obj = serializer.validated_data['receiver']
        receiver_id = receiver_obj.id
        
        if Like.objects.filter(liker=sender, receiver_id=receiver_id).exists(): 
            return Response({"detail": "이미 좋아요를 보냈습니다."}, status=status.HTTP_400_BAD_REQUEST)
        
        like = serializer.save(liker=sender) 
        
        is_matched = Like.objects.filter(liker_id=receiver_id, receiver=sender).exists()

        if is_matched:
            return Response({'detail': "매칭 성공!", 'is_matched': True, 'receiver_id': receiver_id}, status=status.HTTP_201_CREATED)
        
        return Response({'detail': "좋아요 성공!", 'is_matched': False, 'receiver_id': receiver_id}, status=status.HTTP_201_CREATED)


class RegistrationViewSet(viewsets.GenericViewSet):
    serializer_class = UserRegistrationSerializer 
    permission_classes = [permissions.AllowAny] 
    parser_classes = (MultiPartParser, FormParser)
    
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        return Response({
            "user_id": user.id,
            "username": user.username,
            "message": "회원가입과 프로필 생성이 완료되었습니다."
        }, status=status.HTTP_201_CREATED)