from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from .models import UserProfile, Like
from chat.models import ChatRoom

# 1. UserProfile Serializer (기존 유지)
# -> 나중에 프로필 완성하기(ProfileForm.js)에서 사용됩니다.
class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id')
    # use_url=True로 설정하면 이미지의 전체 URL을 리턴해줍니다 (프론트에서 보기 편함)
    profile_picture = serializers.ImageField(required=False, use_url=True)

    class Meta:
        model = UserProfile
        fields = ['user', 'nickname', 'age', 'gender', 'bio', 'interests', 'location', 'profile_picture']

# 2. Like Serializer (기존 유지)
class LikeSerializer(serializers.ModelSerializer):
    liker = serializers.ReadOnlyField(source='liker.id')
    receiver = serializers.IntegerField()

    class Meta:
        model = Like
        fields = ['id', 'liker', 'receiver', 'created_at']
        read_only_fields = ['created_at']

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

        data['receiver'] = receiver
        return data

    def create(self, validated_data):
        like = Like.objects.create(**validated_data)
        liker = validated_data['liker']
        receiver = validated_data['receiver']
        
        is_match = Like.objects.filter(liker=receiver, receiver=liker).exists()
        
        if is_match:
            user_a, user_b = sorted([liker, receiver], key=lambda u: u.id)
            if not ChatRoom.objects.filter(user1=user_a, user2=user_b).exists():
                ChatRoom.objects.create(
                    user1=user_a,
                    user2=user_b,
                    name=f'chat_{user_a.id}_{user_b.id}'
                )
                print(f"매칭 성사! 채팅방 생성: chat_{user_a.id}_{user_b.id}")
        return like

# 📌 3. User Registration Serializer (수정됨!)
# -> 회원가입 때는 닉네임, 나이 등을 필수가 아닌 '선택'으로 바꿨습니다.
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    # 📸 프로필 사진 추가 (선택사항)
    profile_picture = serializers.ImageField(write_only=True, required=False)

    # 🚨 중요: 나중에 입력받을 정보들은 required=False로 설정해야 에러가 안 납니다.
    nickname = serializers.CharField(write_only=True, required=False)
    age = serializers.IntegerField(write_only=True, required=False)
    gender = serializers.CharField(write_only=True, required=False)
    location = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'nickname', 'age', 'gender', 'location', 'profile_picture')
        read_only_fields = ('id',) 

    @transaction.atomic 
    def create(self, validated_data):
        # 1. 프로필 데이터 추출 (없으면 None이나 빈 값으로 처리)
        profile_data = {
            'nickname': validated_data.pop('nickname', None), # 값이 없으면 None
            'age': validated_data.pop('age', None),
            'gender': validated_data.pop('gender', None),
            'location': validated_data.pop('location', ''),
            'profile_picture': validated_data.pop('profile_picture', None)
        }
        
        # 2. User 생성
        password = validated_data.pop('password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''), 
            password=password
        )
        
        # 3. UserProfile 생성
        UserProfile.objects.create(user=user, **profile_data)
        
        return user