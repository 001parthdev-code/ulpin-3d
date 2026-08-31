-- ============================================================
-- DETERMINISTIC TEST FIXTURE — RAHEJA TOWER
--
-- Purpose:
--   Reproduce the minimum real-source building record required
--   by spatial resolver integration tests.
--
-- This fixture exists only for automated testing.
-- CI must not depend on the live OpenStreetMap / Overpass API.
--
-- Source attributes mirror the OSM-derived prototype record.
-- ============================================================

INSERT INTO buildings (
    building_id,
    name,
    building_type,
    height_m,
    levels,
    footprint,
    source_type,
    source_name,
    verification_status
)
VALUES (
    'OSM-WAY-353159496',

    'Raheja Tower',

    'commercial',

    45,

    15,

    ST_GeomFromText(
        'POLYGON((
            72.862665 19.0609786,
            72.8627895 19.0610293,
            72.8629902 19.0610214,
            72.8630769 19.0609911,
            72.86315 19.0609521,
            72.8632144 19.0608994,
            72.863224 19.0608467,
            72.8630798 19.0608394,
            72.8630332 19.0608034,
            72.8626958 19.0607696,
            72.862665 19.0609786
        ))',
        4326
    ),

    'real',

    'OpenStreetMap',

    'unverified'
)
ON CONFLICT (building_id)
DO UPDATE SET
    name = EXCLUDED.name,
    building_type = EXCLUDED.building_type,
    height_m = EXCLUDED.height_m,
    levels = EXCLUDED.levels,
    footprint = EXCLUDED.footprint,
    source_type = EXCLUDED.source_type,
    source_name = EXCLUDED.source_name,
    verification_status =
        EXCLUDED.verification_status;