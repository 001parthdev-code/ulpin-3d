from fastapi import APIRouter, HTTPException

from ..database import get_connection


router = APIRouter(
    prefix="/buildings",
    tags=["Buildings"],
)


@router.get("/{building_id}")
def get_building(building_id: str):
    query = """
        SELECT
            b.building_id,
            p.parcel_id,
            b.name,
            b.height_m,
            b.floor_count,
            b.source_type,
            b.source_name,
            b.derivation_method,
            b.verification_status,
            ST_AsGeoJSON(b.footprint)::json AS footprint
        FROM buildings b
        JOIN parcels p
            ON p.id = b.parcel_id
        WHERE b.building_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (building_id,))
            building = cursor.fetchone()

    if building is None:
        raise HTTPException(
            status_code=404,
            detail="Building not found",
        )

    return building


@router.get("/{building_id}/floors")
def get_building_floors(building_id: str):
    query = """
        SELECT
            f.floor_id,
            f.floor_number,
            f.z_min_m,
            f.z_max_m,
            f.source_type,
            f.derivation_method,
            f.verification_status,
            ST_AsGeoJSON(f.footprint)::json AS footprint
        FROM floors f
        JOIN buildings b
            ON b.id = f.building_id
        WHERE b.building_id = %s
        ORDER BY f.floor_number;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (building_id,))
            floors = cursor.fetchall()

    return floors