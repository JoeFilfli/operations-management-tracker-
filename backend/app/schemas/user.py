from __future__ import annotations

from marshmallow import Schema, fields, validate

from ..models.enums import UserRole


class UserSchema(Schema):
    id = fields.Integer()
    email = fields.Email()
    full_name = fields.String()
    role = fields.Function(lambda obj: obj.role.value if obj.role else None)
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class UserCreateSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))
    full_name = fields.String(required=True, validate=validate.Length(min=1, max=120))
    role = fields.String(
        load_default=UserRole.STAFF.value,
        validate=validate.OneOf([r.value for r in UserRole]),
    )
    is_active = fields.Boolean(load_default=True)


class UserUpdateSchema(Schema):
    email = fields.Email()
    password = fields.String(validate=validate.Length(min=8, max=128))
    full_name = fields.String(validate=validate.Length(min=1, max=120))
    role = fields.String(validate=validate.OneOf([r.value for r in UserRole]))
    is_active = fields.Boolean()
