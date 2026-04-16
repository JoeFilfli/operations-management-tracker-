from tests.helpers import login_as


def test_activity_log_captures_location_create(client):
    admin_h, _ = login_as(client, "admin")
    client.post("/api/locations", headers=admin_h, json={"name": "Lab A"})
    resp = client.get("/api/activity?entity_type=Location", headers=admin_h)
    assert resp.status_code == 200
    entries = resp.get_json()["items"]
    assert any(e["action"] == "create" for e in entries)


def test_staff_cannot_read_activity_log(client):
    staff_h, _ = login_as(client, "staff")
    resp = client.get("/api/activity", headers=staff_h)
    assert resp.status_code == 403
