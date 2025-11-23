# chat/routing.py

from django.urls import re_path
from . import consumers # 👈 곧 만들 ChatConsumer를 임포트합니다.

websocket_urlpatterns = [
    # ws/chat/ROOM_NAME/ 형식으로 들어오는 WebSocket 요청을 ChatConsumer로 연결
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]