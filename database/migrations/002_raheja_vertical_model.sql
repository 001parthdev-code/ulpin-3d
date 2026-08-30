BEGIN;

-- ============================================================
-- RAHEJA TOWER VERTICAL PROPERTY MODEL
--
-- Real:
--   building identity
--   OSM footprint
--   OSM height
--   OSM level count
--
-- Derived:
--   individual floor volumes
--
-- No official parcel / ULPIN is claimed.
-- ============================================================


-- ------------------------------------------------------------
-- 1. CLEAN PREVIOUS DERIVED FLOORS
-- ------------------------------------------------------------

DELETE FROM floors
WHERE building_id = (
    SELECT id
    FROM buildings
    WHERE building_id = 'OSM-WAY-353159496'
);


-- ------------------------------------------------------------
-- 2. GENERATE 15 FLOORS
--
-- Raheja Tower:
-- height = 45 m
-- levels = 15
--
-- Derived floor height:
--
-- 45 / 15 = 3 m
-- ------------------------------------------------------------

INSERT INTO floors (
    floor_id,
    building_id,
    floor_number,
    footprint,
    z_min_m,
    z_max_m,
    source_type,
    derivation_method,
    verification_status
)
SELECT
    'RAHEJA-F' ||
    LPAD(level_number::TEXT, 2, '0'),

    b.id,

    level_number,

    b.footprint,

    (level_number - 1) *
        (b.height_m / b.levels),

    level_number *
        (b.height_m / b.levels),

    'derived',

    'Derived from OpenStreetMap building footprint, height, and building:levels',

    'unverified'

FROM buildings b

CROSS JOIN generate_series(
    1,
    b.levels
) AS level_number

WHERE
    b.building_id =
        'OSM-WAY-353159496'

    AND b.height_m IS NOT NULL

    AND b.levels IS NOT NULL

    AND b.levels > 0;


COMMIT;