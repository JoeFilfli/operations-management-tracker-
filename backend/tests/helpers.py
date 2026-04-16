from __future__ import annotations


def register(client, email: str, password: str = "password123", full_name: str = "User", role: str = "staff"):
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": full_name, "role": role},
    )
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login_as(client, role: str, suffix: str = ""):
    email = f"{role}{suffix}@example.com"
    body = register(client, email=email, role=role, full_name=role.title())
    return bearer(body["access_token"]), body["user"]
