# 3D ULPIN & Vertical Property Mapping System

A neighborhood-scale prototype for representing land parcels, buildings, floors, and property units within a unified 2D/3D geospatial information system.

> **Architecture for a city. Data for a neighborhood.**

## Project Status

**Phase:** Architecture & Foundation
**Target Demo:** September 1–2, 2026

Current infrastructure:

* Dockerized PostgreSQL 17
* PostGIS 3.5
* GEOS enabled
* PROJ enabled
* Local spatial database operational

Application development has not yet started.

---

## Problem

Traditional cadastral systems primarily represent land parcels in two dimensions.

Modern urban property, however, is inherently three-dimensional.

Multiple independently meaningful property spaces may occupy the same horizontal geographic area:

```text
Parcel
└── Building
    ├── Floor 1
    │   ├── Unit 101
    │   └── Unit 102
    ├── Floor 2
    │   ├── Unit 201
    │   └── Unit 202
    └── Floor 3
        ├── Unit 301
        └── Unit 302
```

The prototype explores how parcel-level spatial identity can be connected to vertically organized buildings, floors, and property units.

---

## Core Objective

Build a technically credible neighborhood-scale prototype demonstrating:

```text
ROAD
PARK
PARCEL
BUILDING
FLOOR
UNIT
```

inside a unified spatial model with interactive 2D and 3D visualization.

The primary property hierarchy is:

```text
PARCEL
   ↓
BUILDING
   ↓
FLOOR
   ↓
UNIT
```

Each entity should preserve:

* identity
* geometry
* semantics
* relationships
* provenance
* verification status
* temporal information where applicable

The frontend will visualize this model.

The backend and spatial database remain the source of truth.

---

## ULPIN Position

ULPIN/Bhu-Aadhaar is an official land-parcel identification system administered through Government land-record systems.

This prototype will **not claim to issue official ULPIN identifiers**.

We distinguish between:

1. Official ULPIN
2. Prototype parcel identity
3. Prototype vertical property identity
4. Emerging 3D ULPIN/PNIU concepts

Synthetic or derived identifiers and geometries will always be explicitly labelled.

---

## Prototype Strategy

The prototype uses a hybrid dataset.

### Real-world data

Where available:

* roads
* intersections
* parks
* water features
* public spaces
* building footprints
* neighborhood context

### Derived data

Potential examples:

* estimated building heights
* inferred parcel-building relationships
* floor elevations

### Synthetic/demo data

Where authoritative data is unavailable:

* floor configurations
* property-unit geometries
* unit metadata
* selected parcel geometries if necessary

Synthetic data must never be presented as authoritative cadastral data.

---

## Initial Architecture

```text
                         WEB APPLICATION
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
            MapLibre 2D                 CesiumJS 3D
                 │                           │
                 └────── Shared State ───────┘
                               │
                         React + TypeScript
                               │
                              API
                               │
                            FastAPI
                               │
                           PostgreSQL
                             PostGIS
```

The backend will initially be implemented as a modular monolith.

No microservices are planned for the prototype.

---

## Proposed Technology Stack

### Frontend

* React
* TypeScript
* Vite
* MapLibre GL JS
* CesiumJS

### Backend

* Python
* FastAPI

### Spatial Processing

* PostgreSQL
* PostGIS
* GeoPandas
* Shapely
* PyProj
* GDAL where necessary

### Infrastructure

* Docker
* Docker Compose
* Git
* GitHub

---

## Repository Structure

```text
ulpin-3d/
├── backend/
├── frontend/
├── database/
├── pipelines/
├── data/
│   ├── raw/
│   ├── intermediate/
│   └── processed/
├── docs/
├── tests/
├── docker-compose.yml
├── .gitignore
└── README.md
```

### `backend/`

FastAPI application and domain logic.

### `frontend/`

React application containing the 2D and 3D user experience.

### `database/`

PostGIS schema, migrations, seed data, and database-related scripts.

### `pipelines/`

Reproducible GIS ingestion and transformation pipelines.

### `data/raw/`

Original source datasets.

Source data should remain immutable.

### `data/intermediate/`

Temporary normalized/transformed datasets.

### `data/processed/`

Application-ready derived datasets.

Large geospatial datasets are intentionally excluded from Git.

### `docs/`

Architecture decisions, research, diagrams, dataset documentation, and technical notes.

### `tests/`

Spatial validation and integration tests.

---

## Local Database

The development database runs through Docker Compose using:

* PostgreSQL 17
* PostGIS 3.5

Start it with:

```bash
docker compose up -d
```

Check status:

```bash
docker compose ps
```

Connect:

```bash
docker exec -it ulpin-postgis psql -U ulpin -d ulpin
```

Verify PostGIS:

```sql
SELECT PostGIS_Version();
```

Current verified environment:

```text
PostGIS 3.5
USE_GEOS=1
USE_PROJ=1
USE_STATS=1
```

---

## Spatial Engineering Principles

1. Data-first architecture.
2. Backend/database as the source of truth.
3. Spatial correctness before visualization.
4. Preserve semantic entities instead of reducing the city to meshes.
5. Never perform metric calculations directly on latitude/longitude.
6. Maintain provenance for real, derived, and synthetic data.
7. Never fabricate authoritative identifiers or cadastral information.
8. Prefer reproducible transformations.
9. Validate geometry at ingestion boundaries.
10. Avoid premature city-scale infrastructure.

---

## First Engineering Milestone

Before building the frontend, prove the complete property hierarchy using PostGIS:

```text
1 Parcel
   ↓
1 Building
   ↓
3 Floors
   ↓
6 Units
```

The database must demonstrate:

* valid geometries
* correct foreign-key relationships
* parcel → building relationship
* building → floor relationship
* floor → unit relationship
* valid vertical ranges
* provenance
* spatial queries
* deterministic synthetic data generation

Only after this vertical slice passes validation will neighborhood-scale ingestion begin.

---

## Development Roadmap

### Phase 1 — Foundation

* [x] Create repository structure
* [x] Docker environment
* [x] PostgreSQL
* [x] PostGIS
* [x] Verify GEOS/PROJ
* [ ] Initialize Git repository
* [ ] Create PostGIS domain schema

### Phase 2 — Vertical Property Model

* [ ] Parcel schema
* [ ] Building schema
* [ ] Floor schema
* [ ] Unit schema
* [ ] Synthetic test property
* [ ] Spatial relationship validation
* [ ] Automated spatial tests

### Phase 3 — Neighborhood Data

* [ ] Select area of interest
* [ ] Acquire real datasets
* [ ] Document licenses/provenance
* [ ] Normalize CRS
* [ ] Validate geometries
* [ ] Load neighborhood into PostGIS
* [ ] Associate buildings with parcels

### Phase 4 — API

* [ ] FastAPI foundation
* [ ] Parcel endpoints
* [ ] Building endpoints
* [ ] Floor endpoints
* [ ] Unit endpoints
* [ ] Spatial identify endpoint

### Phase 5 — Visualization

* [ ] MapLibre neighborhood viewer
* [ ] Parcel interaction
* [ ] Cesium 3D viewer
* [ ] Building navigation
* [ ] Floor selection
* [ ] Unit selection
* [ ] 2D/3D synchronized state

### Phase 6 — Validation & Demo

* [ ] Spatial validation
* [ ] Provenance UI
* [ ] Performance testing
* [ ] Demo workflow
* [ ] Architecture documentation
* [ ] Presentation
* [ ] Demo rehearsal

---

## Definition of Prototype Complete

The prototype is complete when a user can:

```text
Open application
      ↓
View neighborhood
      ↓
See roads / parks / parcels / buildings
      ↓
Select parcel
      ↓
Inspect parcel identity
      ↓
Select building
      ↓
Enter/focus 3D representation
      ↓
Navigate floors
      ↓
Select unit
      ↓
Inspect unit spatial identity and metadata
```

while the system clearly distinguishes real, derived, and synthetic information.

---

## Long-Term Direction

The neighborhood prototype is designed as the first instance of an architecture that could eventually evolve toward:

```text
Neighborhood
     ↓
City-scale spatial platform
     ↓
Vector / 3D tile infrastructure
     ↓
Large-scale spatial querying
     ↓
Temporal/versioned urban information
     ↓
Planning / governance / emergency / infrastructure systems
     ↓
Broader urban digital twin
```

City-scale infrastructure will not be prematurely implemented during the prototype phase.

---

## License

To be determined.

Third-party geospatial datasets retain their respective licenses and attribution requirements.
