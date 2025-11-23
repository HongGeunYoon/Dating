// src/components/MatchCard.js (최종 수정된 전체 코드 - 거주지역 출력 안정화)

import React, { useCallback } from 'react';
import axios from 'axios';
import { Card, Button } from 'react-bootstrap'; 

function MatchCard({ profile, onLikeSuccess, onMatchSuccess }) {
    const token = localStorage.getItem('accessToken');
    
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
            if (response.data.is_match) {
                const roomName = response.data.room_name;
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
    
    // 성별 이모지 표시
    const getGenderEmoji = (gender) => {
        if (gender === 'M') return '👨';
        if (gender === 'F') return '👩';
        return '❓';
    };

    return (
        <Card style={{ width: '18rem', margin: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.12)' }}>
            
            <Card.Img 
                variant="top" 
                src={
                    profile.profile_picture 
                    ? 'http://127.0.0.1:8000/media/' + profile.profile_picture
                    : "https://via.placeholder.com/286x180?text=Profile+Image"
                } 
                alt={`${profile.nickname}의 프로필 이미지`}
                style={{ height: "200px", objectFit: "cover" }}
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
