// Login.js (회원가입 링크 추가 및 Bootstrap 적용)

import React, { useState } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap'; // 🔑 Bootstrap 컴포넌트 임포트

// 🔑 onRegisterClick 프롭을 받도록 정의합니다.
function Login({ onLoginSuccess, onRegisterClick }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // 에러 메시지 상태 추가

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null); // 로그인 시도 시 에러 초기화

    try {
      const url = 'http://127.0.0.1:8000/api/token/';
      const { data } = await axios.post(url, { username, password });
      onLoginSuccess(data.access);

      // Access Token을 App.js로 전달하고 로컬 저장소에 저장합니다.
      // onLoginSuccess(response.data.access); 
      // // alert("로그인 성공!"); (Alert 대신 App.js에서 화면 전환으로 성공 표시)

    } catch (error) {
      setError("로그인 실패: ID 또는 비밀번호를 확인해주세요.");
      console.error("Login failed:", error);
    }
  };

  return (
  <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
     <Card style={{ width: '22rem', padding: '20px' }}>
      <Card.Body>
        <h2 className="text-center mb-4">로그인</h2>

          {/* 🔑 에러 메시지 표시 */}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3" controlId="formBasicUsername">
               <Form.Label>사용자 ID</Form.Label>
                <Form.Control 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="사용자 ID 입력" 
                required 
              />
               </Form.Group>
               
               <Form.Group className="mb-4" controlId="formBasicPassword">
                <Form.Label>비밀번호</Form.Label>
                <Form.Control 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="비밀번호 입력" 
                required 
              />
               </Form.Group>
               
                <Button variant="primary" type="submit" className="w-100 mb-3">
                   로그인
             </Button>
           </Form>

          {/* 🔑 회원가입 버튼/링크 추가 */}
          <div className="text-center mt-3">
            계정이 없으신가요? 
            <button 
              type="button" 
              onClick={onRegisterClick}
              style={{ marginLeft: '5px', fontWeight: 'bold',cursor: 'pointer',backgroundColor: 'transparent',border: 'none',padding: 0,color: 'blue',textDecoration: 'underline' }}
            >
              회원가입
            </button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;