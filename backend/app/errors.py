from __future__ import annotations

from flask import Flask, jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from .extensions import db


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ValidationError)
    def handle_validation_error(err: ValidationError):
        return jsonify({"error": "validation_error", "messages": err.messages}), 422

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(_err: IntegrityError):
        db.session.rollback()
        return jsonify({"error": "integrity_error", "message": "Resource conflict"}), 409

    @app.errorhandler(HTTPException)
    def handle_http_exception(err: HTTPException):
        name = (err.name or "http_error").lower().replace(" ", "_")
        return jsonify({"error": name, "message": err.description}), err.code or 500
