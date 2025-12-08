// src/pages/Stats.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Alert, ListGroup, Badge, Spinner } from 'react-bootstrap';

function Stats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (!token) {
            setError("로그인 정보가 없습니다. 다시 로그인해 주세요.");
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const response = await axios.get(
                    'http://127.0.0.1:8000/api/users/userprofile/stats/',
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                setStats(response.data);
                setLoading(false);
            } catch (err) {
                console.error("통계 데이터 로드 실패:", err.response || err);
                setError("통계 데이터를 불러오는 데 실패했습니다. 서버 상태를 확인하세요.");
                setLoading(false);
            }
        };

        fetchStats();
    }, [token]);

    if (loading) {
        return <Container className="my-5 text-center"><Spinner animation="border" /> <p>데이터를 로드 중입니다...</p></Container>;
    }

    if (error) {
        return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    }

    // 서버 응답 구조: { likes_received: [...], likes_sent: [...] }
    const received = stats.likes_received || [];
    const sent = stats.likes_sent || [];

    const renderList = (list) => {
        if (list.length === 0) {
            return <Alert variant="info" className="mt-3">목록이 비어 있습니다.</Alert>;
        }
        return (
            <ListGroup>
                {list.map(item => (
                    <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>{item.nickname}</strong>
                            <span className="text-muted ms-2">({item.age}세)</span>
                        </div>
                        {item.is_matched && <Badge bg="success">매칭됨</Badge>}
                    </ListGroup.Item>
                ))}
            </ListGroup>
        );
    };

    return (
        <Container className="my-5">
            <h2 className="mb-4 text-center">나의 좋아요 통계</h2>
            <Row>
                <Col md={6} className="mb-4">
                    <Card>
                        <Card.Header as="h5" className="bg-light">
                            나에게 좋아요를 보낸 사람 ({received.length}명)
                        </Card.Header>
                        <Card.Body>
                            {renderList(received)}
                            <Alert variant="warning" className="mt-3">
                                *이 목록의 사용자에게 '좋아요'를 보내면 바로 매칭됩니다!
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Header as="h5" className="bg-light">
                            내가 좋아요를 보낸 사람 ({sent.length}명)
                        </Card.Header>
                        <Card.Body>
                            {renderList(sent)}
                            <Alert variant="info" className="mt-3">
                                *이 목록의 사용자들은 아직 나에게 '좋아요'를 보내지 않았습니다.
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Stats;