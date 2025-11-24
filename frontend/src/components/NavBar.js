// src/components/NavBar.js (뷰 전환 함수 onNavigate 통합 버전)

import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import './NavBar.css';

// props: onNavigate(뷰 전환), onLogout(로그아웃), currentView(현재 뷰 상태)
function NavBar({ onNavigate, onLogout, currentView }) {
    // 뷰 전환을 처리하는 로컬 함수
    const handleNavigation = (viewName) => {
        onNavigate(viewName);
    };

    // 로그인 여부를 토큰으로 판단
    const isAuthenticated = localStorage.getItem('accessToken');

    if (!isAuthenticated) {
        return null; // 로그인 페이지에서는 NavBar를 표시하지 않음
    }

    return (
        <Navbar bg="light" expand="lg" sticky="top" className="instagram-navbar">
            <Container>
                <Navbar.Brand 
                    href="#" 
                    onClick={() => handleNavigation('match_list')} 
                    style={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ❤️ DatingApp
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {/* 매칭 목록 */}
                        <Nav.Link 
                            href="#" 
                            onClick={() => handleNavigation('match_list')} 
                            active={currentView === 'match_list'}
                        >
                            매칭
                        </Nav.Link>
                        
                        {/* 채팅 목록 */}
                        <Nav.Link 
                            href="#" 
                            onClick={() => handleNavigation('chat_list')}
                            active={currentView === 'chat_list' || currentView === 'chat'}
                        >
                            채팅
                        </Nav.Link>
                        
                        {/* 🔑 [추가] 통계 페이지 */}
                        <Nav.Link 
                            href="#" 
                            onClick={() => handleNavigation('stats')}
                            active={currentView === 'stats'}
                        >
                            통계
                        </Nav.Link>
                    </Nav>
                    <Nav>
                        <Button variant="outline-danger" onClick={onLogout}>
                            로그아웃
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavBar;