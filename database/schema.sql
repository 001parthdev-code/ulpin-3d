CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- PARCEL
-- ============================================================

CREATE TABLE parcels (
    id BIGSERIAL PRIMARY KEY,

    parcel_id VARCHAR(64) UNIQUE NOT NULL,

    -- Never assume this is available.
    official_ulpin VARCHAR(32),

    name TEXT,

    geometry geometry(Polygon, 4326) NOT NULL,

    source_type VARCHAR(32) NOT NULL
    CHECK (
        source_type IN (
            'authoritative',
            'real',
            'derived',
            'synthetic'
        )
    ),
    source_name TEXT,
    derivation_method TEXT,

    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX parcels_geometry_gix
ON parcels
USING GIST (geometry);


-- ============================================================
-- BUILDING
-- ============================================================

CREATE TABLE buildings (
    id BIGSERIAL PRIMARY KEY,

    building_id VARCHAR(64) UNIQUE NOT NULL,

    parcel_id BIGINT NOT NULL
        REFERENCES parcels(id)
        ON DELETE CASCADE,

    name TEXT,

    footprint geometry(Polygon, 4326) NOT NULL,

    height_m DOUBLE PRECISION,
    floor_count INTEGER,

    source_type VARCHAR(32) NOT NULL
    CHECK (
        source_type IN (
            'authoritative',
            'real',
            'derived',
            'synthetic'
        )
    ),
    source_name TEXT,
    derivation_method TEXT,

    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (height_m IS NULL OR height_m > 0),
    CHECK (floor_count IS NULL OR floor_count > 0)
);

CREATE INDEX buildings_footprint_gix
ON buildings
USING GIST (footprint);

CREATE INDEX buildings_parcel_idx
ON buildings(parcel_id);


-- ============================================================
-- FLOOR
-- ============================================================

CREATE TABLE floors (
    id BIGSERIAL PRIMARY KEY,

    floor_id VARCHAR(64) UNIQUE NOT NULL,

    building_id BIGINT NOT NULL
        REFERENCES buildings(id)
        ON DELETE CASCADE,

    floor_number INTEGER NOT NULL,

    footprint geometry(Polygon, 4326) NOT NULL,

    z_min_m DOUBLE PRECISION NOT NULL,
    z_max_m DOUBLE PRECISION NOT NULL,

    source_type VARCHAR(32) NOT NULL
    CHECK (
        source_type IN (
            'authoritative',
            'real',
            'derived',
            'synthetic'
        )
    ),
    derivation_method TEXT,

    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (z_max_m > z_min_m),

    UNIQUE (building_id, floor_number)
);

CREATE INDEX floors_footprint_gix
ON floors
USING GIST (footprint);

CREATE INDEX floors_building_idx
ON floors(building_id);


-- ============================================================
-- UNIT
-- ============================================================

CREATE TABLE units (
    id BIGSERIAL PRIMARY KEY,

    unit_id VARCHAR(64) UNIQUE NOT NULL,

    floor_id BIGINT NOT NULL
        REFERENCES floors(id)
        ON DELETE CASCADE,

    unit_number VARCHAR(32) NOT NULL,

    footprint geometry(Polygon, 4326) NOT NULL,

    z_min_m DOUBLE PRECISION NOT NULL,
    z_max_m DOUBLE PRECISION NOT NULL,

    entrance geometry(Point, 4326),

    source_type VARCHAR(32) NOT NULL
    CHECK (
        source_type IN (
            'authoritative',
            'real',
            'derived',
            'synthetic'
        )
    ),
    derivation_method TEXT,

    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (z_max_m > z_min_m),

    UNIQUE (floor_id, unit_number)
);

CREATE INDEX units_footprint_gix
ON units
USING GIST (footprint);

CREATE INDEX units_floor_idx
ON units(floor_id);

CREATE INDEX units_entrance_gix
ON units
USING GIST (entrance);