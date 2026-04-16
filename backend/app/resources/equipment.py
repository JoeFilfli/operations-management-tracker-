from __future__ import annotations

from flask import abort, request
from flask_restful import Resource

from ..auth import roles_required
from ..extensions import db
from ..models import Equipment, Location
from ..models.enums import EquipmentStatus, UserRole
from ..pagination import paginate
from ..schemas import EquipmentCreateSchema, EquipmentSchema, EquipmentUpdateSchema

_schema = EquipmentSchema()
_create_schema = EquipmentCreateSchema()
_update_schema = EquipmentUpdateSchema()


def _validate_location(location_id: int | None) -> None:
    if location_id is None:
        return
    if db.session.get(Location, location_id) is None:
        abort(400, description=f"Location {location_id} not found")


class EquipmentListResource(Resource):
    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def get(self):
        q = request.args.get("q", "").strip()
        status = request.args.get("status")
        location_id = request.args.get("location_id")

        stmt = db.select(Equipment).order_by(Equipment.id)
        if q:
            like = f"%{q}%"
            stmt = stmt.where(
                (Equipment.name.ilike(like))
                | (Equipment.asset_tag.ilike(like))
                | (Equipment.serial_number.ilike(like))
            )
        if status:
            if status not in {s.value for s in EquipmentStatus}:
                abort(400, description=f"Invalid status: {status}")
            stmt = stmt.where(Equipment.status == EquipmentStatus(status))
        if location_id:
            try:
                stmt = stmt.where(Equipment.location_id == int(location_id))
            except ValueError:
                abort(400, description="location_id must be an integer")
        return paginate(stmt, _schema)

    @roles_required(UserRole.ADMIN, UserRole.STAFF)
    def post(self):
        data = _create_schema.load(request.get_json() or {})
        _validate_location(data.get("location_id"))
        if db.session.scalar(db.select(Equipment).where(Equipment.asset_tag == data["asset_tag"])):
            abort(409, description="asset_tag already in use")
        eq = Equipment(
            asset_tag=data["asset_tag"],
            name=data["name"],
            description=data.get("description"),
            manufacturer=data.get("manufacturer"),
            model=data.get("model"),
            serial_number=data.get("serial_number"),
            status=EquipmentStatus(data["status"]),
            location_id=data.get("location_id"),
        )
        db.session.add(eq)
        db.session.commit()
        return _schema.dump(eq), 201


class EquipmentResource(Resource):
    @roles_required(UserRole.ADMIN, UserRole.STAFF, UserRole.FIELD)
    def get(self, equipment_id: int):
        eq = db.session.get(Equipment, equipment_id)
        if eq is None:
            abort(404, description="Equipment not found")
        return _schema.dump(eq)

    @roles_required(UserRole.ADMIN, UserRole.STAFF)
    def patch(self, equipment_id: int):
        eq = db.session.get(Equipment, equipment_id)
        if eq is None:
            abort(404, description="Equipment not found")
        data = _update_schema.load(request.get_json() or {})
        if "asset_tag" in data and data["asset_tag"] != eq.asset_tag:
            existing = db.session.scalar(
                db.select(Equipment).where(Equipment.asset_tag == data["asset_tag"])
            )
            if existing is not None:
                abort(409, description="asset_tag already in use")
            eq.asset_tag = data["asset_tag"]
        for key in ("name", "description", "manufacturer", "model", "serial_number"):
            if key in data:
                setattr(eq, key, data[key])
        if "status" in data:
            eq.status = EquipmentStatus(data["status"])
        if "location_id" in data:
            _validate_location(data["location_id"])
            eq.location_id = data["location_id"]
        db.session.commit()
        return _schema.dump(eq)

    @roles_required(UserRole.ADMIN)
    def delete(self, equipment_id: int):
        eq = db.session.get(Equipment, equipment_id)
        if eq is None:
            abort(404, description="Equipment not found")
        db.session.delete(eq)
        db.session.commit()
        return "", 204
