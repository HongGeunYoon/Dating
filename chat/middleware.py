# chat/middleware.py

from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from channels.sessions import SessionMiddlewareStack # 🔑 SessionMiddlewareStack import 추가
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    """토큰을 사용하여 사용자 객체를 가져옵니다."""
    try:
        # 1. JWT 토큰 디코딩
        access_token = AccessToken(token_key)
        user_id = access_token.payload.get('user_id')
        
        # 2. 사용자 ID로 DB에서 사용자 조회
        if user_id is not None:
            return User.objects.get(id=user_id)
    except Exception as e:
        # 토큰 만료, 유효하지 않은 토큰 등 모든 오류 처리
        # 이 로그를 확인하여 토큰 실패 원인을 추적할 수 있습니다.
        print(f"DEBUG: JWT 인증 실패: {e}") 
        pass
    
    return AnonymousUser()

# 토큰 인증 미들웨어
class TokenAuthMiddleware:
    """
    WebSocket 연결의 쿼리 스트링에서 JWT Access Token을 추출하여
    scope에 사용자 객체를 설정합니다.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        try:
            # 1. 쿼리 스트링에서 'token' 값을 추출
            query_string = scope.get('query_string', b'').decode()
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]

            if token:
                # 2. 토큰으로 사용자를 인증하고 scope에 추가
                scope['user'] = await get_user(token)
            else:
                # 3. 토큰이 없으면 익명 사용자 설정
                scope['user'] = AnonymousUser()

        except Exception as e:
            # 예상치 못한 오류 발생 시 익명 사용자 설정
            print(f"DEBUG: TokenAuthMiddleware 처리 중 오류 발생: {e}")
            scope['user'] = AnonymousUser()


        return await self.inner(scope, receive, send)

# 최종적으로 ASGI 애플리케이션에 래핑할 미들웨어 스택
# SessionMiddlewareStack은 Django의 세션 기능을 활성화하여 
# Channels의 인증에 필요한 기반을 제공하고, 그 위에 TokenAuthMiddleware를 올립니다.
def TokenAuthMiddlewareStack(inner):
    return SessionMiddlewareStack(TokenAuthMiddleware(inner)) # 👈 SessionMiddlewareStack으로 변경!