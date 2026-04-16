from __future__ import annotations

import factory
from factory.alchemy import SQLAlchemyModelFactory

from app.extensions import db
from app.models import Equipment, Location, MaintenanceTicket, User
from app.models.enums import EquipmentStatus, TicketPriority, TicketStatus, UserRole


class _Base(SQLAlchemyModelFactory):
    class Meta:
        abstract = True
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"


class UserFactory(_Base):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    full_name = factory.Faker("name")
    role = UserRole.STAFF
    is_active = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password(extracted or "password123")


class LocationFactory(_Base):
    class Meta:
        model = Location

    name = factory.Sequence(lambda n: f"Location {n}")
    description = factory.Faker("sentence")


class EquipmentFactory(_Base):
    class Meta:
        model = Equipment

    asset_tag = factory.Sequence(lambda n: f"ASSET-{n:05d}")
    name = factory.Faker("word")
    status = EquipmentStatus.AVAILABLE
    location = factory.SubFactory(LocationFactory)


class MaintenanceTicketFactory(_Base):
    class Meta:
        model = MaintenanceTicket

    title = factory.Faker("sentence", nb_words=5)
    description = factory.Faker("paragraph")
    status = TicketStatus.OPEN
    priority = TicketPriority.MEDIUM
    equipment = factory.SubFactory(EquipmentFactory)
