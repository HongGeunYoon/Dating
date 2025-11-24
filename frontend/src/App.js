import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ProfileForm from './components/ProfileForm';
import MatchCard from './components/MatchCard';
import Login from './components/Login'; 
import Register from './components/Register';
import ChatRoom from './components/ChatRoom'; 
import NavBar from './components/NavBar';
import { Container, Spinner } from 'react-bootstrap'; 
import Stats from './pages/Stats'; 

function App() {
    // 🚨 [중요 변경] 기본 뷰를 'match_list'가 아니라 'login'으로 설정
    const [currentView, setCurrentView] = useState('login'); 
    
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const [isProfileSet, setIsProfileSet] = useState(false); 
    const [matchProfiles, setMatchProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeRoomName, setActiveRoomName] = useState(null); 
    const [chatRooms, setChatRooms] = useState([]);

    // 로그아웃 처리
    const handleLogout = useCallback(() => {
        localStorage.removeItem('accessToken'); // 토큰 삭제
        setIsLoggedIn(false);
        setIsProfileSet(false);
        setMatchProfiles([]);
        setChatRooms([]);
        setCurrentView('login'); // 로그인 화면으로 강제 이동
    }, []);

    // 프로필 존재 여부(닉네임 유무) 확인 함수
    const checkProfileExistence = useCallback(async (token) => {
        try {
            const response = await axios.get(
                'http://127.0.0.1:8000/api/users/userprofile/me/', 
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            const userData = response.data;
            // 닉네임이 있어야만 "프로필 완성됨"으로 인정
            const isProfileComplete = userData && userData.nickname && userData.nickname.trim() !== '';

            setIsProfileSet(isProfileComplete);
            return isProfileComplete;

        } catch (error) {
            if (error.response?.status === 404) {
                setIsProfileSet(false);
                return false;
            } else if (error.response?.status === 401) {
                // 인증 만료되면 로그아웃 처리
                handleLogout();
            }
            setIsProfileSet(false);
            return false;
        }
    }, [handleLogout]);

    // 매칭 리스트 불러오기
    const fetchMatches = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return; 

        setLoading(true);
        try {
            const response = await axios.get(
                'http://127.0.0.1:8000/api/users/userprofile/matches/',
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setMatchProfiles(response.data);
        } catch (error) {
            if (error.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    }, [handleLogout]);

    // 채팅방 목록 불러오기
    const fetchChatRooms = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        setLoading(true);
        try {
            const response = await axios.get(
                'http://127.0.0.1:8000/api/chat/rooms/',
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setChatRooms(response.data);
            setCurrentView('chat_list'); 
        } catch (error) {
            if (error.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    }, [handleLogout]);

    // 🚀 [앱 시작 로직] 토큰 체크
    useEffect(() => {
        const token = localStorage.getItem('accessToken'); 
        
        if (token) {
            // 토큰이 있으면 검증 시작
            setIsLoggedIn(true);
            checkProfileExistence(token).then((isComplete) => {
                if (isComplete) {
                    setCurrentView('match_list'); // 프로필 있으면 메인
                } else {
                    setCurrentView('profile_form'); // 프로필 없으면 완성 페이지
                }
            }).finally(() => {
                setLoading(false);
            });
        } else {
            // 토큰이 없으면 확실하게 로그인 페이지로
            setIsLoggedIn(false);
            setCurrentView('login');
            setLoading(false);
        }
    }, [checkProfileExistence]); 

    // 데이터 로드 관리
    useEffect(() => {
        if (isLoggedIn && isProfileSet) {
            if (currentView === 'match_list') {
                fetchMatches();
            } else if (currentView === 'chat_list') {
                fetchChatRooms();
            } 
        }
    }, [isLoggedIn, isProfileSet, fetchMatches, fetchChatRooms, currentView]);

    // 화면 전환 함수
    const navigateTo = useCallback((viewName) => {
        setCurrentView(viewName);
        if (viewName === 'match_list') fetchMatches(); 
        else if (viewName === 'chat_list') fetchChatRooms(); 
    }, [fetchMatches, fetchChatRooms]);

    // 📌 로그인 성공 시 처리 (Login.js에서 호출)
    const handleLoginSuccess = useCallback(async (token) => {
        localStorage.setItem('accessToken', token);
        setIsLoggedIn(true);
        
        // 로그인 직후 닉네임 확인
        const isComplete = await checkProfileExistence(token);
        
        if (isComplete) {
            setCurrentView('match_list'); // 닉네임 O -> 메인
        } else {
            setCurrentView('profile_form'); // 닉네임 X -> 프로필 완성
        }
    }, [checkProfileExistence]);

    // 프로필 생성 완료 시 처리
    const handleProfileCreated = useCallback(() => {
        setIsProfileSet(true);
        navigateTo('match_list'); 
    }, [navigateTo]);
    
    const handleLikeSuccess = useCallback((likedUserId) => {
        setMatchProfiles(prevProfiles => prevProfiles.filter(p => p.user !== likedUserId));
    }, []);

    const handleMatchSuccess = useCallback((roomName) => {
        setActiveRoomName(roomName);
        setCurrentView('chat');
    }, []);

    const getCurrentUserId = () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                return JSON.parse(atob(token.split('.')[1])).user_id; 
            }
        } catch (e) { return null; }
    };

    // --- 렌더링 시작 ---
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spinner animation="border" /> 로딩 중...</div>;
    }
    
    // 1. 로그인 / 회원가입 화면 (가장 먼저 체크)
    if (!isLoggedIn || currentView === 'login' || currentView === 'register') {
        if (currentView === 'register') {
            return <Register onRegisterSuccess={() => setCurrentView('login')} />;
        }
        return (
            <Login 
                onLoginSuccess={handleLoginSuccess} 
                onRegisterClick={() => setCurrentView('register')} 
            />
        );
    }
    
    // 2. 프로필 미완성 시 (무조건 프로필 폼 보여주기)
    if (currentView === 'profile_form' || !isProfileSet) {
        return <ProfileForm onProfileCreated={handleProfileCreated} />;
    }
    
    // 3. 메인 앱 화면
    let mainContent;
    
    if (currentView === 'chat' && activeRoomName) {
        mainContent = <ChatRoom roomName={activeRoomName} onClose={() => navigateTo('chat_list')} />;
    } else if (currentView === 'chat_list') {
        const currentUserId = getCurrentUserId();
        mainContent = (
            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center' }}>내 채팅 목록 💬</h1>
                {chatRooms.length > 0 ? chatRooms.map(room => (
                    <div key={room.id} onClick={() => handleMatchSuccess(room.name)} 
                        style={{ padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: '#fff', marginTop: '10px' }}>
                        <strong>{(room.user1.toString() === currentUserId.toString()) ? room.user2_nickname : room.user1_nickname}</strong> 님과의 대화
                    </div>
                )) : <p style={{ textAlign: 'center', marginTop: '30px' }}>채팅방이 없습니다.</p>}
            </div>
        );
    } else if (currentView === 'stats') {
        mainContent = <Stats />;
    } else { 
        mainContent = (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>오늘의 매칭 대상 ✨</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {matchProfiles.length > 0 ? matchProfiles.map(profile => (
                        <MatchCard key={profile.user} profile={profile} onLikeSuccess={handleLikeSuccess} onMatchSuccess={handleMatchSuccess}/>
                    )) : <p style={{ marginTop: '20px' }}>매칭 가능한 프로필이 없습니다.</p>}
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <NavBar onNavigate={navigateTo} onLogout={handleLogout} currentView={currentView} />
            <Container className="mt-4">{mainContent}</Container>
        </React.Fragment>
    );
}

export default App;