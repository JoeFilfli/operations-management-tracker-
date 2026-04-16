from __future__ import annotations

from marshmallow import Schema, fields, validate

from ..models.enums import TicketPriority, TicketStatus


_STATUS_VALUES = [s.value for s in TicketStatus]
_PRIORITY_VALUES = [p.value for p in TicketPriority]


class _UserEmbed(Schema):
    id = fields.Integer()
    email = fields.String()
    full_name = fields.String()


class _EquipmentEmbed(Schema):
    id = fields.Integer()
    asset_tag = fields.String()
    name = fields.String()


class TicketAssignmentSchema(Schema):
    id = fields.Integer()
    ticket_id = fields.Integer()
    user_id = fields.Integer()
    user = fields.Nested(_UserEmbed, dump_only=True)
    created_at = fields.DateTime()


class TicketSchema(Schema):
    id = fields.Integer()
    title = fields.String()
    description = fields.String(allow_none=True)
    status = fields.Function(lambda obj: obj.status.value if obj.status else None)
    priority = fields.Function(lambda obj: obj.priority.value if obj.priority else None)
    equipment_id = fields.Integer()
    equipment = fields.Nested(_EquipmentEmbed, dump_only=True)
    reporter_id = fields.Integer(allow_none=True)
    reporter = fields.Nested(_UserEmbed, dump_only=True, allow_none=True)
    resolved_at = fields.DateTime(allow_none=True)
    assignments = fields.Nested(TicketAssignmentSchema, many=True, dump_only=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class TicketCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=200))
    description = fields.String(allow_none=True, validate=validate.Length(max=2000))
    equipment_id = fields.Integer(required=True)
    priority = fields.String(
        load_default=TicketPriority.MEDIUM.value,
        validate=validate.OneOf(_PRIORITY_VALUES),
    )
    status = fields.String(
        load_default=TicketStatus.OPEN.value,
        validate=validate.OneOf(_STATUS_VALUES),
    )
    assignee_ids = fields.List(fields.Integer(), load_default=list)


class TicketUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=200))
    description = fields.String(allow_none=True, validate=validate.Length(max=2000))
    priority = fields.String(validate=validate.OneOf(_PRIORITY_VALUES))
    status = fields.String(validate=validate.OneOf(_STATUS_VALUES))
