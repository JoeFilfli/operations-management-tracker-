from __future__ import annotations

from flask import Flask

from .activity import ActivityLogResource
from .api import Api
from .auth import LoginResource, MeResource, RefreshResource, RegisterResource
from .equipment import EquipmentListResource, EquipmentResource
from .health import HealthResource
from .locations import LocationResource, LocationsResource
from .tickets import (
    TicketAssignmentResource,
    TicketAssignmentsResource,
    TicketResource,
    TicketsResource,
)
from .users import MyProfileResource, UserResource, UsersResource


def register_resources(app: Flask) -> None:
    api = Api(app, prefix="/api")

    api.add_resource(HealthResource, "/health")

    api.add_resource(RegisterResource, "/auth/register")
    api.add_resource(LoginResource, "/auth/login")
    api.add_resource(RefreshResource, "/auth/refresh")
    api.add_resource(MeResource, "/auth/me")

    api.add_resource(UsersResource, "/users")
    api.add_resource(UserResource, "/users/<int:user_id>")
    api.add_resource(MyProfileResource, "/users/me")

    api.add_resource(LocationsResource, "/locations")
    api.add_resource(LocationResource, "/locations/<int:location_id>")

    api.add_resource(EquipmentListResource, "/equipment")
    api.add_resource(EquipmentResource, "/equipment/<int:equipment_id>")

    api.add_resource(TicketsResource, "/tickets")
    api.add_resource(TicketResource, "/tickets/<int:ticket_id>")
    api.add_resource(TicketAssignmentsResource, "/tickets/<int:ticket_id>/assignments")
    api.add_resource(
        TicketAssignmentResource,
        "/tickets/<int:ticket_id>/assignments/<int:user_id>",
    )

    api.add_resource(ActivityLogResource, "/activity")
