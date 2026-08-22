-- ============================================================
-- DEVELOPMENT SEED
-- Synthetic vertical-property model
--
-- P001
-- └── B001
--     ├── Floor 1 → Units 101, 102
--     ├── Floor 2 → Units 201, 202
--     └── Floor 3 → Units 301, 302
--
-- IMPORTANT:
-- All records in this file are synthetic demonstration data.
-- They are NOT authoritative cadastral records or official ULPINs.
-- ============================================================

BEGIN;

-- Clean only our development seed records.
DELETE FROM parcels
WHERE parcel_id = 'P001';


-- ============================================================
-- 1. PARCEL
-- ============================================================

INSERT INTO parcels (
    parcel_id,
    official_ulpin,
    name,
    geometry,
    source_type,
    source_name,
    derivation_method,
    verification_status
)
VALUES (
    'P001',
    NULL,
    'Prototype Parcel 001',

    ST_GeomFromText(
        'POLYGON((
            78.03190 30.31630,
            78.03250 30.31630,
            78.03250 30.31680,
            78.03190 30.31680,
            78.03190 30.31630
        ))',
        4326
    ),

    'synthetic',
    'ULPIN 3D Prototype',
    'Manually constructed development geometry',
    'unverified'
);


-- ============================================================
-- 2. BUILDING
-- ============================================================

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
    verification_status
)
SELECT
    'B001',
    p.id,
    'Prototype Building 001',

    ST_GeomFromText(
        'POLYGON((
            78.03200 30.31640,
            78.03240 30.31640,
            78.03240 30.31670,
            78.03200 30.31670,
            78.03200 30.31640
        ))',
        4326
    ),

    9.0,
    3,

    'synthetic',
    'ULPIN 3D Prototype',
    'Synthetic building placed inside P001',
    'unverified'

FROM parcels p
WHERE p.parcel_id = 'P001';


-- ============================================================
-- 3. FLOORS
-- ============================================================

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
    'F001',
    b.id,
    1,
    b.footprint,
    0.0,
    3.0,
    'synthetic',
    'Building footprint extruded from 0m to 3m',
    'unverified'
FROM buildings b
WHERE b.building_id = 'B001';


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
    'F002',
    b.id,
    2,
    b.footprint,
    3.0,
    6.0,
    'synthetic',
    'Building footprint extruded from 3m to 6m',
    'unverified'
FROM buildings b
WHERE b.building_id = 'B001';


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
    'F003',
    b.id,
    3,
    b.footprint,
    6.0,
    9.0,
    'synthetic',
    'Building footprint extruded from 6m to 9m',
    'unverified'
FROM buildings b
WHERE b.building_id = 'B001';


-- ============================================================
-- 4. UNITS
--
-- Each floor is divided vertically into west/east halves.
-- ============================================================

-- FLOOR 1 -----------------------------------------------------

INSERT INTO units (
    unit_id,
    floor_id,
    unit_number,
    footprint,
    z_min_m,
    z_max_m,
    entrance,
    source_type,
    derivation_method,
    verification_status
)
SELECT
    'U101',
    f.id,
    '101',

    ST_GeomFromText(
        'POLYGON((
            78.03200 30.31640,
            78.03220 30.31640,
            78.03220 30.31670,
            78.03200 30.31670,
            78.03200 30.31640
        ))',
        4326
    ),

    0.0,
    3.0,

    ST_SetSRID(
        ST_MakePoint(78.03220, 30.31655),
        4326
    ),

    'synthetic',
    'Synthetic west-half floor partition',
    'unverified'

FROM floors f
WHERE f.floor_id = 'F001';


INSERT INTO units (
    unit_id,
    floor_id,
    unit_number,
    footprint,
    z_min_m,
    z_max_m,
    entrance,
    source_type,
    derivation_method,
    verification_status
)
SELECT
    'U102',
    f.id,
    '102',

    ST_GeomFromText(
        'POLYGON((
            78.03220 30.31640,
            78.03240 30.31640,
            78.03240 30.31670,
            78.03220 30.31670,
            78.03220 30.31640
        ))',
        4326
    ),

    0.0,
    3.0,

    ST_SetSRID(
        ST_MakePoint(78.03220, 30.31655),
        4326
    ),

    'synthetic',
    'Synthetic east-half floor partition',
    'unverified'

FROM floors f
WHERE f.floor_id = 'F001';


-- FLOOR 2 -----------------------------------------------------

INSERT INTO units (
    unit_id,
    floor_id,
    unit_number,
    footprint,
    z_min_m,
    z_max_m,
    entrance,
    source_type,
    derivation_method,
    verification_status
)
SELECT
    'U201',
    f.id,
    '201',
    ST_GeomFromText(
        'POLYGON((
            78.03200 30.31640,
            78.03220 30.31640,
            78.03220 30.31670,
            78.03200 30.31670,
            78.03200 30.31640
        ))',
        4326
    ),
    3.0,
    6.0,
    ST_SetSRID(ST_MakePoint(78.03220, 30.31655), 4326),
    'synthetic',
    'Synthetic west-half floor partition',
    'unverified'
FROM floors f
WHERE f.floor_id = 'F002';


INSERT INTO units (
    unit_id,
    floor_id,
    unit_number,
    footprint,
    z_min_m,
    z_max_m,
    entrance,
    source_type,
    derivation_method,
    verification_status
)
SELECT
    'U202',
    f.id,
    '202',
    ST_GeomFromText(
        'POLYGON((
            78.03220 30.31640,
            78.03240 30.31640,
            78.03240 30.31670,
            78.03220 30.31670,
            78.03220 30.31640
        ))',
        4326
    ),
    3.0,
    6.0,
    ST_SetSRID(ST_MakePoint(78.03220, 30.31655), 4326),
    'synthetic',
    'Synthetic east-half floor partition',
    'unverified'
FROM floors f
WHERE f.floor_id = 'F002';


-- FLOOR 3 -----------------------------------------------------

INSERT INTO units (
    unit_id,
    floor_id,
    unit_number,
    footprint,
    z_min_m,
    z_max_m,
    entrance,
    source_type,
    derivation_method,
    verification_status
)
SELECT
    'U301',
    f.id,
    '301',
    ST_GeomFromText(
        'POLYGON((
            78.03200 30.31640,
            78.03220 30.31640,
            78.03220 30.31670,
            78.03200 30.31670,
            78.03200 30.31640
        ))',
        4326
    ),
    6.0,
    9.0,
    ST_SetSRID(ST_MakePoint(78.03220, 30.31655), 4326),
    'synthetic',
    'Synthetic west-half floor partition',
    'unverified'
FROM floors f
WHERE f.floor_id = 'F003';


INSERT INTO units (
    unit_id,
    floor_id,
    unit_number,
    footprint,
    z_min_m,
    z_max_m,
    entrance,
    source_type,
    derivation_method,
    verification_status
)
SELECT
    'U302',
    f.id,
    '302',
    ST_GeomFromText(
        'POLYGON((
            78.03220 30.31640,
            78.03240 30.31640,
            78.03240 30.31670,
            78.03220 30.31670,
            78.03220 30.31640
        ))',
        4326
    ),
    6.0,
    9.0,
    ST_SetSRID(ST_MakePoint(78.03220, 30.31655), 4326),
    'synthetic',
    'Synthetic east-half floor partition',
    'unverified'
FROM floors f
WHERE f.floor_id = 'F003';


COMMIT;