# ULPIN 3D — Architecture

## System Objective

ULPIN 3D is a prototype spatial system for representing and resolving vertically stacked property space.

The central operation demonstrated by the system is:

```text
resolve(longitude, latitude, elevation)
                    ↓
            spatial identity
```

The current proof environment uses real OpenStreetMap urban context from Bandra Kurla Complex, Mumbai, and a derived 15-floor vertical model of Raheja Tower.

---

## Architecture

```text
                     USER
                       │
                       ▼
              React + TypeScript
                       │
                       ▼
                   MapLibre
                 ┌─────┴─────┐
                 │           │
                2D          3D
                 │           │
                 └─────┬─────┘
                       │
                 HTTP / GeoJSON
                       │
                       ▼
                    FastAPI
              ┌────────┼────────┐
              │        │        │
           Property Neighborhood Spatial
              API      API       API
              │        │        │
              └────────┼────────┘
                       │
                       ▼
                    PostGIS
              ┌────────┼────────┐
              │        │        │
           Geometry Vertical Provenance
                    ranges
                       │
             ┌─────────┴─────────┐
             │                   │
       OpenStreetMap          Derived
       real context       vertical entities
```

---

## Architectural Boundaries

### PostGIS

PostGIS is the spatial source of truth.

It owns:

- spatial geometry
- property identities
- vertical ranges
- entity relationships
- provenance
- verification state

The frontend does not own a duplicate authoritative spatial model.

### FastAPI

FastAPI exposes the spatial model through domain-oriented HTTP interfaces.

Current API domains include:

```text
parcels
buildings
floors
units
neighborhood
spatial resolution
```

### MapLibre

MapLibre is a visualization and interaction layer.

It renders:

```text
2D neighborhood geometry
3D building extrusions
derived floor volumes
selection state
```

Renderer state does not modify authoritative spatial geometry.

---

## Spatial Entity Model

A vertical property entity is represented conceptually as:

```text
SpatialEntity {
    identity
    entity_type
    parent_identity

    footprint

    z_min
    z_max

    source_type
    source_name
    derivation_method
    verification_status
}
```

The system therefore represents a volume as:

```text
2D footprint × vertical interval
```

rather than requiring every entity to be stored as an opaque 3D mesh.

---

## Vertical Semantics

Vertical intervals use half-open bounds:

```text
[z_min, z_max)
```

Equivalent to:

```text
z_min <= z < z_max
```

Example:

```text
F07 = [18, 21)
F08 = [21, 24)
F09 = [24, 27)
```

Therefore:

```text
20.999999 → F07
21.000000 → F08

23.999999 → F08
24.000000 → F09
```

This guarantees deterministic ownership of shared vertical boundaries.

These semantics are enforced through automated spatial tests.

---

## Spatial Resolution

The spatial engine accepts:

```text
longitude
latitude
elevation
```

Horizontal resolution is performed against PostGIS building geometry.

Vertical resolution is performed against explicit floor Z intervals.

Example:

```text
(72.86295, 19.06090, 22.5)
                │
                ▼
         Raheja Tower
     OSM-WAY-353159496
                │
                ▼
          RAHEJA-F08
            [21,24)
```

The spatial resolver does not depend on MapLibre.

---

## Provenance Model

The system distinguishes four provenance classes:

```text
authoritative
real
derived
synthetic
```

### authoritative

Reserved for appropriate official/cadastral sources.

### real

Real-world information from a non-authoritative source.

Example:

```text
Raheja Tower
source = OpenStreetMap
```

### derived

Information computationally generated from source data.

Example:

```text
RAHEJA-F08

derived from:
OSM footprint
+
45 m mapped height
+
15 mapped levels
```

### synthetic

Information deliberately constructed for deterministic development or demonstration.

The system must not silently promote derived or synthetic information into authoritative information.

---

## Data Flow

```text
OpenStreetMap
      │
      ▼
OSM ingestion pipeline
      │
      ▼
PostGIS
      │
      ▼
FastAPI
      │
      ├───────────────┐
      ▼               ▼
   GeoJSON        Spatial queries
      │               │
      ▼               ▼
  MapLibre         API clients
```

---

## Testing Architecture

Local and CI testing use deterministic inputs.

CI deliberately does not depend on the live Overpass API.

```text
Fresh PostGIS
      │
      ▼
schema.sql
      │
      ▼
synthetic seed
      │
      ▼
neighborhood migration
      │
      ▼
deterministic Raheja fixture
      │
      ▼
vertical-model migration
      │
      ▼
pytest
```

This separates:

```text
production ingestion
        from
deterministic verification
```

---

## Current Scope Boundary

Implemented:

```text
real neighborhood context
real building geometry
vertical floor representation
building search
2D/3D visualization
spatial provenance
resolve(X,Y,Z)
automated correctness tests
```

Intentionally outside the current prototype:

```text
official cadastral integration
official ULPIN issuance
ownership records
real unit boundaries
general 3D topology
adjacency graphs
production authorization
city-scale tiling
```

---

## Core Invariant

The visualization is not the spatial model.

```text
Spatial model
    ↓
exists independently
    ↓
API / queries / tests / renderers
```

Changing the renderer must not redefine property identity or spatial truth.