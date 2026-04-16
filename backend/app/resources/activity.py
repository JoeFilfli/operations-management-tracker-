from __future__ import annotations

from flask import abort, request
from flask_restful import Resource
from sqlalchemy.orm import selectinload

from ..auth import roles_required
from ..extensions import db
from ..models import ActivityLog
from ..models.enums import UserRole
from ..pagination import paginate
from ..schemas import ActivityLogSchema

_schema = ActivityLogSchema()

_DATE_HINT = "Use ISO 8601: YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD"


class ActivityLogResource(Resource):
    @roles_required(UserRole.ADMIN)
    def get(self):
        entity_type = request.args.get("entity_type")
        entity_id = request.args.get("entity_id")
        actor_id = request.args.get("actor_id")
        action = request.args.get("action")
        since = request.args.get("since")
        until = request.args.get("until")

        stmt = (
            db.select(ActivityLog)
            .options(selectinload(ActivityLog.actor))
            .order_by(ActivityLog.id.desc())
        )

        if entity_type:
            stmt = stmt.where(ActivityLog.entity_type == entity_type)
        if entity_id:
            try:
                stmt = stmt.where(ActivityLog.entity_id == int(entity_id))
            except ValueError:
                abort(400, description="entity_id must be an integer")
        if actor_id:
            try:
                stmt = stmt.where(ActivityLog.actor_id == int(actor_id))
            except ValueError:
                abort(400, description="actor_id must be an integer")
        if action:
            _VALID_ACTIONS = {"create", "update", "delete"}
            if action not in _VALID_ACTIONS:
                abort(400, description=f"Invalid action: {action}. Allowed: {sorted(_VALID_ACTIONS)}")
            stmt = stmt.where(ActivityLog.action == action)
        if since:
            from datetime import datetime
            try:
                stmt = stmt.where(ActivityLog.created_at >= datetime.fromisoformat(since))
            except ValueError:
                abort(400, description=f"Invalid since value. {_DATE_HINT}")
        if until:
            from datetime import datetime
            try:
                stmt = stmt.where(ActivityLog.created_at <= datetime.fromisoformat(until))
            except ValueError:
                abort(400, description=f"Invalid until value. {_DATE_HINT}")

        return paginate(stmt, _schema)
