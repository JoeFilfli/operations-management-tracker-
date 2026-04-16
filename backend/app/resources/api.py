from __future__ import annotations

from flask import current_app
from flask_restful import Api as _Api
from werkzeug.exceptions import HTTPException


class Api(_Api):
    """Flask-RESTful Api that delegates non-HTTP exceptions to Flask's error handlers.

    Flask-RESTful monkey-patches ``app.handle_user_exception`` to route everything
    through its own ``handle_error``, which swallows custom ``@app.errorhandler``
    registrations for non-HTTPException errors (marshmallow ``ValidationError``,
    flask-jwt-extended ``NoAuthorizationError``, etc.). This override looks up a
    registered handler directly via ``_find_error_handler`` and calls it, so our
    JSON error responses and Flask-JWT-Extended's auth responses work as expected.
    """

    def handle_error(self, e: Exception):
        if isinstance(e, HTTPException):
            return super().handle_error(e)
        handler = current_app._find_error_handler(e)
        if handler is None:
            return super().handle_error(e)
        return current_app.ensure_sync(handler)(e)
