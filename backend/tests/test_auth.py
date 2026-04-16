def _register(client, **overrides):
    payload = {
        "email": "alice@example.com",
        "password": "password123",
        "full_name": "Alice",
        "role": "staff",
    }
    payload.update(overrides)
    return client.post("/api/auth/register", json=payload)


def test_register_creates_user_and_returns_tokens(client, db):
    resp = _register(client)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["role"] == "staff"
    assert data["access_token"]
    assert data["refresh_token"]


def test_register_duplicate_email_returns_409(client, db):
    _register(client)
    resp = _register(client, full_name="Alice Two")
    assert resp.status_code == 409


def test_register_invalid_payload_returns_422(client, db):
    resp = client.post("/api/auth/register", json={"email": "not-an-email"})
    assert resp.status_code == 422


def test_login_success(client, db):
    _register(client)
    resp = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["access_token"]


def test_login_wrong_password(client, db):
    _register(client)
    resp = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "wrong"},
    )
    assert resp.status_code == 401


def test_me_requires_auth(client, db):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["email"] == "tester@example.com"


def test_refresh_returns_new_access_token(client, db):
    reg = _register(client)
    refresh = reg.get_json()["refresh_token"]
    resp = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {refresh}"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["access_token"]
