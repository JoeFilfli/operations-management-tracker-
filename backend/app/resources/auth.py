from __future__ import annotations

from flask import request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from flask_restful import Resource

from ..auth import current_user
from ..extensions import db
from ..models import User
from ..models.enums import UserRole
from ..schemas import LoginSchema, RegisterSchema, UserSchema

_register_schema = RegisterSchema()
_login_schema = LoginSchema()
_user_schema = UserSchema()


def _tokens_for(user: User) -> dict:
    identity = str(user.id)
    return {
        "access_token": create_access_token(identity=identity),
        "refresh_token": create_refresh_token(identity=identity),
    }


class RegisterResource(Resource):
    def post(self):
        data = _register_schema.load(request.get_json() or {})
        if User.query.filter_by(email=data["email"]).first():
            return {"error": "email_taken"}, 409
        user = User(
            email=data["email"],
            full_name=data["full_name"],
            role=UserRole(data["role"]),
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()
        return {"user": _user_schema.dump(user), **_tokens_for(user)}, 201


class LoginResource(Resource):
    def post(self):
        data = _login_schema.load(request.get_json() or {})
        user = User.query.filter_by(email=data["email"]).first()
        if user is None or not user.is_active or not user.check_password(data["password"]):
            return {"error": "invalid_credentials"}, 401
        return {"user": _user_schema.dump(user), **_tokens_for(user)}, 200


class RefreshResource(Resource):
    @jwt_required(refresh=True)
    def post(self):
        identity = get_jwt_identity()
        user = db.session.get(User, int(identity)) if identity else None
        if user is None or not user.is_active:
            return {"error": "invalid_user"}, 401
        return {"access_token": create_access_token(identity=str(user.id))}, 200


class MeResource(Resource):
    @jwt_required()
    def get(self):
        user = current_user()
        if user is None:
            return {"error": "invalid_user"}, 401
        return _user_schema.dump(user), 200
