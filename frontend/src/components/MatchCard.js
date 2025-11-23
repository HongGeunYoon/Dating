// src/components/MatchCard.js (최종 수정된 전체 코드 - 오류 처리 강화)

import React, { useCallback } from 'react';
import axios from 'axios';
import { Card, Button } from 'react-bootstrap'; 

// MatchCard 컴포넌트: 프로필을 표시하고 좋아요/싫어요 기능을 처리합니다.
function MatchCard({ profile, onLikeSuccess, onMatchSuccess }) {
    const token = localStorage.getItem('accessToken');
    
    // 🔑 좋아요/싫어요 API 호출 함수
    const handleLike = useCallback(async (action) => {
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/users/like/', 
                { 
                    receiver: profile.user, // 상대방 사용자 ID
                    action: action // 'like' 또는 'pass'
                },
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    } 
                }
            );

            // 1. 성공 처리: 매칭 목록에서 카드를 제거합니다.
            onLikeSuccess(profile.user); 
            
            // 2. 매칭 성공 여부 확인
            if (response.data.is_match) {
                const roomName = response.data.room_name; // 서버에서 받은 채팅방 이름
                alert(`${profile.nickname}님과 매칭되었습니다! 🎉 채팅을 시작하세요!`);
                onMatchSuccess(roomName); // App.js로 매칭 성공 전달
            } else if (action === 'like') {
                alert(`'${profile.nickname}'님에게 좋아요를 보냈습니다.`);
            }

        } catch (error) {
            console.error("좋아요/싫어요 처리 실패:", error.response?.data || error.message);
            
            let errorMessage = '요청 처리 중 서버 오류가 발생했습니다.';
            const errorData = error.response?.data;

            if (error.response?.status === 400 && errorData) {
                // DRF 스타일의 에러 메시지 추출
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
                    errorMessage = errorData.non_field_errors[0];
                } else if (errorData.target_user_id) {
                    errorMessage = `대상 사용자 ID 오류: ${errorData.target_user_id[0]}`;
                }

                // 🚨 [핵심] 중복 좋아요, 이미 매칭된 경우 등 불필요한 카드를 제거하고 사용자에게 알림
                if (
                    errorMessage.includes("이미 좋아요를 누르셨") || 
                    errorMessage.includes("자기 자신에게") ||
                    errorMessage.includes("이미 매칭된 사용자")
                ) {
                    alert(`알림: ${errorMessage}. 화면을 정리합니다.`);
                    onLikeSuccess(profile.user); // 카드를 목록에서 제거
                    return; 
                }
            }
            
            // 일반적인 실패 알림
            alert(`처리 실패: ${errorMessage}`);
        }
    }, [token, profile.user, profile.nickname, onLikeSuccess, onMatchSuccess]);
    
    // 성별 이모지 표시 함수
    const getGenderEmoji = (gender) => {
        if (gender === 'M') return '👨';
        if (gender === 'F') return '👩';
        return '❓';
    };

    return (
        <Card style={{ width: '18rem', margin: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            
            <Card.Img 
                variant="top" 
                src={
                    // 🔑 [최종 수정] API가 반환한 URL을 그대로 사용합니다.
                    profile.profile_picture 
                    ? 'http://127.0.0.1:8000/media/' + profile.profile_picture // Django API에서 이미 전체 URL을 반환하고 있습니다.
                    : "https://via.placeholder.com/286x180?text=Profile+Image"
                } 
                alt={`${profile.nickname}의 프로필 이미지`}
            />
            
            <Card.Body>
                <Card.Title>
                    {profile.nickname} {getGenderEmoji(profile.gender)}
                </Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                    {profile.age}세, {profile.location}
                </Card.Subtitle>
                
                <Card.Text>
                    {profile.bio || '자기소개가 없습니다.'}
                </Card.Text>

                <div className="d-flex justify-content-between mt-3">
                    {/* 싫어요 버튼 (Pass) */}
                    <Button 
                        variant="secondary" 
                        onClick={() => handleLike('pass')}
                        style={{ width: '45%' }}
                    >
                        ❌ Pass
                    </Button>
                    
                    {/* 좋아요 버튼 (Like) */}
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