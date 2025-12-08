import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';

// 회원가입 컴포넌트
function Register({ onRegisterSuccess }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    
    // 📸 [추가] 이미지 파일을 저장할 상태
    const [profileImg, setProfileImg] = useState(null);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // 텍스트 입력 핸들러
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // 📸 [추가] 파일 선택 핸들러
    const handleFileChange = (e) => {
        setProfileImg(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // 📸 [핵심 수정] JSON 대신 FormData 객체 사용
        const submitData = new FormData();
        submitData.append('username', formData.username);
        submitData.append('email', formData.email);
        submitData.append('password', formData.password);
        
        // 이미지가 선택되었다면 FormData에 추가
        if (profileImg) {
            submitData.append('profile_picture', profileImg);
        }

        try {
            // 백엔드 회원가입 API 호출
            const response = await axios.post(
                'http://127.0.0.1:8000/api/users/register/', 
                submitData,
                {
                    headers: {
                        // 📸 파일 전송을 위해 multipart/form-data 설정 (보통 생략해도 axios가 자동 설정함)
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setMessage(`🎉 ${response.data.username}님, 회원가입 완료! 프로필 사진도 저장되었습니다.`);
            
            // 성공 후 처리가 있다면 실행
            if (onRegisterSuccess) {
                // 1.5초 뒤 로그인 화면 등으로 전환
                setTimeout(() => onRegisterSuccess(), 1500);
            }

        } catch (err) {
            console.error("회원가입 실패:", err.response?.data || err.message);
            
            if (err.response?.data) {
                const errorData = err.response.data;
                if (errorData.username) {
                    setError(`아이디 오류: ${errorData.username[0]}`);
                } else if (errorData.email) {
                    setError(`이메일 오류: ${errorData.email[0]}`);
                } else if (errorData.password) {
                    setError(`비밀번호 오류: ${errorData.password[0]}`);
                } else if (errorData.detail) {
                    setError(errorData.detail);
                } else {
                    // 기타 오류 내용을 문자열로 보여줌
                    setError(JSON.stringify(errorData));
                }
            } else {
                setError("서버와 통신할 수 없습니다.");
            }
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '25rem', padding: '20px' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">회원가입</h2>
                    
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicUsername">
                            <Form.Label>사용자 ID</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="사용할 ID를 입력하세요" 
                                name="username"
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>이메일</Form.Label>
                            <Form.Control 
                                type="email" 
                                placeholder="이메일을 입력하세요" 
                                name="email"
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicPassword">
                            <Form.Label>비밀번호</Form.Label>
                            <Form.Control 
                                type="password" 
                                placeholder="비밀번호를 입력하세요" 
                                name="password"
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        {/* 📸 [추가] 프로필 사진 업로드 필드 */}
                        <Form.Group className="mb-4" controlId="formFile">
                            <Form.Label>프로필 사진 (선택)</Form.Label>
                            <Form.Control 
                                type="file" 
                                accept="image/*" // 이미지 파일만 선택 가능
                                onChange={handleFileChange}
                            />
                        </Form.Group>

                        <Button variant="success" type="submit" className="w-100">
                            가입하기
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Register;