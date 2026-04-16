from __future__ import annotations

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import TimestampMixin
from .enums import EquipmentStatus


class Equipment(TimestampMixin, db.Model):
    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_tag: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000))
    manufacturer: Mapped[str | None] = mapped_column(String(120))
    model: Mapped[str | None] = mapped_column(String(120))
    serial_number: Mapped[str | None] = mapped_column(String(120), unique=True)
    status: Mapped[EquipmentStatus] = mapped_column(
        SAEnum(EquipmentStatus, name="equipment_status"),
        nullable=False,
        default=EquipmentStatus.AVAILABLE,
    )

    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id", ondelete="SET NULL"))
    location: Mapped["Location | None"] = relationship(back_populates="equipment")  # type: ignore[name-defined]  # noqa: F821

    tickets: Mapped[list["MaintenanceTicket"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="equipment", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Equipment id={self.id} asset_tag={self.asset_tag} status={self.status.value}>"
