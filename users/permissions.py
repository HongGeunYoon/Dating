# users/permissions.py

from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    객체의 주인이 아닌 경우 읽기 전용 접근만 허용합니다.
    """
    def has_object_permission(self, request, view, obj):
        # 1. 읽기 권한은 모두에게 허용 (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # 2. 쓰기 권한은 객체(obj)의 'user' 필드가 현재 요청을 보낸 사용자(request.user)와 일치할 때만 허용
        return obj.user == request.user