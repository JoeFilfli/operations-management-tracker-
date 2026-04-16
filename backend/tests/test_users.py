from tests.helpers import login_as


def test_admin_can_list_users(client):
    admin_h, _ = login_as(client, "admin")
    # seed extra users
    login_as(client, "staff")
    login_as(client, "field")
    resp = client.get("/api/users", headers=admin_h)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total"] == 3
    emails = sorted(u["email"] for u in data["items"])
    assert emails == ["admin@example.com", "field@example.com", "staff@example.com"]


def test_staff_forbidden_from_user_list(client):
    staff_h, _ = login_as(client, "staff")
    resp = client.get("/api/users", headers=staff_h)
    assert resp.status_code == 403


def test_admin_create_user(client):
    admin_h, _ = login_as(client, "admin")
    resp = client.post(
        "/api/users",
        headers=admin_h,
        json={"email": "new@example.com", "password": "password123", "full_name": "New", "role": "staff"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["email"] == "new@example.com"


def test_admin_cannot_delete_self(client):
    admin_h, admin_user = login_as(client, "admin")
    resp = client.delete(f"/api/users/{admin_user['id']}", headers=admin_h)
    assert resp.status_code == 400


def test_me_can_update_profile_but_not_role(client):
    staff_h, user = login_as(client, "staff")
    resp = client.patch(
        "/api/users/me",
        headers=staff_h,
        json={"full_name": "Renamed", "role": "admin", "is_active": False},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["full_name"] == "Renamed"
    assert data["role"] == "staff"
    assert data["is_active"] is True
