import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';

function ProfileForm({ onProfileCreated }) {
  const [formData, setFormData] = useState({
    nickname: '',
    age: '',
    gender: 'M', // 기본값 남성
    bio: '',
    interests: '',
    location: '',
  });
  
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // 🚀 [수정됨] ID를 조회할 필요 없이 바로 'me' 주소로 수정 요청(PATCH)을 보냅니다.
      // 백엔드의 me 함수가 이 요청을 받아서 현재 로그인한 유저의 프로필을 업데이트합니다.
      const url = 'http://127.0.0.1:8000/api/users/userprofile/me/';
      
      const response = await axios.patch(url, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      alert(`${response.data.nickname}님, 프로필 설정이 완료되었습니다!`);
      
      // App.js에 알림 -> App.js는 isProfileSet을 true로 바꾸고 메인 화면으로 전환함
      onProfileCreated(response.data); 

    } catch (error) {
      console.error("프로필 저장 실패:", error.response?.data || error);
      
      if (error.response?.data) {
          // 에러 메시지 처리
          const errorData = error.response.data;
          const errorMsg = typeof errorData === 'object' 
              ? Object.values(errorData)[0] 
              : "오류가 발생했습니다.";
          setError(`저장 실패: ${errorMsg}`);
      } else {
          setError("서버 연결 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '30rem', padding: '20px' }}>
        <Card.Body>
            <h2 className="text-center mb-4">내 프로필 완성하기</h2>
            <p className="text-muted text-center">소개팅을 시작하기 위해 나머지 정보를 입력해주세요!</p>
            
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>닉네임</Form.Label>
                    <Form.Control
                        name="nickname"
                        type="text"
                        placeholder="닉네임 입력"
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>나이</Form.Label>
                    <Form.Control
                        name="age"
                        type="number"
                        placeholder="나이 입력"
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>성별</Form.Label>
                    <Form.Select name="gender" onChange={handleChange} value={formData.gender}>
                        <option value="M">남성</option>
                        <option value="F">여성</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>거주 지역</Form.Label>
                    <Form.Control
                        name="location"
                        type="text"
                        placeholder="예: 서울 강남구"
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>관심사</Form.Label>
                    <Form.Control
                        name="interests"
                        type="text"
                        placeholder="예: 영화, 등산, 맛집탐방"
                        onChange={handleChange}
                    />
                </Form.Group>

                <Form.Group className="mb-4">
                    <Form.Label>자기소개</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="bio"
                        placeholder="간단한 자기소개를 입력해주세요."
                        onChange={handleChange}
                    />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100">
                    소개팅 시작하기!
                </Button>
            </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ProfileForm;