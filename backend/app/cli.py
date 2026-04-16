from __future__ import annotations

import click
from flask import Flask
from flask.cli import AppGroup

from .extensions import db
from .models import Equipment, Location, MaintenanceTicket, TicketAssignment, User
from .models.enums import EquipmentStatus, TicketPriority, TicketStatus, UserRole

opstrack_cli = AppGroup("opstrack", help="OpsTrack maintenance commands.")


def _get_or_create_user(
    *, email: str, full_name: str, role: UserRole, password: str = "password123"
) -> User:
    user = db.session.scalar(db.select(User).where(User.email == email))
    if user is not None:
        return user
    user = User(email=email, full_name=full_name, role=role)
    user.set_password(password)
    db.session.add(user)
    return user


def _get_or_create_location(*, name: str, description: str | None = None) -> Location:
    loc = db.session.scalar(db.select(Location).where(Location.name == name))
    if loc is not None:
        return loc
    loc = Location(name=name, description=description)
    db.session.add(loc)
    return loc


def _get_or_create_equipment(*, asset_tag: str, **kwargs) -> Equipment:
    eq = db.session.scalar(db.select(Equipment).where(Equipment.asset_tag == asset_tag))
    if eq is not None:
        return eq
    eq = Equipment(asset_tag=asset_tag, **kwargs)
    db.session.add(eq)
    return eq


@opstrack_cli.command("seed")
@click.option("--reset", is_flag=True, help="Delete existing data before seeding.")
def seed_command(reset: bool) -> None:
    """Populate the database with demo users, locations, equipment, and tickets."""
    if reset:
        click.echo("Resetting data...")
        if db.engine.dialect.name == "postgresql":
            db.session.execute(
                db.text(
                    "TRUNCATE users, locations, equipment, maintenance_tickets, "
                    "ticket_assignments, activity_log RESTART IDENTITY CASCADE"
                )
            )
        else:
            for model in (TicketAssignment, MaintenanceTicket, Equipment, Location, User):
                db.session.execute(db.delete(model))
        db.session.commit()

    admin = _get_or_create_user(
        email="admin@opstrack.local", full_name="Ada Admin", role=UserRole.ADMIN
    )
    staff = _get_or_create_user(
        email="staff@opstrack.local", full_name="Sam Staff", role=UserRole.STAFF
    )
    field = _get_or_create_user(
        email="field@opstrack.local", full_name="Finn Field", role=UserRole.FIELD
    )
    db.session.flush()

    server_room = _get_or_create_location(name="Server Room", description="Primary data center")
    lab_a = _get_or_create_location(name="Lab A", description="Main wet lab")
    warehouse = _get_or_create_location(name="Warehouse", description="Cold storage")
    db.session.flush()

    equipment = [
        _get_or_create_equipment(
            asset_tag="SRV-001",
            name="Rack Server 1",
            manufacturer="Dell",
            model="R740",
            status=EquipmentStatus.AVAILABLE,
            location_id=server_room.id,
        ),
        _get_or_create_equipment(
            asset_tag="SRV-002",
            name="Rack Server 2",
            manufacturer="Dell",
            model="R740",
            status=EquipmentStatus.IN_USE,
            location_id=server_room.id,
        ),
        _get_or_create_equipment(
            asset_tag="MICRO-001",
            name="Microscope Alpha",
            manufacturer="Zeiss",
            status=EquipmentStatus.MAINTENANCE,
            location_id=lab_a.id,
        ),
        _get_or_create_equipment(
            asset_tag="FREEZE-001",
            name="Chest Freezer",
            manufacturer="Thermo",
            status=EquipmentStatus.AVAILABLE,
            location_id=warehouse.id,
        ),
    ]
    db.session.flush()

    micro = next(e for e in equipment if e.asset_tag == "MICRO-001")
    srv1 = next(e for e in equipment if e.asset_tag == "SRV-001")

    if not db.session.scalar(
        db.select(MaintenanceTicket).where(MaintenanceTicket.title == "Stage jams on focus")
    ):
        t1 = MaintenanceTicket(
            title="Stage jams on focus",
            description="Z-stage sticks intermittently above 40x.",
            status=TicketStatus.IN_PROGRESS,
            priority=TicketPriority.HIGH,
            equipment_id=micro.id,
            reporter_id=staff.id,
        )
        db.session.add(t1)
        db.session.flush()
        db.session.add(TicketAssignment(ticket_id=t1.id, user_id=field.id))

    if not db.session.scalar(
        db.select(MaintenanceTicket).where(MaintenanceTicket.title == "PSU fan noise")
    ):
        db.session.add(
            MaintenanceTicket(
                title="PSU fan noise",
                description="Rack server 1 PSU fan audibly grinding.",
                status=TicketStatus.OPEN,
                priority=TicketPriority.MEDIUM,
                equipment_id=srv1.id,
                reporter_id=field.id,
            )
        )

    db.session.commit()
    click.echo(
        f"Seeded: users={db.session.scalar(db.select(db.func.count(User.id)))} "
        f"locations={db.session.scalar(db.select(db.func.count(Location.id)))} "
        f"equipment={db.session.scalar(db.select(db.func.count(Equipment.id)))} "
        f"tickets={db.session.scalar(db.select(db.func.count(MaintenanceTicket.id)))}"
    )
    click.echo(f"Admin login: {admin.email} / password123")


def register_cli_commands(app: Flask) -> None:
    app.cli.add_command(opstrack_cli)
