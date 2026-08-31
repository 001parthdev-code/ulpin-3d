from typing import Any

from fastapi import APIRouter, HTTPException, Query

from backend.app.database import get_connection


router = APIRouter(
    prefix="/spatial",
    tags=["spatial"],
)


@router.get("/resolve")
def resolve_spatial_point(
    lon: float = Query(
        ...,
        ge=-180.0,
        le=180.0,
    ),
    lat: float = Query(
        ...,
        ge=-90.0,
        le=90.0,
    ),
    z: float = Query(...),
) -> dict[str, Any]:
    """
    Resolve a 3D coordinate into the spatial
    property hierarchy containing that point.

    Horizontal containment:
        building footprint covers (lon, lat)

    Vertical containment:
        z_min_m <= z < z_max_m

    The half-open vertical interval is deliberate.
    It guarantees that a boundary such as z=24
    belongs to exactly one floor.
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    b.building_id,
                    b.name,
                    b.building_type,
                    b.height_m,
                    b.levels,

                    b.source_type
                        AS building_source_type,

                    b.source_name
                        AS building_source_name,

                    f.floor_id,
                    f.floor_number,
                    f.z_min_m,
                    f.z_max_m,

                    f.source_type
                        AS floor_source_type,

                    f.derivation_method,
                    f.verification_status

                FROM buildings b

                LEFT JOIN floors f
                    ON f.building_id = b.id

                    AND f.z_min_m <= %s

                    AND %s < f.z_max_m

                WHERE
                    ST_Covers(
                        b.footprint,

                        ST_SetSRID(
                            ST_Point(
                                %s,
                                %s
                            ),
                            4326
                        )
                    )

                ORDER BY
                    CASE
                        WHEN f.floor_id IS NOT NULL
                        THEN 0
                        ELSE 1
                    END,

                    ST_Area(
                        b.footprint::geography
                    ) ASC

                LIMIT 1;
                """,
                (
                    z,
                    z,
                    lon,
                    lat,
                ),
            )

            row = cursor.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No spatial entity contains "
                "the supplied point."
            ),
        )

    # =========================================================
    # BUILDING
    # =========================================================

    building = {
        "building_id":
            row["building_id"],

        "name":
            row["name"],

        "building_type":
            row["building_type"],

        "height_m":
            (
                float(
                    row["height_m"]
                )
                if row["height_m"]
                is not None
                else None
            ),

        "levels":
            row["levels"],

        "source_type":
            row[
                "building_source_type"
            ],

        "source_name":
            row[
                "building_source_name"
            ],
    }

    # =========================================================
    # FLOOR
    # =========================================================

    floor = None

    if (
        row["floor_id"]
        is not None
    ):
        floor = {
            "floor_id":
                row["floor_id"],

            "floor_number":
                row["floor_number"],

            "z_min_m":
                float(
                    row["z_min_m"]
                ),

            "z_max_m":
                float(
                    row["z_max_m"]
                ),

            "source_type":
                row[
                    "floor_source_type"
                ],

            "derivation_method":
                row[
                    "derivation_method"
                ],

            "verification_status":
                row[
                    "verification_status"
                ],
        }

    # =========================================================
    # RESPONSE
    # =========================================================

    return {
        "point": {
            "lon": lon,
            "lat": lat,
            "z": z,
        },

        "building":
            building,

        "floor":
            floor,

        "hierarchy": [
            building[
                "building_id"
            ],

            *(
                [
                    floor[
                        "floor_id"
                    ]
                ]
                if floor
                else []
            ),
        ],
    }