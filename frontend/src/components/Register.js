import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';

// 회원가입 컴포넌트 정의
function Register({ onRegisterSuccess }) {
    // 🔑 1. 상태 관리: 입력 필드 및 메시지 상태 저장
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        // password2: '' // 비밀번호 확인 필드는 필요에 따라 추가
    });
    const [message, setMessage] = useState(''); // 성공/실패 메시지
    const [error, setError] = useState('');     // 에러 메시지

    // 🔑 2. 입력값 변경 처리 핸들러
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // 🔑 3. 폼 제출 핸들러 (API 호출)
    const handleSubmit = async (e) => {
        e.preventDefault(); // 기본 폼 제출 방지
        setMessage('');
        setError('');

        try {
            // 백엔드 회원가입 API 엔드포인트 호출
            const response = await axios.post(
                'http://127.0.0.1:8000/api/users/register/', 
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            // 회원가입 성공 처리
            setMessage(`🎉 ${response.data.username}님, 회원가입이 성공적으로 완료되었습니다!`);
            
            // 성공 후 로그인 페이지로 리다이렉트 (추가 구현 필요)
            if (onRegisterSuccess) {
                onRegisterSuccess(); 
            }

        } catch (err) {
            console.error("회원가입 실패:", err.response?.data || err.message);
            
            // DRF에서 받은 에러 메시지 표시
            if (err.response?.data) {
                const errorData = err.response.data;
                // DRF의 필드 에러를 문자열로 변환하여 표시
                if (errorData.username) {
                    setError(`사용자 이름 오류: ${errorData.username[0]}`);
                } else if (errorData.email) {
                    setError(`이메일 오류: ${errorData.email[0]}`);
                } else if (errorData.password) {
                    setError(`비밀번호 오류: ${errorData.password[0]}`);
                } else if (errorData.detail) {
                    setError(errorData.detail); // 기타 상세 오류
                } else {
                    setError("회원가입 중 알 수 없는 오류가 발생했습니다.");
                }
            } else {
                setError("서버와 통신할 수 없습니다. 네트워크를 확인하세요.");
            }
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '25rem', padding: '20px' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">회원가입</h2>
                    
                    {/* 성공/실패 메시지 표시 */}
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        {/* 사용자 ID (username) 필드 */}
                        <Form.Group className="mb-3" controlId="formBasicUsername">
                            <Form.Label>사용자 ID</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="사용할 ID를 입력하세요" 
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        {/* 이메일 (email) 필드 */}
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>이메일</Form.Label>
                            <Form.Control 
                                type="email" 
                                placeholder="이메일을 입력하세요" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        {/* 비밀번호 (password) 필드 */}
                        <Form.Group className="mb-4" controlId="formBasicPassword">
                            <Form.Label>비밀번호</Form.Label>
                            <Form.Control 
                                type="password" 
                                placeholder="비밀번호를 입력하세요" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
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