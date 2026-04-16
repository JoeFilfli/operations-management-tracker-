from __future__ import annotations

from flask import has_request_context
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from ..extensions import db
from ..models import User


def current_user() -> User | None:
    """Return the authenticated user for the current request, or None."""
    if not has_request_context():
        return None
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        return None
    identity = get_jwt_identity()
    if identity is None:
        return None
    try:
        return db.session.get(User, int(identity))
    except (TypeError, ValueError):
        return None
