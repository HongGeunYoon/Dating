import React, { useState, useEffect, useRef } from 'react';
function ChatRoom({roomName, onClose}) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const ws = useRef(null); 
    
    // 토큰 상태를 관리하고, 초기값은 로컬 스토리지에서 가져옵니다.
    const [token, setToken] = useState(localStorage.getItem('accessToken'));
    
    // 토큰 갱신 로직을 감지하는 별도의 useEffect
    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentToken = localStorage.getItem('accessToken');
            // 로컬 스토리지의 토큰과 현재 상태의 토큰이 다를 경우 상태를 갱신합니다.
            if (token !== currentToken) {
                console.log("로컬 스토리지의 토큰이 갱신되었습니다. WebSocket 재연결 시도.");
                setToken(currentToken);
            }
        }, 1000); // 1초마다 체크
        return () => clearInterval(intervalId);
    }, [token]); 
    // WebSocket 연결 설정 및 정리 (메인 로직)
    useEffect(() => {
        // 1. Access Token 가져오기
        if (!token) { // token 상태를 사용
            console.error("채팅을 위해 Access Token이 필요합니다.");
            return;
        }
        // 2. WebSocket URL에 토큰을 쿼리 파라미터로 추가
        const socketUrl = `ws://127.0.0.1:8000/ws/chat/${roomName}/?token=${token}`; // token 상태를 사용
        
        // 3. WebSocket 객체를 지역 변수로 생성합니다.
        const localSocket = new WebSocket(socketUrl); 
        
        // 4. 메시지 전송 함수에서 사용하도록 Ref에 할당합니다.
        ws.current = localSocket; 
        // 5. 연결 이벤트 핸들러
        localSocket.onopen = () => {
            console.log('WebSocket 연결 성공:', roomName);
        };
        // 6. 메시지 수신 이벤트 핸들러
        localSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log('메시지 수신:', data);
            if (data.type === 'chat_message') {
                setMessages(prev => [...prev, {
                    content: data.message,
                    nickname: data.nickname,
                    timestamp: data.timestamp
                }]);
            } else if (data.type === 'chat_history') {
                setMessages(data.messages);
            }
        };
        // 7. 오류 및 닫힘 이벤트 핸들러
        localSocket.onclose = (e) => {
            console.log('WebSocket 연결 해제됨:', e.code, e.reason);
        };
        
        // 8. 컴포넌트 언마운트 또는 useEffect 재실행 시 연결 정리
        return () => {
            // localSocket 대신 ws.current를 사용하고 안전하게 정리 후 Ref를 초기화합니다.
            const currentSocket = ws.current;
            
            if (currentSocket && (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING)) {
                currentSocket.close();
                console.log("WebSocket 연결 클린업 완료: 중복 연결 종료.");
            }
            ws.current = null; // Ref 초기화 추가
        };
    // roomName 또는 token 상태가 변경될 때만 재실행!
    }, [roomName, token]); 
    // 메시지 전송 함수
    const sendMessage = () => {
        if (inputMessage.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                'message': inputMessage
            }));
            setInputMessage('');
        }
    };
    // ... (JSX 리턴 부분) ...
    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>{roomName} 채팅방</h2>
            <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ marginBottom: '10px' }}>
                        <strong>{msg.nickname}:</strong> {msg.content}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', marginTop: '10px' }}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') sendMessage(); }}
                    style={{ flexGrow: 1, padding: '10px', border: '1px solid #ccc' }}
                    placeholder="메시지를 입력하세요..."
                />
                <button onClick={sendMessage} style={{ padding: '10px 20px', backgroundColor: '#ff69b4', color: 'white', border: 'none' }}>
                    전송
                </button>
            </div>
        </div>
    );
}
export default ChatRoom;