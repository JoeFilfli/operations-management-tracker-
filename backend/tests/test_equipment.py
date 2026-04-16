from tests.helpers import login_as


def _create_location(client, headers, name="Lab A"):
    return client.post("/api/locations", headers=headers, json={"name": name}).get_json()


def test_staff_creates_equipment_with_location(client):
    staff_h, _ = login_as(client, "staff")
    loc = _create_location(client, staff_h)
    resp = client.post(
        "/api/equipment",
        headers=staff_h,
        json={"asset_tag": "A-1", "name": "Microscope", "location_id": loc["id"]},
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["asset_tag"] == "A-1"
    assert data["status"] == "available"
    assert data["location"]["id"] == loc["id"]


def test_field_cannot_create_equipment(client):
    field_h, _ = login_as(client, "field")
    resp = client.post(
        "/api/equipment",
        headers=field_h,
        json={"asset_tag": "A-1", "name": "Microscope"},
    )
    assert resp.status_code == 403


def test_duplicate_asset_tag_conflicts(client):
    staff_h, _ = login_as(client, "staff")
    client.post("/api/equipment", headers=staff_h, json={"asset_tag": "A-1", "name": "X"})
    resp = client.post("/api/equipment", headers=staff_h, json={"asset_tag": "A-1", "name": "Y"})
    assert resp.status_code == 409


def test_patch_equipment_status_transition(client):
    staff_h, _ = login_as(client, "staff")
    eq = client.post("/api/equipment", headers=staff_h, json={"asset_tag": "A-1", "name": "X"}).get_json()
    resp = client.patch(f"/api/equipment/{eq['id']}", headers=staff_h, json={"status": "maintenance"})
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "maintenance"


def test_equipment_list_filters_by_status(client):
    staff_h, _ = login_as(client, "staff")
    a = client.post("/api/equipment", headers=staff_h, json={"asset_tag": "A-1", "name": "X"}).get_json()
    client.post("/api/equipment", headers=staff_h, json={"asset_tag": "A-2", "name": "Y"})
    client.patch(f"/api/equipment/{a['id']}", headers=staff_h, json={"status": "retired"})

    resp = client.get("/api/equipment?status=retired", headers=staff_h)
    assert resp.status_code == 200
    tags = [e["asset_tag"] for e in resp.get_json()["items"]]
    assert tags == ["A-1"]


def test_field_can_read_equipment(client):
    staff_h, _ = login_as(client, "staff")
    client.post("/api/equipment", headers=staff_h, json={"asset_tag": "A-1", "name": "X"})
    field_h, _ = login_as(client, "field")
    resp = client.get("/api/equipment", headers=field_h)
    assert resp.status_code == 200
    assert resp.get_json()["total"] == 1
