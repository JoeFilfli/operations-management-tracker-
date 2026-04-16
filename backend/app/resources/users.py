from __future__ import annotations

from flask import abort, request
from flask_restful import Resource

from ..auth import current_user, roles_required
from ..extensions import db
from ..models import User
from ..models.enums import UserRole
from ..pagination import paginate
from ..schemas import UserCreateSchema, UserSchema, UserUpdateSchema

_user_schema = UserSchema()
_create_schema = UserCreateSchema()
_update_schema = UserUpdateSchema()


class UsersResource(Resource):
    @roles_required(UserRole.ADMIN)
    def get(self):
        q = request.args.get("q", "").strip()
        stmt = db.select(User).order_by(User.id)
        if q:
            like = f"%{q}%"
            stmt = stmt.where((User.email.ilike(like)) | (User.full_name.ilike(like)))
        return paginate(stmt, _user_schema)

    @roles_required(UserRole.ADMIN)
    def post(self):
        data = _create_schema.load(request.get_json() or {})
        if db.session.scalar(db.select(User).where(User.email == data["email"])):
            abort(409, description="Email already in use")
        user = User(
            email=data["email"],
            full_name=data["full_name"],
            role=UserRole(data["role"]),
            is_active=data["is_active"],
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()
        return _user_schema.dump(user), 201


class UserResource(Resource):
    @roles_required(UserRole.ADMIN)
    def get(self, user_id: int):
        user = db.session.get(User, user_id)
        if user is None:
            abort(404, description="User not found")
        return _user_schema.dump(user)

    @roles_required(UserRole.ADMIN)
    def patch(self, user_id: int):
        user = db.session.get(User, user_id)
        if user is None:
            abort(404, description="User not found")
        data = _update_schema.load(request.get_json() or {})
        if "email" in data and data["email"] != user.email:
            existing = db.session.scalar(db.select(User).where(User.email == data["email"]))
            if existing is not None:
                abort(409, description="Email already in use")
            user.email = data["email"]
        if "full_name" in data:
            user.full_name = data["full_name"]
        if "role" in data:
            user.role = UserRole(data["role"])
        if "is_active" in data:
            user.is_active = data["is_active"]
        if "password" in data:
            user.set_password(data["password"])
        db.session.commit()
        return _user_schema.dump(user)

    @roles_required(UserRole.ADMIN)
    def delete(self, user_id: int):
        user = db.session.get(User, user_id)
        if user is None:
            abort(404, description="User not found")
        me = current_user()
        if me is not None and me.id == user.id:
            abort(400, description="Cannot delete your own account")
        db.session.delete(user)
        db.session.commit()
        return "", 204


class MyProfileResource(Resource):
    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def patch(self):
        user = current_user()
        if user is None:
            abort(401)
        data = _update_schema.load(request.get_json() or {})
        # Disallow role/is_active self-edit
        for blocked in ("role", "is_active"):
            data.pop(blocked, None)
        if "email" in data and data["email"] != user.email:
            existing = db.session.scalar(db.select(User).where(User.email == data["email"]))
            if existing is not None:
                abort(409, description="Email already in use")
            user.email = data["email"]
        if "full_name" in data:
            user.full_name = data["full_name"]
        if "password" in data:
            user.set_password(data["password"])
        db.session.commit()
        return _user_schema.dump(user)
