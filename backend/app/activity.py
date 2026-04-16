from __future__ import annotations

import json
from typing import Any

from sqlalchemy import event
from sqlalchemy.orm import Session

from .auth.helpers import current_user
from .extensions import db
from .models import ActivityLog, Equipment, Location, MaintenanceTicket, TicketAssignment, User

_TRACKED: tuple[type, ...] = (
    User,
    Location,
    Equipment,
    MaintenanceTicket,
    TicketAssignment,
)

_PENDING_KEY = "opstrack_activity_pending"


def _entity_type(obj: Any) -> str:
    return obj.__class__.__name__


_SENSITIVE_FIELDS = {"password_hash"}


def _snapshot(obj: Any) -> dict:
    out: dict = {}
    for col in obj.__table__.columns:
        if col.name in _SENSITIVE_FIELDS:
            continue
        val = getattr(obj, col.name, None)
        if hasattr(val, "value"):
            val = val.value
        try:
            out[col.name] = json.loads(json.dumps(val, default=str))
        except (TypeError, ValueError):
            out[col.name] = str(val)
    return out


def _actor_id() -> int | None:
    user = current_user()
    return user.id if user else None


def register_activity_hooks() -> None:
    @event.listens_for(db.session, "before_flush")
    def _before_flush(session: Session, _flush_context, _instances):
        pending = session.info.setdefault(_PENDING_KEY, [])
        actor = _actor_id()
        for obj in session.new:
            if isinstance(obj, _TRACKED):
                pending.append(("create", obj, None, actor))
        for obj in session.dirty:
            if isinstance(obj, _TRACKED) and session.is_modified(obj, include_collections=False):
                pending.append(("update", obj, _snapshot(obj), actor))
        for obj in session.deleted:
            if isinstance(obj, _TRACKED):
                pending.append(("delete", obj, _snapshot(obj), actor))

    @event.listens_for(db.session, "after_flush")
    def _after_flush(session: Session, _flush_context):
        pending = session.info.pop(_PENDING_KEY, None)
        if not pending:
            return
        rows = []
        for action, obj, snap, actor in pending:
            payload = snap if snap is not None else _snapshot(obj)
            rows.append(
                {
                    "entity_type": _entity_type(obj),
                    "entity_id": getattr(obj, "id", None) or 0,
                    "action": action,
                    "actor_id": actor,
                    "payload": payload,
                }
            )
        session.execute(ActivityLog.__table__.insert(), rows)
