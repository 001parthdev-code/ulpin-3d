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

@router.get("/{parcel_id}/tree")
def get_parcel_tree(parcel_id: str):
    parcel_query = """
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

    buildings_query = """
        SELECT
            id,
            building_id,
            name,
            height_m,
            floor_count,
            source_type,
            verification_status,
            ST_AsGeoJSON(footprint)::json AS footprint
        FROM buildings
        WHERE parcel_id = (
            SELECT id
            FROM parcels
            WHERE parcel_id = %s
        )
        ORDER BY building_id;
    """

    floors_query = """
        SELECT
            id,
            floor_id,
            building_id,
            floor_number,
            z_min_m,
            z_max_m,
            source_type,
            verification_status,
            ST_AsGeoJSON(footprint)::json AS footprint
        FROM floors
        WHERE building_id = ANY(%s)
        ORDER BY building_id, floor_number;
    """

    units_query = """
        SELECT
            unit_id,
            floor_id,
            unit_number,
            z_min_m,
            z_max_m,
            source_type,
            verification_status,
            ST_AsGeoJSON(footprint)::json AS footprint,
            ST_AsGeoJSON(entrance)::json AS entrance
        FROM units
        WHERE floor_id = ANY(%s)
        ORDER BY floor_id, unit_number;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:

            # Parcel
            cursor.execute(parcel_query, (parcel_id,))
            parcel = cursor.fetchone()

            if parcel is None:
                raise HTTPException(
                    status_code=404,
                    detail="Parcel not found",
                )

            # Buildings
            cursor.execute(buildings_query, (parcel_id,))
            buildings = cursor.fetchall()

            building_ids = [
                building["id"]
                for building in buildings
            ]

            # Floors
            floors = []

            if building_ids:
                cursor.execute(
                    floors_query,
                    (building_ids,),
                )
                floors = cursor.fetchall()

            floor_ids = [
                floor["id"]
                for floor in floors
            ]

            # Units
            units = []

            if floor_ids:
                cursor.execute(
                    units_query,
                    (floor_ids,),
                )
                units = cursor.fetchall()

    # ---------------------------------------------------------
    # Construct hierarchy
    # ---------------------------------------------------------

    units_by_floor = {}

    for unit in units:
        floor_db_id = unit.pop("floor_id")

        units_by_floor.setdefault(
            floor_db_id,
            [],
        ).append(unit)

    floors_by_building = {}

    for floor in floors:
        floor_db_id = floor.pop("id")
        building_db_id = floor.pop("building_id")

        floor["units"] = units_by_floor.get(
            floor_db_id,
            [],
        )

        floors_by_building.setdefault(
            building_db_id,
            [],
        ).append(floor)

    building_tree = []

    for building in buildings:
        building_db_id = building.pop("id")

        building["floors"] = floors_by_building.get(
            building_db_id,
            [],
        )

        building_tree.append(building)

    parcel["buildings"] = building_tree

    return parcel