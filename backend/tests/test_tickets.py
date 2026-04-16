from tests.helpers import login_as


def _make_equipment(client, headers, asset_tag="A-1"):
    return client.post("/api/equipment", headers=headers, json={"asset_tag": asset_tag, "name": "Gear"}).get_json()


def test_field_can_create_ticket(client):
    staff_h, _ = login_as(client, "staff")
    eq = _make_equipment(client, staff_h)
    field_h, field_user = login_as(client, "field")
    resp = client.post(
        "/api/tickets",
        headers=field_h,
        json={"title": "Broken", "equipment_id": eq["id"], "priority": "high"},
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["title"] == "Broken"
    assert data["priority"] == "high"
    assert data["status"] == "open"
    assert data["reporter"]["id"] == field_user["id"]


def test_create_ticket_with_assignees(client):
    staff_h, _ = login_as(client, "staff")
    eq = _make_equipment(client, staff_h)
    _, field_user = login_as(client, "field")
    resp = client.post(
        "/api/tickets",
        headers=staff_h,
        json={"title": "Broken", "equipment_id": eq["id"], "assignee_ids": [field_user["id"]]},
    )
    assert resp.status_code == 201
    assert [a["user_id"] for a in resp.get_json()["assignments"]] == [field_user["id"]]


def test_field_cannot_modify_others_ticket(client):
    staff_h, _ = login_as(client, "staff")
    eq = _make_equipment(client, staff_h)
    ticket = client.post(
        "/api/tickets",
        headers=staff_h,
        json={"title": "Broken", "equipment_id": eq["id"]},
    ).get_json()
    field_h, _ = login_as(client, "field")
    resp = client.patch(f"/api/tickets/{ticket['id']}", headers=field_h, json={"status": "closed"})
    assert resp.status_code == 403


def test_assignee_can_update_ticket(client):
    staff_h, _ = login_as(client, "staff")
    eq = _make_equipment(client, staff_h)
    field_h, field_user = login_as(client, "field")
    ticket = client.post(
        "/api/tickets",
        headers=staff_h,
        json={"title": "Broken", "equipment_id": eq["id"], "assignee_ids": [field_user["id"]]},
    ).get_json()
    resp = client.patch(f"/api/tickets/{ticket['id']}", headers=field_h, json={"status": "in_progress"})
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "in_progress"


def test_resolving_sets_resolved_at(client):
    staff_h, _ = login_as(client, "staff")
    eq = _make_equipment(client, staff_h)
    ticket = client.post(
        "/api/tickets",
        headers=staff_h,
        json={"title": "Broken", "equipment_id": eq["id"]},
    ).get_json()
    resp = client.patch(f"/api/tickets/{ticket['id']}", headers=staff_h, json={"status": "resolved"})
    assert resp.status_code == 200
    assert resp.get_json()["resolved_at"] is not None


def test_add_and_remove_assignment(client):
    staff_h, _ = login_as(client, "staff")
    eq = _make_equipment(client, staff_h)
    _, field_user = login_as(client, "field")
    ticket = client.post(
        "/api/tickets",
        headers=staff_h,
        json={"title": "Broken", "equipment_id": eq["id"]},
    ).get_json()
    add = client.post(
        f"/api/tickets/{ticket['id']}/assignments",
        headers=staff_h,
        json={"user_id": field_user["id"]},
    )
    assert add.status_code == 201
    dup = client.post(
        f"/api/tickets/{ticket['id']}/assignments",
        headers=staff_h,
        json={"user_id": field_user["id"]},
    )
    assert dup.status_code == 409
    rem = client.delete(
        f"/api/tickets/{ticket['id']}/assignments/{field_user['id']}",
        headers=staff_h,
    )
    assert rem.status_code == 204


def test_mine_filter(client):
    staff_h, _ = login_as(client, "staff")
    eq = _make_equipment(client, staff_h)
    field_h, field_user = login_as(client, "field")
    mine_ticket = client.post(
        "/api/tickets",
        headers=staff_h,
        json={"title": "Mine", "equipment_id": eq["id"], "assignee_ids": [field_user["id"]]},
    ).get_json()
    client.post("/api/tickets", headers=staff_h, json={"title": "Other", "equipment_id": eq["id"]})
    resp = client.get("/api/tickets?mine=1", headers=field_h)
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.get_json()["items"]]
    assert titles == [mine_ticket["title"]]
