import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


RAHEJA_LON = 72.86295
RAHEJA_LAT = 19.06090

RAHEJA_BUILDING_ID = "OSM-WAY-353159496"


def resolve(z: float):
    return client.get(
        "/spatial/resolve",
        params={
            "lon": RAHEJA_LON,
            "lat": RAHEJA_LAT,
            "z": z,
        },
    )


# ============================================================
# BASIC RESOLUTION
# ============================================================


def test_resolves_raheja_tower():
    response = resolve(22.5)

    assert response.status_code == 200

    data = response.json()

    assert (
        data["building"]["building_id"]
        == RAHEJA_BUILDING_ID
    )

    assert (
        data["building"]["name"]
        == "Raheja Tower"
    )

    assert (
        data["floor"]["floor_id"]
        == "RAHEJA-F08"
    )

    assert (
        data["floor"]["floor_number"]
        == 8
    )


# ============================================================
# HALF-OPEN VERTICAL INTERVALS
#
# Floor containment:
#
#     z_min <= z < z_max
#
# F07 = [18, 21)
# F08 = [21, 24)
# F09 = [24, 27)
# ============================================================


@pytest.mark.parametrize(
    ("z", "expected_floor"),
    [
        (20.999999, "RAHEJA-F07"),
        (21.0, "RAHEJA-F08"),
        (23.999999, "RAHEJA-F08"),
        (24.0, "RAHEJA-F09"),
    ],
)
def test_floor_boundary_resolution(
    z: float,
    expected_floor: str,
):
    response = resolve(z)

    assert response.status_code == 200

    data = response.json()

    assert (
        data["floor"]["floor_id"]
        == expected_floor
    )


# ============================================================
# BUILDING EXTREMES
# ============================================================


def test_ground_level_resolves_floor_1():
    response = resolve(0.0)

    assert response.status_code == 200

    data = response.json()

    assert (
        data["floor"]["floor_id"]
        == "RAHEJA-F01"
    )

    assert (
        data["floor"]["z_min_m"]
        == 0.0
    )

    assert (
        data["floor"]["z_max_m"]
        == 3.0
    )


def test_just_below_roof_resolves_floor_15():
    response = resolve(44.999999)

    assert response.status_code == 200

    data = response.json()

    assert (
        data["floor"]["floor_id"]
        == "RAHEJA-F15"
    )


def test_roof_boundary_has_no_floor():
    response = resolve(45.0)

    assert response.status_code == 200

    data = response.json()

    assert (
        data["building"]["building_id"]
        == RAHEJA_BUILDING_ID
    )

    assert data["floor"] is None

    assert data["hierarchy"] == [
        RAHEJA_BUILDING_ID
    ]


# ============================================================
# PROVENANCE
# ============================================================


def test_preserves_source_provenance():
    response = resolve(22.5)

    assert response.status_code == 200

    data = response.json()

    building = data["building"]
    floor = data["floor"]

    assert (
        building["source_type"]
        == "real"
    )

    assert (
        building["source_name"]
        == "OpenStreetMap"
    )

    assert (
        floor["source_type"]
        == "derived"
    )

    assert (
        floor["verification_status"]
        == "unverified"
    )


# ============================================================
# HIERARCHY
# ============================================================


def test_resolution_returns_hierarchy():
    response = resolve(22.5)

    assert response.status_code == 200

    data = response.json()

    assert data["hierarchy"] == [
        RAHEJA_BUILDING_ID,
        "RAHEJA-F08",
    ]


# ============================================================
# NO SPATIAL MATCH
# ============================================================


def test_point_outside_building_returns_404():
    response = client.get(
        "/spatial/resolve",
        params={
            "lon": 72.8500,
            "lat": 19.0500,
            "z": 22.5,
        },
    )

    assert response.status_code == 404


# ============================================================
# INPUT VALIDATION
# ============================================================


@pytest.mark.parametrize(
    ("lon", "lat"),
    [
        (181.0, 19.0),
        (-181.0, 19.0),
        (72.0, 91.0),
        (72.0, -91.0),
    ],
)
def test_rejects_invalid_coordinates(
    lon: float,
    lat: float,
):
    response = client.get(
        "/spatial/resolve",
        params={
            "lon": lon,
            "lat": lat,
            "z": 10,
        },
    )

    assert response.status_code == 422