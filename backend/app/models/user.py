from __future__ import annotations

import bcrypt
from sqlalchemy import Enum as SAEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import TimestampMixin
from .enums import UserRole


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role"), nullable=False, default=UserRole.STAFF
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    ticket_assignments: Mapped[list["TicketAssignment"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
    reported_tickets: Mapped[list["MaintenanceTicket"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="reporter", foreign_keys="MaintenanceTicket.reporter_id"
    )

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def check_password(self, password: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode(), self.password_hash.encode())
        except ValueError:
            return False

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User id={self.id} email={self.email} role={self.role.value}>"
