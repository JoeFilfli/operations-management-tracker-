from __future__ import annotations

from datetime import datetime, timezone

from flask import abort, request
from flask_restful import Resource
from sqlalchemy.orm import selectinload

from ..auth import current_user, roles_required
from ..extensions import db
from ..models import Equipment, MaintenanceTicket, TicketAssignment, User
from ..models.enums import TicketPriority, TicketStatus, UserRole
from ..pagination import paginate
from ..schemas import (
    TicketAssignmentSchema,
    TicketCreateSchema,
    TicketSchema,
    TicketUpdateSchema,
)

_schema = TicketSchema()
_create_schema = TicketCreateSchema()
_update_schema = TicketUpdateSchema()
_assignment_schema = TicketAssignmentSchema()


def _load_tickets_stmt():
    return db.select(MaintenanceTicket).options(
        selectinload(MaintenanceTicket.equipment),
        selectinload(MaintenanceTicket.reporter),
        selectinload(MaintenanceTicket.assignments).selectinload(TicketAssignment.user),
    )


def _get_ticket(ticket_id: int) -> MaintenanceTicket:
    ticket = db.session.scalar(_load_tickets_stmt().where(MaintenanceTicket.id == ticket_id))
    if ticket is None:
        abort(404, description="Ticket not found")
    return ticket


def _user_can_modify_ticket(user: User, ticket: MaintenanceTicket) -> bool:
    if user.role in (UserRole.ADMIN, UserRole.STAFF):
        return True
    if ticket.reporter_id == user.id:
        return True
    return any(a.user_id == user.id for a in ticket.assignments)


class TicketsResource(Resource):
    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def get(self):
        status = request.args.get("status")
        priority = request.args.get("priority")
        equipment_id = request.args.get("equipment_id")
        assignee_id = request.args.get("assignee_id")
        mine = request.args.get("mine", "").lower() in {"1", "true", "yes"}

        stmt = _load_tickets_stmt().order_by(MaintenanceTicket.id.desc())
        if status:
            if status not in {s.value for s in TicketStatus}:
                abort(400, description=f"Invalid status: {status}")
            stmt = stmt.where(MaintenanceTicket.status == TicketStatus(status))
        if priority:
            if priority not in {p.value for p in TicketPriority}:
                abort(400, description=f"Invalid priority: {priority}")
            stmt = stmt.where(MaintenanceTicket.priority == TicketPriority(priority))
        if equipment_id:
            try:
                stmt = stmt.where(MaintenanceTicket.equipment_id == int(equipment_id))
            except ValueError:
                abort(400, description="equipment_id must be an integer")

        user = current_user()
        if mine and user is not None:
            stmt = stmt.where(
                MaintenanceTicket.assignments.any(TicketAssignment.user_id == user.id)
            )
        elif assignee_id:
            if user is None or user.role not in (UserRole.ADMIN, UserRole.STAFF):
                abort(403, description="assignee_id filter requires admin or staff role")
            try:
                target = int(assignee_id)
            except ValueError:
                abort(400, description="assignee_id must be an integer")
            stmt = stmt.where(
                MaintenanceTicket.assignments.any(TicketAssignment.user_id == target)
            )
        return paginate(stmt, _schema)

    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def post(self):
        data = _create_schema.load(request.get_json() or {})
        if db.session.get(Equipment, data["equipment_id"]) is None:
            abort(400, description=f"Equipment {data['equipment_id']} not found")

        assignee_ids = data.get("assignee_ids") or []
        if assignee_ids:
            existing = db.session.scalars(
                db.select(User.id).where(User.id.in_(assignee_ids))
            ).all()
            missing = set(assignee_ids) - set(existing)
            if missing:
                abort(400, description=f"Unknown user ids: {sorted(missing)}")

        reporter = current_user()
        ticket = MaintenanceTicket(
            title=data["title"],
            description=data.get("description"),
            equipment_id=data["equipment_id"],
            priority=TicketPriority(data["priority"]),
            status=TicketStatus(data["status"]),
            reporter_id=reporter.id if reporter else None,
        )
        db.session.add(ticket)
        db.session.flush()
        for uid in assignee_ids:
            db.session.add(TicketAssignment(ticket_id=ticket.id, user_id=uid))
        db.session.commit()
        return _schema.dump(_get_ticket(ticket.id)), 201


class TicketResource(Resource):
    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def get(self, ticket_id: int):
        return _schema.dump(_get_ticket(ticket_id))

    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def patch(self, ticket_id: int):
        ticket = _get_ticket(ticket_id)
        me = current_user()
        if me is None or not _user_can_modify_ticket(me, ticket):
            abort(403, description="You cannot modify this ticket")

        data = _update_schema.load(request.get_json() or {})
        for key in ("title", "description"):
            if key in data:
                setattr(ticket, key, data[key])
        if "priority" in data:
            ticket.priority = TicketPriority(data["priority"])
        if "status" in data:
            new_status = TicketStatus(data["status"])
            if new_status == TicketStatus.RESOLVED and ticket.status != TicketStatus.RESOLVED:
                ticket.resolved_at = datetime.now(tz=timezone.utc)
            elif new_status != TicketStatus.RESOLVED and ticket.status == TicketStatus.RESOLVED:
                ticket.resolved_at = None
            ticket.status = new_status
        db.session.commit()
        return _schema.dump(_get_ticket(ticket.id))

    @roles_required(UserRole.ADMIN, UserRole.STAFF)
    def delete(self, ticket_id: int):
        ticket = _get_ticket(ticket_id)
        db.session.delete(ticket)
        db.session.commit()
        return "", 204


class TicketAssignmentsResource(Resource):
    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def get(self, ticket_id: int):
        ticket = _get_ticket(ticket_id)
        return {"items": _assignment_schema.dump(ticket.assignments, many=True)}

    @roles_required(UserRole.ADMIN, UserRole.STAFF)
    def post(self, ticket_id: int):
        ticket = _get_ticket(ticket_id)
        body = request.get_json() or {}
        user_id = body.get("user_id")
        if not isinstance(user_id, int):
            abort(400, description="user_id (int) is required")
        if db.session.get(User, user_id) is None:
            abort(400, description=f"User {user_id} not found")
        existing = db.session.scalar(
            db.select(TicketAssignment).where(
                TicketAssignment.ticket_id == ticket.id,
                TicketAssignment.user_id == user_id,
            )
        )
        if existing is not None:
            abort(409, description="User is already assigned to this ticket")
        assignment = TicketAssignment(ticket_id=ticket.id, user_id=user_id)
        db.session.add(assignment)
        db.session.commit()
        return _assignment_schema.dump(assignment), 201


class TicketAssignmentResource(Resource):
    @roles_required(UserRole.ADMIN, UserRole.STAFF)
    def delete(self, ticket_id: int, user_id: int):
        assignment = db.session.scalar(
            db.select(TicketAssignment).where(
                TicketAssignment.ticket_id == ticket_id,
                TicketAssignment.user_id == user_id,
            )
        )
        if assignment is None:
            abort(404, description="Assignment not found")
        db.session.delete(assignment)
        db.session.commit()
        return "", 204
