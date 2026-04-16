from __future__ import annotations

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import TimestampMixin


class ActivityLog(TimestampMixin, db.Model):
    __tablename__ = "activity_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    entity_id: Mapped[int] = mapped_column(nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    payload: Mapped[dict | None] = mapped_column(JSON)

    actor: Mapped["User | None"] = relationship(foreign_keys=[actor_id])  # type: ignore[name-defined]  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ActivityLog {self.entity_type}#{self.entity_id} {self.action}>"
