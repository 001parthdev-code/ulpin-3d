from fastapi import APIRouter, HTTPException

from ..database import get_connection


router = APIRouter(
    prefix="/parcels",
    tags=["Parcels"],
)


@router.get("")
def get_parcels():
    query = """
        SELECT
            parcel_id,
            official_ulpin,
            name,
            source_type,
            source_name,
            verification_status,
            ST_AsGeoJSON(geometry)::json AS geometry
        FROM parcels
        ORDER BY parcel_id;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            return cursor.fetchall()


@router.get("/{parcel_id}")
def get_parcel(parcel_id: str):
    query = """
        SELECT
            parcel_id,
            official_ulpin,
            name,
            source_type,
            source_name,
            derivation_method,
            verification_status,
            ST_AsGeoJSON(geometry)::json AS geometry
        FROM parcels
        WHERE parcel_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (parcel_id,))
            parcel = cursor.fetchone()

    if parcel is None:
        raise HTTPException(
            status_code=404,
            detail="Parcel not found",
        )

    return parcel


@router.get("/{parcel_id}/buildings")
def get_parcel_buildings(parcel_id: str):
    query = """
        SELECT
            b.building_id,
            b.name,
            b.height_m,
            b.floor_count,
            b.source_type,
            b.source_name,
            b.verification_status,
            ST_AsGeoJSON(b.footprint)::json AS footprint
        FROM buildings b
        JOIN parcels p
            ON p.id = b.parcel_id
        WHERE p.parcel_id = %s
        ORDER BY b.building_id;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (parcel_id,))
            buildings = cursor.fetchall()

    return buildings