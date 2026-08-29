from fastapi import APIRouter

from ..database import get_connection


router = APIRouter(
    prefix="/neighborhood",
    tags=["Neighborhood"],
)


@router.get("/buildings")
def get_neighborhood_buildings():
    query = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features',
            COALESCE(
                json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'id', building_id,
                        'geometry',
                            ST_AsGeoJSON(footprint)::json,
                        'properties',
                            json_build_object(
                                'building_id', building_id,
                                'name', name,
                                'building_type', building_type,
                                'height_m', height_m,
                                'levels', levels,
                                'source_type', source_type,
                                'source_name', source_name
                            )
                    )
                    ORDER BY building_id
                ),
                '[]'::json
            )
        ) AS geojson
        FROM buildings
        WHERE source_name = 'OpenStreetMap';
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            row = cursor.fetchone()

    return row["geojson"]


@router.get("/roads")
def get_neighborhood_roads():
    query = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features',
            COALESCE(
                json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'id', road_id,
                        'geometry',
                            ST_AsGeoJSON(geometry)::json,
                        'properties',
                            json_build_object(
                                'road_id', road_id,
                                'name', name,
                                'highway_type', highway_type,
                                'source_type', source_type,
                                'source_name', source_name
                            )
                    )
                    ORDER BY road_id
                ),
                '[]'::json
            )
        ) AS geojson
        FROM roads;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            row = cursor.fetchone()

    return row["geojson"]


@router.get("/parks")
def get_neighborhood_parks():
    query = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features',
            COALESCE(
                json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'id', park_id,
                        'geometry',
                            ST_AsGeoJSON(geometry)::json,
                        'properties',
                            json_build_object(
                                'park_id', park_id,
                                'name', name,
                                'feature_type', feature_type,
                                'source_type', source_type,
                                'source_name', source_name
                            )
                    )
                    ORDER BY park_id
                ),
                '[]'::json
            )
        ) AS geojson
        FROM parks;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            row = cursor.fetchone()

    return row["geojson"]


@router.get("/water")
def get_neighborhood_water():
    query = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features',
            COALESCE(
                json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'id', water_id,
                        'geometry',
                            ST_AsGeoJSON(geometry)::json,
                        'properties',
                            json_build_object(
                                'water_id', water_id,
                                'name', name,
                                'feature_type', feature_type,
                                'source_type', source_type,
                                'source_name', source_name
                            )
                    )
                    ORDER BY water_id
                ),
                '[]'::json
            )
        ) AS geojson
        FROM water_features;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            row = cursor.fetchone()

    return row["geojson"]


@router.get("/summary")
def get_neighborhood_summary():
    query = """
        SELECT
            (
                SELECT COUNT(*)
                FROM buildings
                WHERE source_name = 'OpenStreetMap'
            ) AS buildings,

            (
                SELECT COUNT(*)
                FROM roads
            ) AS roads,

            (
                SELECT COUNT(*)
                FROM parks
            ) AS parks,

            (
                SELECT COUNT(*)
                FROM water_features
            ) AS water_features,

            (
                SELECT COUNT(*)
                FROM buildings
                WHERE
                    source_name = 'OpenStreetMap'
                    AND height_m IS NOT NULL
            ) AS buildings_with_height;
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            return cursor.fetchone()