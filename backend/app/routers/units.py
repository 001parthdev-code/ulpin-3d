from fastapi import APIRouter, HTTPException

from ..database import get_connection


router = APIRouter(
    prefix="/units",
    tags=["Units"],
)


@router.get("/{unit_id}")
def get_unit(unit_id: str):
    query = """
        SELECT
            u.unit_id,
            u.unit_number,
            f.floor_id,
            f.floor_number,
            b.building_id,
            p.parcel_id,
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
        JOIN buildings b
            ON b.id = f.building_id
        JOIN parcels p
            ON p.id = b.parcel_id
        WHERE u.unit_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (unit_id,))
            unit = cursor.fetchone()

    if unit is None:
        raise HTTPException(
            status_code=404,
            detail="Unit not found",
        )

    return unit