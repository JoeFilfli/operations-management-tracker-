from __future__ import annotations

from marshmallow import Schema, fields, validate

from ..models.enums import UserRole


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))
    full_name = fields.String(required=True, validate=validate.Length(min=1, max=120))
    role = fields.String(
        load_default=UserRole.STAFF.value,
        validate=validate.OneOf([r.value for r in UserRole]),
    )


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=1, max=128))
