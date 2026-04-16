from __future__ import annotations

from functools import wraps

from flask import abort
from flask_jwt_extended import jwt_required

from ..models.enums import UserRole
from .helpers import current_user


def roles_required(*roles: UserRole | str):
    """Require that the authenticated user has one of the given roles."""
    allowed = {r.value if isinstance(r, UserRole) else r for r in roles}

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = current_user()
            if user is None or not user.is_active:
                abort(401, description="Invalid or inactive user")
            if user.role.value not in allowed:
                abort(403, description="Insufficient role")
            return fn(*args, **kwargs)

        return wrapper

    return decorator
