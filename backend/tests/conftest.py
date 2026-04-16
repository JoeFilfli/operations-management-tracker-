from __future__ import annotations

import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db as _db


@pytest.fixture(scope="session")
def app():
    app = create_app(TestConfig)
    yield app


@pytest.fixture()
def db(app):
    """Drop and recreate all tables for each test for strict isolation."""
    with app.app_context():
        _db.drop_all()
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app, db):
    return app.test_client()


@pytest.fixture()
def auth_headers(client):
    """Register a fresh admin user and return bearer auth headers for them."""
    payload = {
        "email": "tester@example.com",
        "password": "password123",
        "full_name": "Test User",
        "role": "admin",
    }
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201, resp.get_json()
    token = resp.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
