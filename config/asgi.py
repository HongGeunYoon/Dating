"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

# project/asgi.py

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

import django
import chat.routing
from chat.middleware import TokenAuthMiddlewareStack # 🔑 import 된 상태

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    
    # 🔑 수정 필수: TokenAuthMiddlewareStack을 사용해야 토큰 인증이 작동합니다.
    "websocket": TokenAuthMiddlewareStack( # 👈 이 부분을 수정합니다.
        URLRouter(
            chat.routing.websocket_urlpatterns 
            )
        ),
    })
