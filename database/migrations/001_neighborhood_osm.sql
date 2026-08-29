BEGIN;

-- ============================================================
-- EXISTING BUILDINGS
--
-- OSM buildings may exist without an authoritative parcel.
-- ============================================================

ALTER TABLE buildings
ALTER COLUMN parcel_id DROP NOT NULL;

ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS osm_type VARCHAR(16);

ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS osm_id BIGINT;

ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS osm_tags JSONB;

ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS building_type TEXT;

ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS levels INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS buildings_osm_identity_idx
ON buildings(osm_type, osm_id)
WHERE osm_id IS NOT NULL;


-- ============================================================
-- ROADS
-- ============================================================

CREATE TABLE IF NOT EXISTS roads (
    id BIGSERIAL PRIMARY KEY,

    road_id VARCHAR(64) UNIQUE NOT NULL,

    osm_type VARCHAR(16),
    osm_id BIGINT,

    name TEXT,
    highway_type TEXT,

    geometry geometry(Geometry, 4326) NOT NULL,

    osm_tags JSONB,

    source_type VARCHAR(32) NOT NULL DEFAULT 'real'
        CHECK (
            source_type IN (
                'authoritative',
                'real',
                'derived',
                'synthetic'
            )
        ),

    source_name TEXT NOT NULL DEFAULT 'OpenStreetMap',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS roads_geometry_gix
ON roads USING GIST (geometry);

CREATE UNIQUE INDEX IF NOT EXISTS roads_osm_identity_idx
ON roads(osm_type, osm_id)
WHERE osm_id IS NOT NULL;


-- ============================================================
-- PARKS / GREEN SPACES
-- ============================================================

CREATE TABLE IF NOT EXISTS parks (
    id BIGSERIAL PRIMARY KEY,

    park_id VARCHAR(64) UNIQUE NOT NULL,

    osm_type VARCHAR(16),
    osm_id BIGINT,

    name TEXT,
    feature_type TEXT,

    geometry geometry(Geometry, 4326) NOT NULL,

    osm_tags JSONB,

    source_type VARCHAR(32) NOT NULL DEFAULT 'real'
        CHECK (
            source_type IN (
                'authoritative',
                'real',
                'derived',
                'synthetic'
            )
        ),

    source_name TEXT NOT NULL DEFAULT 'OpenStreetMap',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS parks_geometry_gix
ON parks USING GIST (geometry);

CREATE UNIQUE INDEX IF NOT EXISTS parks_osm_identity_idx
ON parks(osm_type, osm_id)
WHERE osm_id IS NOT NULL;


-- ============================================================
-- WATER
-- ============================================================

CREATE TABLE IF NOT EXISTS water_features (
    id BIGSERIAL PRIMARY KEY,

    water_id VARCHAR(64) UNIQUE NOT NULL,

    osm_type VARCHAR(16),
    osm_id BIGINT,

    name TEXT,
    feature_type TEXT,

    geometry geometry(Geometry, 4326) NOT NULL,

    osm_tags JSONB,

    source_type VARCHAR(32) NOT NULL DEFAULT 'real'
        CHECK (
            source_type IN (
                'authoritative',
                'real',
                'derived',
                'synthetic'
            )
        ),

    source_name TEXT NOT NULL DEFAULT 'OpenStreetMap',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS water_features_geometry_gix
ON water_features USING GIST (geometry);

CREATE UNIQUE INDEX IF NOT EXISTS water_features_osm_identity_idx
ON water_features(osm_type, osm_id)
WHERE osm_id IS NOT NULL;

COMMIT;