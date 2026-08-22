from fastapi import APIRouter, HTTPException

from ..database import get_connection


router = APIRouter(
    prefix="/floors",
    tags=["Floors"],
)


@router.get("/{floor_id}")
def get_floor(floor_id: str):
    query = """
        SELECT
            f.floor_id,
            b.building_id,
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
        WHERE f.floor_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (floor_id,))
            floor = cursor.fetchone()

    if floor is None:
        raise HTTPException(
            status_code=404,
            detail="Floor not found",
        )

    return floor


@router.get("/{floor_id}/units")
def get_floor_units(floor_id: str):
    query = """
        SELECT
            u.unit_id,
            u.unit_number,
            u.z_min_m,
            u.z_max_m,
            u.source_type,
            u.derivation_method,
            u.verification_status,
            ST_AsGeoJSON(u.footprint)::json AS footprint,
            ST_AsGeoJSON(u.entrance)::json AS entrance
        FROM units u
        JOIN floors f
            ON f.id = u.floor_id
        WHERE f.floor_id = %s
        ORDER BY u.unit_number;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (floor_id,))
            units = cursor.fetchall()

    return units