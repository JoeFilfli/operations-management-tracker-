from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import TimestampMixin
from .enums import TicketPriority, TicketStatus


class MaintenanceTicket(TimestampMixin, db.Model):
    __tablename__ = "maintenance_tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000))
    status: Mapped[TicketStatus] = mapped_column(
        SAEnum(TicketStatus, name="ticket_status"),
        nullable=False,
        default=TicketStatus.OPEN,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        SAEnum(TicketPriority, name="ticket_priority"),
        nullable=False,
        default=TicketPriority.MEDIUM,
    )

    equipment_id: Mapped[int] = mapped_column(
        ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True
    )
    equipment: Mapped["Equipment"] = relationship(back_populates="tickets")  # type: ignore[name-defined]  # noqa: F821

    reporter_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    reporter: Mapped["User | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="reported_tickets", foreign_keys=[reporter_id]
    )

    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    assignments: Mapped[list["TicketAssignment"]] = relationship(
        back_populates="ticket", cascade="all, delete-orphan"
    )


class TicketAssignment(TimestampMixin, db.Model):
    __tablename__ = "ticket_assignments"
    __table_args__ = (UniqueConstraint("ticket_id", "user_id", name="uq_ticket_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("maintenance_tickets.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    ticket: Mapped["MaintenanceTicket"] = relationship(back_populates="assignments")
    user: Mapped["User"] = relationship(back_populates="ticket_assignments")  # type: ignore[name-defined]  # noqa: F821
