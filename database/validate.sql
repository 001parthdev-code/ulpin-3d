-- ============================================================
-- ULPIN 3D PROTOTYPE
-- Spatial integrity validation
-- ============================================================


-- ------------------------------------------------------------
-- TEST 1: Expected entity counts
-- ------------------------------------------------------------

SELECT
    'ENTITY_COUNTS' AS test,
    (SELECT COUNT(*) FROM parcels) AS parcels,
    (SELECT COUNT(*) FROM buildings) AS buildings,
    (SELECT COUNT(*) FROM floors) AS floors,
    (SELECT COUNT(*) FROM units) AS units;


-- ------------------------------------------------------------
-- TEST 2: Geometry validity
-- ------------------------------------------------------------

SELECT
    'PARCEL_GEOMETRY' AS test,
    parcel_id AS entity_id,
    ST_IsValid(geometry) AS valid
FROM parcels

UNION ALL

SELECT
    'BUILDING_GEOMETRY',
    building_id,
    ST_IsValid(footprint)
FROM buildings

UNION ALL

SELECT
    'FLOOR_GEOMETRY',
    floor_id,
    ST_IsValid(footprint)
FROM floors

UNION ALL

SELECT
    'UNIT_GEOMETRY',
    unit_id,
    ST_IsValid(footprint)
FROM units

ORDER BY test, entity_id;


-- ------------------------------------------------------------
-- TEST 3: Building must be spatially covered by its parcel
-- ------------------------------------------------------------

SELECT
    'BUILDING_IN_PARCEL' AS test,
    p.parcel_id,
    b.building_id,
    ST_CoveredBy(
        b.footprint,
        p.geometry
    ) AS valid
FROM buildings b
JOIN parcels p
    ON p.id = b.parcel_id;


-- ------------------------------------------------------------
-- TEST 4: Floors must be covered by their building
-- ------------------------------------------------------------

SELECT
    'FLOOR_IN_BUILDING' AS test,
    b.building_id,
    f.floor_id,
    ST_CoveredBy(
        f.footprint,
        b.footprint
    ) AS valid
FROM floors f
JOIN buildings b
    ON b.id = f.building_id
ORDER BY f.floor_number;


-- ------------------------------------------------------------
-- TEST 5: Units must be covered by their floor
-- ------------------------------------------------------------

SELECT
    'UNIT_IN_FLOOR' AS test,
    f.floor_id,
    u.unit_id,
    ST_CoveredBy(
        u.footprint,
        f.footprint
    ) AS valid
FROM units u
JOIN floors f
    ON f.id = u.floor_id
ORDER BY f.floor_number, u.unit_number;


-- ------------------------------------------------------------
-- TEST 6: Unit vertical range must equal floor vertical range
-- ------------------------------------------------------------

SELECT
    'UNIT_VERTICAL_RANGE' AS test,
    u.unit_id,

    (
        u.z_min_m = f.z_min_m
        AND
        u.z_max_m = f.z_max_m
    ) AS valid

FROM units u
JOIN floors f
    ON f.id = u.floor_id

ORDER BY u.unit_id;


-- ------------------------------------------------------------
-- TEST 7: Full property hierarchy
-- ------------------------------------------------------------

SELECT
    'PROPERTY_HIERARCHY' AS test,

    p.parcel_id,
    b.building_id,
    f.floor_number,
    u.unit_number,

    u.z_min_m,
    u.z_max_m

FROM parcels p

JOIN buildings b
    ON b.parcel_id = p.id

JOIN floors f
    ON f.building_id = b.id

JOIN units u
    ON u.floor_id = f.id

ORDER BY
    p.parcel_id,
    b.building_id,
    f.floor_number,
    u.unit_number;