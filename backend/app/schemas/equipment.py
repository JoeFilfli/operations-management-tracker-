from __future__ import annotations

from marshmallow import Schema, fields, validate

from ..models.enums import EquipmentStatus


_STATUS_VALUES = [s.value for s in EquipmentStatus]


class _LocationEmbed(Schema):
    id = fields.Integer()
    name = fields.String()


class EquipmentSchema(Schema):
    id = fields.Integer()
    asset_tag = fields.String()
    name = fields.String()
    description = fields.String(allow_none=True)
    manufacturer = fields.String(allow_none=True)
    model = fields.String(allow_none=True)
    serial_number = fields.String(allow_none=True)
    status = fields.Function(lambda obj: obj.status.value if obj.status else None)
    location_id = fields.Integer(allow_none=True)
    location = fields.Nested(_LocationEmbed, dump_only=True, allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class EquipmentCreateSchema(Schema):
    asset_tag = fields.String(required=True, validate=validate.Length(min=1, max=64))
    name = fields.String(required=True, validate=validate.Length(min=1, max=160))
    description = fields.String(allow_none=True, validate=validate.Length(max=1000))
    manufacturer = fields.String(allow_none=True, validate=validate.Length(max=120))
    model = fields.String(allow_none=True, validate=validate.Length(max=120))
    serial_number = fields.String(allow_none=True, validate=validate.Length(max=120))
    status = fields.String(
        load_default=EquipmentStatus.AVAILABLE.value,
        validate=validate.OneOf(_STATUS_VALUES),
    )
    location_id = fields.Integer(allow_none=True)


class EquipmentUpdateSchema(Schema):
    asset_tag = fields.String(validate=validate.Length(min=1, max=64))
    name = fields.String(validate=validate.Length(min=1, max=160))
    description = fields.String(allow_none=True, validate=validate.Length(max=1000))
    manufacturer = fields.String(allow_none=True, validate=validate.Length(max=120))
    model = fields.String(allow_none=True, validate=validate.Length(max=120))
    serial_number = fields.String(allow_none=True, validate=validate.Length(max=120))
    status = fields.String(validate=validate.OneOf(_STATUS_VALUES))
    location_id = fields.Integer(allow_none=True)
