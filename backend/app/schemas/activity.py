from __future__ import annotations

from marshmallow import Schema, fields


class _ActorEmbed(Schema):
    id = fields.Integer()
    full_name = fields.String()
    email = fields.String()


class ActivityLogSchema(Schema):
    id = fields.Integer()
    entity_type = fields.String()
    entity_id = fields.Integer()
    action = fields.String()
    actor_id = fields.Integer(allow_none=True)
    actor = fields.Nested(_ActorEmbed, allow_none=True)
    payload = fields.Raw(allow_none=True)
    created_at = fields.DateTime()
