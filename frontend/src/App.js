// App.js (NavBar 통합 및 뷰 관리 개선 버전 - 최종)
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
import Stats from './pages/Stats' // 👈 통계 컴포넌트 임포트


function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const [isProfileSet, setIsProfileSet] = useState(false); 
    const [matchProfiles, setMatchProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [currentView, setCurrentView] = useState('match_list'); 
    const [activeRoomName, setActiveRoomName] = useState(null); 
    
    // 🔑 채팅 목록 상태
    const [chatRooms, setChatRooms] = useState([]);

    // 🔑 로그아웃 처리 함수
    const handleLogout = useCallback(() => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
        setIsProfileSet(false);
        setMatchProfiles([]);
        setChatRooms([]);
        setCurrentView('login'); 
    }, []);

    // 🔑 프로필 존재 여부를 서버에서 확인하는 함수
    const checkProfileExistence = useCallback(async (token) => {
        try {
            const response = await axios.get(
                'http://127.0.0.1:8000/api/users/userprofile/me/', 
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setIsProfileSet(response.status === 200);
            return response.status === 200;
        } catch (error) {
            if (error.response?.status === 404) {
                setIsProfileSet(false);
                return false;
            } else if (error.response?.status === 401) {
                handleLogout();
            }
            console.error("프로필 확인 중 오류 발생:", error);
            setIsProfileSet(false);
            return false;
        }
    }, [handleLogout]);

    // 🔑 매칭 대상을 불러오는 함수
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
            console.error("매칭 목록 불러오기 실패:", error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [handleLogout]);

    // 🔑 채팅방 목록을 불러오는 함수
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
            console.error("채팅방 목록 불러오기 실패:", error);
            if (error.response?.status === 401) {
                 handleLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [handleLogout]);


    // 1. 앱 시작 시 로그인 상태와 프로필 상태 확인
    useEffect(() => {
        const token = localStorage.getItem('accessToken'); 
        if (token) {
            setIsLoggedIn(true);
            checkProfileExistence(token).then((profileExists) => {
                if (!profileExists) {
                    setCurrentView('profile_form');
                } else {
                    setCurrentView('match_list'); 
                }
            }).finally(() => {
                setLoading(false);
            });
        } else {
            setLoading(false);
            setCurrentView('login');
        }
    }, [checkProfileExistence]); 

    // 2. 로그인 및 프로필 설정 상태가 변경되거나 뷰가 변경될 때 데이터 로드
    useEffect(() => {
        if (isLoggedIn && isProfileSet) {
            if (currentView === 'match_list') {
                fetchMatches();
            } else if (currentView === 'chat_list') {
                fetchChatRooms();
            } 
            // 🔑 'stats' 뷰는 데이터 로드를 'Stats.js' 컴포넌트 내부에서 처리합니다.
        }
    }, [isLoggedIn, isProfileSet, fetchMatches, fetchChatRooms, currentView]);

    // 🔑 뷰 전환 및 데이터 로드 통합 함수 (NavBar에서 사용)
    const navigateTo = useCallback((viewName) => {
        setCurrentView(viewName);
        if (viewName === 'match_list') {
            fetchMatches(); 
        } else if (viewName === 'chat_list') {
            fetchChatRooms(); 
        }
        // 🔑 'stats' 뷰는 추가적인 로드 함수 호출이 필요 없습니다.
    }, [fetchMatches, fetchChatRooms]);

    // 🔑 로그인 성공 처리 함수
    const handleLoginSuccess = useCallback(async (token) => {
        localStorage.setItem('accessToken', token);
        setIsLoggedIn(true);
        const profileExists = await checkProfileExistence(token);
        if (profileExists) {
            setCurrentView('match_list'); 
        } else {
            setCurrentView('profile_form');
        }
    }, [checkProfileExistence]);

    // 🔑 프로필 생성 완료 시 호출될 함수
    const handleProfileCreated = useCallback(() => {
        setIsProfileSet(true);
        navigateTo('match_list'); 
    }, [navigateTo]);
    
    // 🔑 MatchCard에서 호출: 좋아요 성공 후 목록에서 해당 프로필 제거
    const handleLikeSuccess = useCallback((likedUserId) => {
        setMatchProfiles(prevProfiles => prevProfiles.filter(p => p.user !== likedUserId));
    }, []);

    // 🔑 MatchCard에서 호출: 매칭 성공 시 채팅방으로 이동
    const handleMatchSuccess = useCallback((roomName) => {
        setActiveRoomName(roomName);
        setCurrentView('chat');
    }, []);

    // 🔑 JWT에서 사용자 ID 추출
    const getCurrentUserId = () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                const payload = token.split('.')[1];
                const decodedPayload = JSON.parse(atob(payload));
                return decodedPayload.user_id; 
            }
        } catch (e) {
            console.error("JWT 파싱 실패:", e);
        }
        return null;
    };


    // --- 렌더링 로직 ---
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>앱 데이터를 로딩 중입니다...</div>;
    }
    
    // 1. 로그인 또는 프로필 설정 뷰 (NavBar 없음)
    if (currentView === 'login' || currentView === 'register' || !isLoggedIn) {
        
        // 🔑 A. 회원가입 뷰 처리
        if (currentView === 'register') {
            // 회원가입 성공 시 'login' 뷰로 돌아가도록 설정
            return <Register onRegisterSuccess={() => setCurrentView('login')} />;
        }
        
        // 🔑 B. 로그인 뷰 처리 (기존 로직 + 회원가입 버튼 클릭 시 전환 기능 추가)
        return (
            <Login 
                onLoginSuccess={handleLoginSuccess} 
                // Login 컴포넌트 내의 '회원가입' 버튼 클릭 시 'register' 뷰로 전환
                onRegisterClick={() => setCurrentView('register')} 
            />
        );
    }
    
    if (currentView === 'profile_form' || (isLoggedIn && !isProfileSet)) {
        return <ProfileForm onProfileCreated={handleProfileCreated} />;
    }
    
    // 2. 로그인 및 프로필 설정이 완료된 경우 (NavBar를 포함하여 렌더링)
    
    let mainContent;
    
    if (currentView === 'chat' && activeRoomName) {
        mainContent = (
            <ChatRoom 
                roomName={activeRoomName} 
                onClose={() => navigateTo('chat_list')} // 닫힐 때 navigateTo를 사용하여 채팅 목록으로 이동
            />
        );
    } else if (currentView === 'chat_list') {
        // 🔑 채팅 목록 뷰 ('chat_list')
        const currentUserId = getCurrentUserId();
        mainContent = (
            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
                <h1 style={{ textAlign: 'center' }}>내 채팅 목록 💬</h1>
                
                {loading ? (
                    <p style={{ textAlign: 'center' }}><Spinner animation="border" size="sm" /> 채팅방 목록 로딩 중...</p>
                ) : chatRooms.length > 0 ? (
                    chatRooms.map(room => {
                        const targetNickname = (room.user1.toString() === currentUserId.toString()) 
                            ? room.user2_nickname 
                            : room.user1_nickname;
                            
                        return (
                            <div 
                                key={room.id} 
                                onClick={() => handleMatchSuccess(room.name)} 
                                style={{ 
                                    padding: '15px', 
                                    borderBottom: '1px solid #eee', 
                                    borderRadius: '5px', 
                                    cursor: 'pointer', 
                                    backgroundColor: '#fff',
                                    marginTop: '10px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}
                            >
                                <strong>{targetNickname}</strong> 님과의 대화
                                <p style={{ fontSize: '0.8em', color: '#999', marginTop: '5px' }}>
                                    {new Date(room.created_at).toLocaleDateString()}에 생성됨
                                </p>
                            </div>
                        );
                    })
                ) : (
                    <p style={{ textAlign: 'center', marginTop: '30px' }}>아직 생성된 채팅방이 없습니다.</p>
                )}
            </div>
        );
    } else if (currentView === 'stats') {
        // 🔑 [추가] 통계 뷰 ('stats')
        mainContent = <Stats />;
        
    } else { 
        // 🔑 매칭 목록 뷰 ('match_list')
        mainContent = (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>오늘의 매칭 대상 ✨</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {matchProfiles.length > 0 ? (
                        matchProfiles.map(profile => (
                            <MatchCard 
                                key={profile.user} 
                                profile={profile} 
                                onLikeSuccess={handleLikeSuccess} 
                                onMatchSuccess={handleMatchSuccess}
                            />
                        ))
                    ) : (
                        <p style={{ marginTop: '20px', fontSize: '1.1em' }}>
                            주변에 매칭 가능한 프로필이 없습니다. (새로운 프로필이 등록되길 기다려보세요!)
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // 최종 렌더링: NavBar와 Main Content를 함께 렌더링
    return (
        <React.Fragment>
            {/* NavBar에 뷰 전환 함수와 로그아웃 함수를 전달합니다. */}
            <NavBar 
                onNavigate={navigateTo} 
                onLogout={handleLogout} 
                currentView={currentView}
            />
            {/* Bootstrap Container로 중앙 콘텐츠를 감싸서 여백을 줍니다. */}
            <Container className="mt-4">
                {mainContent}
            </Container>
        </React.Fragment>
    );
}

export default App;