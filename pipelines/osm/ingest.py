from __future__ import annotations

import json
import math
import sys
from typing import Any

import psycopg
import requests
from psycopg.types.json import Jsonb
from shapely.geometry import LineString, Polygon
from shapely.validation import make_valid


# ============================================================
# CONFIGURATION
# ============================================================

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

DATABASE_URL = (
    "postgresql://ulpin:ulpin_dev_password@localhost:5432/ulpin"
)

# Existing prototype center.
CENTER_LAT = 19.0007
CENTER_LON = 72.8309

# Approximately 500 m in each direction.
# Total AOI ≈ 1 km x 1 km.
LAT_DELTA = 0.0045
LON_DELTA = 0.0052

SOUTH = CENTER_LAT - LAT_DELTA
NORTH = CENTER_LAT + LAT_DELTA
WEST = CENTER_LON - LON_DELTA
EAST = CENTER_LON + LON_DELTA


# ============================================================
# OVERPASS QUERY
# ============================================================

OVERPASS_QUERY = f"""
[out:json][timeout:90];

(
    way["building"]({SOUTH},{WEST},{NORTH},{EAST});

    way["highway"]({SOUTH},{WEST},{NORTH},{EAST});

    way["leisure"="park"]({SOUTH},{WEST},{NORTH},{EAST});
    way["leisure"="garden"]({SOUTH},{WEST},{NORTH},{EAST});
    way["landuse"="grass"]({SOUTH},{WEST},{NORTH},{EAST});
    way["landuse"="recreation_ground"]({SOUTH},{WEST},{NORTH},{EAST});

    way["natural"="water"]({SOUTH},{WEST},{NORTH},{EAST});
    way["waterway"]({SOUTH},{WEST},{NORTH},{EAST});
);

out geom;
"""


# ============================================================
# HELPERS
# ============================================================


def fetch_osm() -> dict[str, Any]:
    print("Fetching OpenStreetMap data...")

    response = requests.post(
        OVERPASS_URL,
        data={"data": OVERPASS_QUERY},
        timeout=120,
        headers={
            "User-Agent": "ULPIN-3D-Prototype/0.1"
        },
    )

    response.raise_for_status()

    data = response.json()

    print(
        f"Received {len(data.get('elements', []))} OSM elements."
    )

    return data


def geometry_coordinates(
    element: dict[str, Any],
) -> list[tuple[float, float]]:
    geometry = element.get("geometry", [])

    return [
        (point["lon"], point["lat"])
        for point in geometry
    ]


def parse_number(
    value: str | None,
) -> float | None:
    if not value:
        return None

    cleaned = (
        value.lower()
        .replace("meters", "")
        .replace("meter", "")
        .replace("metres", "")
        .replace("metre", "")
        .replace("m", "")
        .strip()
    )

    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_levels(
    tags: dict[str, Any],
) -> int | None:
    raw = tags.get("building:levels")

    if raw is None:
        return None

    try:
        levels = int(float(raw))

        if levels > 0:
            return levels
    except (TypeError, ValueError):
        pass

    return None


def derive_height(
    tags: dict[str, Any],
) -> tuple[float | None, int | None, str | None]:
    """
    Priority:

    1. Explicit OSM height
    2. building:levels * 3m
    3. Unknown

    We deliberately do not fabricate a height when OSM
    provides neither height nor level information.
    """

    explicit_height = parse_number(
        tags.get("height")
    )

    levels = parse_levels(tags)

    if explicit_height and explicit_height > 0:
        return (
            explicit_height,
            levels,
            "OSM explicit height",
        )

    if levels:
        return (
            levels * 3.0,
            levels,
            "Derived from OSM building:levels using 3m/floor",
        )

    return None, None, None


def polygon_from_element(
    element: dict[str, Any],
) -> Polygon | None:
    coordinates = geometry_coordinates(element)

    if len(coordinates) < 4:
        return None

    if coordinates[0] != coordinates[-1]:
        coordinates.append(coordinates[0])

    polygon = Polygon(coordinates)

    if polygon.is_empty:
        return None

    if not polygon.is_valid:
        polygon = make_valid(polygon)

    if polygon.geom_type != "Polygon":
        return None

    return polygon


def line_from_element(
    element: dict[str, Any],
) -> LineString | None:
    coordinates = geometry_coordinates(element)

    if len(coordinates) < 2:
        return None

    line = LineString(coordinates)

    if line.is_empty:
        return None

    return line


# ============================================================
# DATABASE
# ============================================================


def ingest_building(
    cursor: psycopg.Cursor,
    element: dict[str, Any],
) -> bool:
    tags = element.get("tags", {})

    polygon = polygon_from_element(element)

    if polygon is None:
        return False

    osm_type = element["type"]
    osm_id = element["id"]

    building_id = f"OSM-{osm_type.upper()}-{osm_id}"

    height_m, levels, derivation_method = (
        derive_height(tags)
    )

    building_type = tags.get("building")

    name = tags.get("name")

    cursor.execute(
        """
        INSERT INTO buildings (
            building_id,
            parcel_id,
            name,
            footprint,
            height_m,
            floor_count,
            source_type,
            source_name,
            derivation_method,
            verification_status,
            osm_type,
            osm_id,
            osm_tags,
            building_type,
            levels
        )
        VALUES (
            %s,
            NULL,
            %s,
            ST_SetSRID(
                ST_GeomFromText(%s),
                4326
            ),
            %s,
            %s,
            'real',
            'OpenStreetMap',
            %s,
            'unverified',
            %s,
            %s,
            %s,
            %s,
            %s
        )
        ON CONFLICT (building_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            footprint = EXCLUDED.footprint,
            height_m = EXCLUDED.height_m,
            floor_count = EXCLUDED.floor_count,
            source_type = EXCLUDED.source_type,
            source_name = EXCLUDED.source_name,
            derivation_method = EXCLUDED.derivation_method,
            verification_status = EXCLUDED.verification_status,
            osm_tags = EXCLUDED.osm_tags,
            building_type = EXCLUDED.building_type,
            levels = EXCLUDED.levels,
            updated_at = NOW();
        """,
        (
            building_id,
            name,
            polygon.wkt,
            height_m,
            levels,
            derivation_method,
            osm_type,
            osm_id,
            Jsonb(tags),
            building_type,
            levels,
        ),
    )

    return True


def ingest_road(
    cursor: psycopg.Cursor,
    element: dict[str, Any],
) -> bool:
    tags = element.get("tags", {})

    line = line_from_element(element)

    if line is None:
        return False

    osm_type = element["type"]
    osm_id = element["id"]

    road_id = f"OSM-{osm_type.upper()}-{osm_id}"

    cursor.execute(
        """
        INSERT INTO roads (
            road_id,
            osm_type,
            osm_id,
            name,
            highway_type,
            geometry,
            osm_tags
        )
        VALUES (
            %s,
            %s,
            %s,
            %s,
            %s,
            ST_SetSRID(
                ST_GeomFromText(%s),
                4326
            ),
            %s
        )
        ON CONFLICT (road_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            highway_type = EXCLUDED.highway_type,
            geometry = EXCLUDED.geometry,
            osm_tags = EXCLUDED.osm_tags;
        """,
        (
            road_id,
            osm_type,
            osm_id,
            tags.get("name"),
            tags.get("highway"),
            line.wkt,
            Jsonb(tags),
        ),
    )

    return True


def ingest_park(
    cursor: psycopg.Cursor,
    element: dict[str, Any],
) -> bool:
    tags = element.get("tags", {})

    polygon = polygon_from_element(element)

    if polygon is None:
        return False

    osm_type = element["type"]
    osm_id = element["id"]

    park_id = f"OSM-{osm_type.upper()}-{osm_id}"

    feature_type = (
        tags.get("leisure")
        or tags.get("landuse")
    )

    cursor.execute(
        """
        INSERT INTO parks (
            park_id,
            osm_type,
            osm_id,
            name,
            feature_type,
            geometry,
            osm_tags
        )
        VALUES (
            %s,
            %s,
            %s,
            %s,
            %s,
            ST_SetSRID(
                ST_GeomFromText(%s),
                4326
            ),
            %s
        )
        ON CONFLICT (park_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            feature_type = EXCLUDED.feature_type,
            geometry = EXCLUDED.geometry,
            osm_tags = EXCLUDED.osm_tags;
        """,
        (
            park_id,
            osm_type,
            osm_id,
            tags.get("name"),
            feature_type,
            polygon.wkt,
            Jsonb(tags),
        ),
    )

    return True


def ingest_water(
    cursor: psycopg.Cursor,
    element: dict[str, Any],
) -> bool:
    tags = element.get("tags", {})

    osm_type = element["type"]
    osm_id = element["id"]

    water_id = f"OSM-{osm_type.upper()}-{osm_id}"

    feature_type = (
        tags.get("water")
        or tags.get("waterway")
        or tags.get("natural")
    )

    coordinates = geometry_coordinates(element)

    if len(coordinates) < 2:
        return False

    is_polygon = (
        len(coordinates) >= 4
        and coordinates[0] == coordinates[-1]
    )

    if is_polygon:
        geometry = polygon_from_element(element)
    else:
        geometry = line_from_element(element)

    if geometry is None:
        return False

    cursor.execute(
        """
        INSERT INTO water_features (
            water_id,
            osm_type,
            osm_id,
            name,
            feature_type,
            geometry,
            osm_tags
        )
        VALUES (
            %s,
            %s,
            %s,
            %s,
            %s,
            ST_SetSRID(
                ST_GeomFromText(%s),
                4326
            ),
            %s
        )
        ON CONFLICT (water_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            feature_type = EXCLUDED.feature_type,
            geometry = EXCLUDED.geometry,
            osm_tags = EXCLUDED.osm_tags;
        """,
        (
            water_id,
            osm_type,
            osm_id,
            tags.get("name"),
            feature_type,
            geometry.wkt,
            Jsonb(tags),
        ),
    )

    return True


# ============================================================
# PIPELINE
# ============================================================


def main() -> None:
    data = fetch_osm()

    elements = data.get("elements", [])

    stats = {
        "buildings": 0,
        "roads": 0,
        "parks": 0,
        "water": 0,
        "skipped": 0,
    }

    print("Connecting to PostGIS...")

    with psycopg.connect(
        DATABASE_URL
    ) as connection:

        with connection.cursor() as cursor:

            for element in elements:
                tags = element.get(
                    "tags",
                    {},
                )

                try:
                    if "building" in tags:
                        if ingest_building(
                            cursor,
                            element,
                        ):
                            stats["buildings"] += 1
                        else:
                            stats["skipped"] += 1

                    elif "highway" in tags:
                        if ingest_road(
                            cursor,
                            element,
                        ):
                            stats["roads"] += 1
                        else:
                            stats["skipped"] += 1

                    elif (
                        tags.get("leisure")
                        in {"park", "garden"}
                        or tags.get("landuse")
                        in {
                            "grass",
                            "recreation_ground",
                        }
                    ):
                        if ingest_park(
                            cursor,
                            element,
                        ):
                            stats["parks"] += 1
                        else:
                            stats["skipped"] += 1

                    elif (
                        tags.get("natural")
                        == "water"
                        or "waterway" in tags
                    ):
                        if ingest_water(
                            cursor,
                            element,
                        ):
                            stats["water"] += 1
                        else:
                            stats["skipped"] += 1

                except Exception as exc:
                    stats["skipped"] += 1

                    print(
                        "Skipped "
                        f"{element.get('type')} "
                        f"{element.get('id')}: "
                        f"{exc}"
                    )

            connection.commit()

    print()
    print("OSM ingestion complete.")
    print("-----------------------")
    print(f"Buildings : {stats['buildings']}")
    print(f"Roads     : {stats['roads']}")
    print(f"Parks     : {stats['parks']}")
    print(f"Water     : {stats['water']}")
    print(f"Skipped   : {stats['skipped']}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Cancelled.")
        sys.exit(1)
    except Exception as exc:
        print(f"Fatal error: {exc}")
        sys.exit(1)