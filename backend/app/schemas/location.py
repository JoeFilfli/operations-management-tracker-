from __future__ import annotations

from marshmallow import Schema, fields, validate


class LocationSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    description = fields.String(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class LocationCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=120))
    description = fields.String(allow_none=True, validate=validate.Length(max=500))


class LocationUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=120))
    description = fields.String(allow_none=True, validate=validate.Length(max=500))
