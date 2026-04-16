from __future__ import annotations

from flask import abort, request
from flask_restful import Resource

from ..auth import roles_required
from ..extensions import db
from ..models import Location
from ..models.enums import UserRole
from ..pagination import paginate
from ..schemas import LocationCreateSchema, LocationSchema, LocationUpdateSchema

_schema = LocationSchema()
_create_schema = LocationCreateSchema()
_update_schema = LocationUpdateSchema()


class LocationsResource(Resource):
    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def get(self):
        q = request.args.get("q", "").strip()
        stmt = db.select(Location).order_by(Location.name)
        if q:
            stmt = stmt.where(Location.name.ilike(f"%{q}%"))
        return paginate(stmt, _schema)

    @roles_required(UserRole.ADMIN, UserRole.STAFF)
    def post(self):
        data = _create_schema.load(request.get_json() or {})
        if db.session.scalar(db.select(Location).where(Location.name == data["name"])):
            abort(409, description="Location name already exists")
        loc = Location(**data)
        db.session.add(loc)
        db.session.commit()
        return _schema.dump(loc), 201


class LocationResource(Resource):
    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def get(self, location_id: int):
        loc = db.session.get(Location, location_id)
        if loc is None:
            abort(404, description="Location not found")
        return _schema.dump(loc)

    @roles_required(UserRole.ADMIN, UserRole.STAFF)
    def patch(self, location_id: int):
        loc = db.session.get(Location, location_id)
        if loc is None:
            abort(404, description="Location not found")
        data = _update_schema.load(request.get_json() or {})
        if "name" in data and data["name"] != loc.name:
            existing = db.session.scalar(db.select(Location).where(Location.name == data["name"]))
            if existing is not None:
                abort(409, description="Location name already exists")
            loc.name = data["name"]
        if "description" in data:
            loc.description = data["description"]
        db.session.commit()
        return _schema.dump(loc)

    @roles_required(UserRole.ADMIN)
    def delete(self, location_id: int):
        loc = db.session.get(Location, location_id)
        if loc is None:
            abort(404, description="Location not found")
        db.session.delete(loc)
        db.session.commit()
        return "", 204
