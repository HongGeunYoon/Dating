import React, { useCallback } from 'react';
import axios from 'axios';
import { Card, Button } from 'react-bootstrap'; 

function MatchCard({ profile, onLikeSuccess, onMatchSuccess }) {
    const token = localStorage.getItem('accessToken');

    // 🚀 [수정됨] 이미지 주소를 똑똑하게 처리하는 함수
    const getImageUrl = (path) => {
        // 1. 이미지가 없으면 기본 회색 이미지 보여줌
        if (!path) {
            return "https://via.placeholder.com/286x180?text=No+Image";
        }
        // 2. 만약 백엔드가 이미 'http'로 시작하는 완벽한 주소를 줬다면? -> 그대로 씀
        if (path.startsWith('http')) {
            return path;
        }
        // 3. 만약 '/media/...' 처럼 경로만 줬다면? -> 앞에 도메인만 붙임
        return `http://127.0.0.1:8000${path}`;
    };
    
    // 좋아요/싫어요 처리
    const handleLike = useCallback(async (action) => {
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/users/like/', 
                { 
                    receiver: profile.user,
                    action: action 
                },
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    } 
                }
            );

            onLikeSuccess(profile.user);

            // 매칭 성공 시 처리
            if (response.data.is_matched) { // is_match -> is_matched (백엔드 리턴값 확인 필요, 보통 is_matched로 짰음)
                const roomName = response.data.room_name || `chat_${Math.min(getCurrentUserId(), profile.user)}_${Math.max(getCurrentUserId(), profile.user)}`;
                alert(`${profile.nickname}님과 매칭되었습니다! 🎉`);
                onMatchSuccess(roomName);
            } else if (action === 'like') {
                alert(`'${profile.nickname}'님에게 좋아요를 보냈습니다.`);
            }

        } catch (error) {
            console.error("좋아요/싫어요 처리 실패:", error.response?.data || error.message);
            
            let errorMessage = '요청 처리 중 서버 오류가 발생했습니다.';
            const errorData = error.response?.data;

            if (error.response?.status === 400 && errorData) {
                if (errorData.detail) errorMessage = errorData.detail;
                else if (errorData.non_field_errors?.length > 0)
                    errorMessage = errorData.non_field_errors[0];

                if (
                    errorMessage.includes("이미 좋아요를 누르셨") || 
                    errorMessage.includes("자기 자신에게") ||
                    errorMessage.includes("이미 매칭된 사용자")
                ) {
                    alert(`알림: ${errorMessage}.`);
                    onLikeSuccess(profile.user);
                    return;
                }
            }
            
            alert(`처리 실패: ${errorMessage}`);
        }
    }, [token, profile.user, profile.nickname, onLikeSuccess, onMatchSuccess]);

    // JWT에서 내 ID 뽑는 헬퍼 함수 (매칭 룸 이름 만들 때 필요할 수 있음)
    const getCurrentUserId = () => {
        try {
            return JSON.parse(atob(token.split('.')[1])).user_id; 
        } catch (e) { return null; }
    };
    
    // 성별 이모지 표시
    const getGenderEmoji = (gender) => {
        if (gender === 'M') return '👨';
        if (gender === 'F') return '👩';
        return '❓';
    };

    return (
        <Card style={{ width: '18rem', margin: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.12)' }}>
            
            {/* 🚀 수정된 부분: getImageUrl 함수 사용 */}
            <Card.Img 
                variant="top" 
                src={getImageUrl(profile.profile_picture)} 
                alt={`${profile.nickname}의 프로필 이미지`}
                style={{ height: "300px", objectFit: "cover" }} // 사진 비율이 깨지지 않게 300px로 조정하고 cover 적용
            />
            
            <Card.Body>
                <Card.Title>
                    {profile.nickname} {getGenderEmoji(profile.gender)}
                </Card.Title>

                {/* 🔥 나이 + 거주지역 출력 */}
                <Card.Subtitle className="mb-2 text-muted">
                    {profile.age}세,
                    {" "}
                    {profile.location ? profile.location : "거주지역 미입력"}
                </Card.Subtitle>
                
                <Card.Text>
                    {profile.bio || '자기소개가 없습니다.'}
                </Card.Text>

                <div className="d-flex justify-content-between mt-3">
                    <Button 
                        variant="secondary" 
                        onClick={() => handleLike('pass')}
                        style={{ width: '45%' }}
                    >
                        ❌ Pass
                    </Button>
                    
                    <Button 
                        variant="danger" 
                        onClick={() => handleLike('like')}
                        style={{ width: '45%' }}
                    >
                        ❤️ Like
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}

export default MatchCard;