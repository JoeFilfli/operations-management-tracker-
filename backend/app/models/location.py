from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import TimestampMixin


class Location(TimestampMixin, db.Model):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))

    equipment: Mapped[list["Equipment"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="location"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Location id={self.id} name={self.name}>"
