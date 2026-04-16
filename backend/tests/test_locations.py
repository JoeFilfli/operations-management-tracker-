from tests.helpers import login_as


def test_staff_can_create_location(client):
    staff_h, _ = login_as(client, "staff")
    resp = client.post(
        "/api/locations",
        headers=staff_h,
        json={"name": "Lab A", "description": "Main lab"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["name"] == "Lab A"


def test_field_cannot_create_location(client):
    field_h, _ = login_as(client, "field")
    resp = client.post("/api/locations", headers=field_h, json={"name": "Lab A"})
    assert resp.status_code == 403


def test_duplicate_location_name_conflicts(client):
    staff_h, _ = login_as(client, "staff")
    client.post("/api/locations", headers=staff_h, json={"name": "Lab A"})
    resp = client.post("/api/locations", headers=staff_h, json={"name": "Lab A"})
    assert resp.status_code == 409


def test_only_admin_deletes_location(client):
    admin_h, _ = login_as(client, "admin")
    staff_h, _ = login_as(client, "staff")
    created = client.post("/api/locations", headers=staff_h, json={"name": "Lab A"}).get_json()
    assert client.delete(f"/api/locations/{created['id']}", headers=staff_h).status_code == 403
    assert client.delete(f"/api/locations/{created['id']}", headers=admin_h).status_code == 204


def test_location_list_search(client):
    staff_h, _ = login_as(client, "staff")
    client.post("/api/locations", headers=staff_h, json={"name": "Server Room"})
    client.post("/api/locations", headers=staff_h, json={"name": "Lab A"})
    resp = client.get("/api/locations?q=lab", headers=staff_h)
    assert resp.status_code == 200
    names = [i["name"] for i in resp.get_json()["items"]]
    assert names == ["Lab A"]
