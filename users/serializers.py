# users/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Like # UserProfile 및 Like 모델이 정의된 파일 임포트
from chat.models import ChatRoom

# 1. UserProfile Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    # 'user' 필드는 읽기 전용으로 설정
    user = serializers.ReadOnlyField(source='user.id')
    profile_picture = serializers.ImageField(required=False, use_url=False)

    class Meta:
        model = UserProfile
        fields = ['user', 'nickname', 'age', 'gender', 'bio', 'interests','profile_picture']

# 2. Like Serializer (좋아요 생성/조회)
class LikeSerializer(serializers.ModelSerializer):
    liker = serializers.ReadOnlyField(source='liker.id')
    receiver = serializers.IntegerField() # 좋아요를 받는 사람의 ID를 입력받음

    class Meta:
        model = Like
        fields = ['id', 'liker', 'receiver', 'created_at']
        read_only_fields = ['created_at']

    # 중복 좋아요 및 자기 자신 좋아요 방지 로직
    def validate(self, data):
        liker = self.context['request'].user
        receiver_id = data.get('receiver')
        
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"receiver": "존재하지 않는 사용자 ID입니다."})

        if liker == receiver:
            raise serializers.ValidationError("자기 자신에게 좋아요를 할 수 없습니다.")

        if Like.objects.filter(liker=liker, receiver=receiver).exists():
            raise serializers.ValidationError("이미 좋아요를 누르셨습니다.")

        # 유효성 검사 후 User 객체로 변환하여 뷰로 전달
        data['receiver'] = receiver 
        return data
    
    def create(self, validated_data):
        # 1. 좋아요 객체 생성
        like = Like.objects.create(**validated_data)
        
        liker = validated_data['liker'] # 좋아요를 누른 사람 (나)
        receiver = validated_data['receiver'] # 좋아요를 받은 사람 (상대방)
        
        # 2. 매칭 확인: 상대방이 나에게 좋아요를 눌렀는지 확인
        is_match = Like.objects.filter(liker=receiver, receiver=liker).exists()
        
        if is_match:
            # 3. 매칭 성사! -> ChatRoom 생성 로직 실행
            
            # user1과 user2를 ID가 낮은 순서로 정렬하여 unique_together 조건을 만족시키고 중복 생성 방지
            user_a, user_b = sorted([liker, receiver], key=lambda u: u.id)
            
            # 이미 방이 있는지 확인 (예외 방지)
            if not ChatRoom.objects.filter(user1=user_a, user2=user_b).exists():
                
                # 4. ChatRoom 생성
                ChatRoom.objects.create(
                    user1=user_a,
                    user2=user_b,
                    # 방 이름은 user ID 조합으로 생성 (예: chat_1_5)
                    name=f'chat_{user_a.id}_{user_b.id}' 
                )
                print(f"매칭 성사! 새로운 채팅방이 생성되었습니다: chat_{user_a.id}_{user_b.id}")
            else:
                print("채팅방이 이미 존재합니다.")
                
        return like
    
# 3. User Registration Serializer (회원가입)
class UserRegistrationSerializer(serializers.ModelSerializer):
    # 비밀번호 필드는 쓰기 전용으로 설정
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        read_only_fields = ('id',) 

    def create(self, validated_data):
        password = validated_data.pop('password')
        
        # Django의 기본 함수로 안전하게 사용자 생성
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''), 
            password=password
        )
        
        return user