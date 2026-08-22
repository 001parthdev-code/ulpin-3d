from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_parcel():
    response = client.get("/parcels/P001")

    assert response.status_code == 200

    data = response.json()

    assert data["parcel_id"] == "P001"
    assert data["source_type"] == "synthetic"
    assert data["geometry"]["type"] == "Polygon"


def test_missing_parcel_returns_404():
    response = client.get("/parcels/DOES-NOT-EXIST")

    assert response.status_code == 404


def test_property_tree():
    response = client.get("/parcels/P001/tree")

    assert response.status_code == 200

    parcel = response.json()

    assert parcel["parcel_id"] == "P001"
    assert len(parcel["buildings"]) == 1

    building = parcel["buildings"][0]

    assert building["building_id"] == "B001"
    assert building["floor_count"] == 3
    assert len(building["floors"]) == 3

    expected_units = {
        1: {"101", "102"},
        2: {"201", "202"},
        3: {"301", "302"},
    }

    for floor in building["floors"]:
        floor_number = floor["floor_number"]

        actual_units = {
            unit["unit_number"]
            for unit in floor["units"]
        }

        assert actual_units == expected_units[floor_number]


def test_unit_reverse_hierarchy():
    response = client.get("/units/U101")

    assert response.status_code == 200

    unit = response.json()

    assert unit["unit_id"] == "U101"
    assert unit["unit_number"] == "101"

    assert unit["floor_id"] == "F001"
    assert unit["building_id"] == "B001"
    assert unit["parcel_id"] == "P001"

    assert unit["z_min_m"] == 0
    assert unit["z_max_m"] == 3


def test_missing_unit_returns_404():
    response = client.get("/units/DOES-NOT-EXIST")

    assert response.status_code == 404