from __future__ import annotations

from flask_restful import Resource
from sqlalchemy import text

from ..extensions import db


class HealthResource(Resource):
    def get(self):
        try:
            db.session.execute(text("SELECT 1"))
            db_ok = True
        except Exception:
            db_ok = False
        return {"status": "ok" if db_ok else "degraded", "database": db_ok}, (200 if db_ok else 503)
