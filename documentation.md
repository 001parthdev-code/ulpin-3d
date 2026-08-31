# 3D ULPIN & Vertical Property Mapping System — Development Walkthrough

**Project:** 3D ULPIN Generation and Vertical Property Mapping System
**Prototype Scope:** Neighborhood Scale
**Development Start:** August 22, 2026
**Target Demonstration:** September 1–2, 2026
**Current Phase:** Foundation & Spatial Data Model

---

# 1. Project Objective

The project aims to build a neighborhood-scale prototype of a spatial information system capable of representing both traditional 2D urban geography and vertically organized property information.

The core property hierarchy is:

```text
PARCEL
   ↓
BUILDING
   ↓
FLOOR
   ↓
UNIT
```

The surrounding neighborhood will eventually contain:

```text
NEIGHBORHOOD
│
├── ROADS
├── PARKS
├── WATER / PUBLIC FEATURES
│
└── PARCELS
      │
      └── BUILDINGS
            │
            └── FLOORS
                  │
                  └── UNITS
```

The system is not intended to be merely a 3D visualization.

Each spatial entity should retain:

* identity
* geometry
* semantic meaning
* relationships
* provenance
* verification status
* vertical information where applicable

The frontend will eventually visualize this information in 2D and 3D, while the backend and spatial database remain the source of truth.

Our development principle is:

> **Architecture for a city. Data for a neighborhood.**

---

# 2. Scope Decision

We deliberately decided **not** to attempt an entire city during the prototype period.

Instead, the system architecture will be designed so that city-scale techniques can be introduced later, while the actual demonstration uses a manageable neighborhood dataset.

The prototype will eventually demonstrate:

```text
ROAD
PARK
PARCEL
BUILDING
FLOOR
UNIT
```

The most important vertical relationship is:

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

---

# 3. ULPIN Position

A major architectural rule established during research is that the prototype must distinguish between official government identifiers and identifiers generated for demonstration purposes.

We therefore distinguish:

```text
Official ULPIN
      │
      ├── Government-issued parcel identity
      │
      ▼
Prototype Parcel Identity
      │
      ├── Internal demonstration identity
      │
      ▼
Prototype Vertical Property Identity
      │
      └── Building / Floor / Unit identity
```

The prototype will **not claim to generate official government ULPINs**.

For this reason, the parcel database contains a nullable:

```text
official_ulpin
```

field.

If authoritative ULPIN information is unavailable, this field remains `NULL`.

Synthetic identifiers such as:

```text
P001
B001
F001
U101
```

are explicitly prototype identifiers.

---

# 4. Synthetic Data Strategy

Reliable public floor-level and unit-level cadastral information may not be available for the selected neighborhood.

We therefore decided to use a hybrid data strategy.

## Real Data

Where available:

* roads
* parks
* water features
* public spaces
* building footprints
* neighborhood context

## Derived Data

Potentially:

* building heights
* parcel-building relationships
* floor elevations
* other computationally inferred attributes

## Synthetic Data

Where authoritative information is unavailable:

* floor layouts
* property units
* vertical configuration
* unit metadata
* selected demonstration parcel information if required

The important rule is:

> **Synthetic data must always be explicitly identified as synthetic.**

The prototype should never present demonstration geometry or identifiers as authoritative cadastral information.

---

# 5. Development Environment

The project is being developed using VS Code.

The current development environment consists of:

```text
VS Code
   │
   ├── Git / GitHub
   │
   ├── Python virtual environment
   │
   └── Docker
         │
         └── PostgreSQL + PostGIS
```

Future components will include:

```text
React + TypeScript
        │
        ├── MapLibre
        └── CesiumJS

FastAPI
   │
PostGIS
```

---

# 6. Repository Structure

The project repository was initialized with approximately the following structure:

```text
ulpin-3d/
│
├── backend/
├── frontend/
├── database/
├── pipelines/
│
├── data/
│   ├── raw/
│   ├── intermediate/
│   └── processed/
│
├── docs/
├── tests/
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── documentation.md
```

The responsibilities of these directories are:

## `backend/`

Future FastAPI application and backend domain logic.

## `frontend/`

Future React, MapLibre, and Cesium application.

## `database/`

Database schema, development seed data, validation queries, and eventually migrations.

## `pipelines/`

Reproducible GIS ingestion and transformation processes.

## `data/raw/`

Original source datasets.

Raw datasets should not be destructively modified.

## `data/intermediate/`

Normalized or partially transformed datasets.

## `data/processed/`

Application-ready spatial datasets.

## `docs/`

Architecture decisions, research notes, diagrams, dataset documentation, and other project documentation.

## `tests/`

Automated spatial, backend, and integration tests.

---

# 7. GitHub Repository

The project was initialized as a Git repository and pushed to GitHub using VS Code's Source Control interface.

The repository is currently being treated as a development repository.

A `.gitignore` was added to prevent unnecessary or sensitive files from entering source control.

Important exclusions include:

```text
.venv/
node_modules/
.env
data/raw/*
data/intermediate/*
data/processed/*
```

This is particularly important because large GIS datasets should not be committed directly into the repository.

The repository should contain the **code and reproducible pipeline**, rather than becoming storage for every source dataset.

---

# 8. Dockerized PostGIS

Rather than installing PostgreSQL and PostGIS directly into Windows, the spatial database is running through Docker.

The database container is:

```text
ulpin-postgis
```

using:

```text
PostgreSQL 17
PostGIS 3.5
```

The container exposes PostgreSQL through:

```text
localhost:5432
```

The database is:

```text
ulpin
```

---

# 9. Database Verification

After starting the Docker container, its status was verified using:

```powershell
docker compose ps
```

The container reported:

```text
STATUS: healthy
```

We then connected directly to PostgreSQL using:

```powershell
docker exec -it ulpin-postgis psql -U ulpin -d ulpin
```

Inside PostgreSQL, PostGIS was verified using:

```sql
SELECT PostGIS_Version();
```

The environment returned:

```text
3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
```

This established that:

```text
Docker       ✓
PostgreSQL   ✓
PostGIS      ✓
GEOS         ✓
PROJ         ✓
```

The spatial database foundation is therefore operational.

---

# 10. Shell vs PostgreSQL

An early development mistake also established an important workflow distinction.

Commands such as:

```powershell
docker compose ps
```

must run from PowerShell.

SQL commands such as:

```sql
SELECT PostGIS_Version();
```

must run inside PostgreSQL.

The prompt provides a useful indication:

```text
PS D:\ulpin-3d>
```

means we are in PowerShell.

While:

```text
ulpin=#
```

means we are inside PostgreSQL's `psql` shell.

---

# 11. First Spatial Database Schema

The first actual system component being built is the vertical property domain model.

The initial schema contains:

```text
PARCEL
  │
  │ 1:N
  ▼
BUILDING
  │
  │ 1:N
  ▼
FLOOR
  │
  │ 1:N
  ▼
UNIT
```

This is implemented through four PostgreSQL tables:

```text
parcels
buildings
floors
units
```

The neighborhood-level entities such as roads and parks have intentionally not been added yet.

The strategy is to first prove that the difficult vertical property hierarchy works correctly.

---

# 12. Parcel Model

A parcel contains:

```text
Internal database ID
Prototype parcel ID
Optional official ULPIN
Name
2D geometry
Source type
Source name
Derivation method
Verification status
Created timestamp
Updated timestamp
```

The spatial geometry uses:

```sql
geometry(Polygon, 4326)
```

The parcel therefore remains a semantic cadastral/spatial entity rather than simply becoming a rendered polygon.

---

# 13. Building Model

Every building belongs to a parcel through a foreign-key relationship.

Conceptually:

```text
PARCEL
   │
   └── BUILDING
```

A building contains:

```text
building_id
parcel_id
name
footprint
height_m
floor_count
source information
verification status
timestamps
```

The building footprint is stored as:

```sql
geometry(Polygon, 4326)
```

Its height remains a separate metric property.

This is deliberate.

We are not storing the building merely as an opaque 3D mesh.

---

# 14. Floor Model

Every floor belongs to a building.

```text
BUILDING
   │
   ├── FLOOR 1
   ├── FLOOR 2
   └── FLOOR 3
```

A floor contains:

```text
floor_id
building_id
floor_number
footprint
z_min_m
z_max_m
source information
verification status
```

The vertical extent is represented using:

```text
z_min_m
z_max_m
```

For example:

```text
Floor 1 → 0–3 m
Floor 2 → 3–6 m
Floor 3 → 6–9 m
```

At this stage, these are relative building elevations rather than absolute elevations above sea level.

---

# 15. Unit Model

Every property unit belongs to a floor.

```text
FLOOR
 │
 ├── UNIT 101
 └── UNIT 102
```

A unit contains:

```text
unit_id
floor_id
unit_number
footprint
z_min_m
z_max_m
entrance
source information
verification status
```

The unit entrance is represented as:

```sql
geometry(Point, 4326)
```

This gives us a foundation for future entrance-based property identity experiments.

---

# 16. 3D Representation Strategy

An important architectural decision was made not to store every property entity as a 3D mesh.

Instead, the database preserves meaningful spatial parameters.

For example:

```text
UNIT
│
├── 2D footprint
├── z_min
└── z_max
```

The conceptual unit volume is therefore:

```text
2D footprint
      ×
vertical interval
      ↓
3D property volume
```

Mathematically:

```text
V = footprint × [z_min, z_max]
```

The visualization layer can derive a rendered 3D representation from this information.

This preserves the semantic spatial model independently from the renderer.

---

# 17. Spatial Indexing

GiST spatial indexes were created for the major geometries.

Examples include:

```text
parcels_geometry_gix
buildings_footprint_gix
floors_footprint_gix
units_footprint_gix
units_entrance_gix
```

These indexes prepare the system for PostGIS operations such as:

```text
ST_Intersects
ST_Contains
ST_CoveredBy
ST_Within
```

and future spatial queries at larger scales.

Traditional indexes were also created for relationships such as:

```text
building → parcel
floor → building
unit → floor
```

---

# 18. Database Integrity Constraints

Several database-level constraints were introduced.

Building heights must be positive when present:

```sql
CHECK (height_m IS NULL OR height_m > 0)
```

Floor counts must also be positive:

```sql
CHECK (floor_count IS NULL OR floor_count > 0)
```

Vertical ranges must be valid:

```sql
CHECK (z_max_m > z_min_m)
```

Floors must be unique within their building:

```text
UNIQUE (building_id, floor_number)
```

Units must be unique within their floor:

```text
UNIQUE (floor_id, unit_number)
```

These rules prevent several classes of invalid property data from entering the system.

---

# 19. Provenance Model

A major improvement was made to `source_type`.

Originally the database allowed:

```sql
source_type VARCHAR(32) NOT NULL
```

This meant arbitrary values could theoretically enter the database.

We changed this to a controlled vocabulary:

```text
authoritative
real
derived
synthetic
```

The intended meanings are:

### `authoritative`

Information obtained from an official/authoritative cadastral or government source.

### `real`

Real-world information from a non-authoritative source such as an open geospatial dataset.

### `derived`

Information computationally inferred or generated from other data.

### `synthetic`

Information deliberately created for prototype/demo purposes.

The database now rejects source classifications outside this vocabulary.

---

# 20. Provenance Constraint Test

The provenance constraint was explicitly tested.

A parcel was deliberately inserted using:

```text
source_type = banana
```

PostgreSQL returned:

```text
ERROR:
new row for relation "parcels"
violates check constraint "parcels_source_type_check"
```

This was the expected result.

The test demonstrated that provenance rules are being enforced by PostgreSQL rather than relying solely on future application code.

Therefore:

```text
Invalid provenance
        ↓
PostgreSQL constraint
        ↓
REJECTED ✓
```

This became our first verified database integrity rule.

---

# 21. Schema Recreation During Development

While modifying the schema, we encountered errors such as:

```text
relation "parcels" already exists
```

This occurred because `schema.sql` had already been executed once.

At this early stage, there was no valuable application data, so the development tables were dropped and recreated.

The dependency order used was:

```text
units
  ↓
floors
  ↓
buildings
  ↓
parcels
```

This reflects the foreign-key hierarchy.

The tables were then recreated from the updated schema.

This also exposed an architectural fact:

> `schema.sql` is currently a bootstrap schema, not a full migration system.

That is acceptable during the initial prototype stage.

Once valuable data begins accumulating, schema evolution should move toward migrations rather than destructive recreation.

---

# 22. First Synthetic Vertical Property

The next system milestone has been designed around a controlled synthetic property.

The target structure is:

```text
Parcel P001
└── Building B001
    ├── Floor 1
    │   ├── Unit 101
    │   └── Unit 102
    │
    ├── Floor 2
    │   ├── Unit 201
    │   └── Unit 202
    │
    └── Floor 3
        ├── Unit 301
        └── Unit 302
```

The building is designed as:

```text
Total height: 9 m

Floor 1: 0–3 m
Floor 2: 3–6 m
Floor 3: 6–9 m
```

Each floor contains two synthetic property units.

This gives us:

```text
1 parcel
1 building
3 floors
6 units
```

---

# 23. Synthetic Geometry Design

The parcel is represented by a geographic polygon.

Inside that polygon sits a smaller building footprint.

Conceptually:

```text
┌──────────────────────────────┐
│                              │
│           PARCEL             │
│                              │
│       ┌──────────────┐       │
│       │              │       │
│       │   BUILDING   │       │
│       │              │       │
│       └──────────────┘       │
│                              │
└──────────────────────────────┘
```

Each floor currently uses the building footprint.

The floor is then divided into two synthetic units:

```text
BUILDING / FLOOR

┌─────────────────────────────┐
│              │              │
│    UNIT A    │    UNIT B    │
│              │              │
└─────────────────────────────┘
```

The same horizontal unit layout is stacked vertically across the three floors.

---

# 24. Why the Synthetic Seed Is Deterministic

The seed dataset is deliberately deterministic rather than randomly generated.

This means:

```text
P001
```

always represents the same parcel geometry.

Likewise:

```text
B001
F001
F002
F003
U101
U102
U201
U202
U301
U302
```

always represent the same entities.

This makes:

* debugging easier
* testing reproducible
* screenshots consistent
* demonstrations reliable
* spatial validation deterministic

Random synthetic generation may be introduced later if we need larger demonstration datasets.

---

# 25. Planned Spatial Validation

Creating foreign-key relationships is not sufficient.

PostGIS must also prove that the geometry itself makes sense.

The first validation will verify:

```text
Building footprint
       ↓
is spatially covered by
       ↓
Parcel geometry
```

using:

```sql
ST_CoveredBy(...)
```

We deliberately prefer appropriate spatial predicates rather than assuming relational foreign keys imply spatial correctness.

A database record could theoretically claim:

```text
Building B001 belongs to Parcel P001
```

while its geometry is physically located outside the parcel.

Therefore both must eventually agree:

```text
RELATIONAL RELATIONSHIP
Building.parcel_id = Parcel.id

AND

SPATIAL RELATIONSHIP
Building geometry inside Parcel geometry
```

---

# 26. Geometry Validation

All important geometries will also be checked using:

```sql
ST_IsValid(...)
```

The expected result for every prototype geometry is:

```text
true
```

Validation will cover:

```text
Parcel geometry
Building footprint
Floor footprints
Unit footprints
```

Invalid geometry should not silently progress into the API or renderer.

---

# 27. Current System State

At the current checkpoint, the project has:

```text
GitHub repository                     ✓
Project directory structure           ✓
Docker environment                    ✓
PostgreSQL 17                         ✓
PostGIS 3.5                           ✓
GEOS                                  ✓
PROJ                                  ✓
Parcel database model                 ✓
Building database model               ✓
Floor database model                  ✓
Unit database model                   ✓
Foreign-key hierarchy                 ✓
Spatial indexes                       ✓
Vertical constraints                  ✓
Provenance classification             ✓
Provenance constraint test            ✓
Synthetic property design             ✓
```

The synthetic seed and its spatial validation are the next active implementation milestone.

---

# 28. Current Architecture

The implemented portion currently looks like:

```text
                     POSTGRESQL
                       POSTGIS
                          │
                          ▼
                    SPATIAL MODEL
                          │
            ┌─────────────┴─────────────┐
            │                           │
        IDENTITY                    GEOMETRY
            │                           │
            └─────────────┬─────────────┘
                          │
                     PROVENANCE
                          │
                          ▼
                       PARCEL
                          │
                          ▼
                      BUILDING
                          │
                          ▼
                        FLOOR
                          │
                          ▼
                         UNIT
```

The future architecture will expand this into:

```text
                         USER
                           │
                           ▼
                    WEB APPLICATION
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
        MAPLIBRE 2D                 CESIUMJS 3D
             │                           │
             └─────────────┬─────────────┘
                           ▼
                    REACT / TYPESCRIPT
                           │
                           ▼
                         API
                           │
                           ▼
                        FASTAPI
                           │
                           ▼
                       POSTGIS
                           │
                           ▼
                  SPATIAL DOMAIN MODEL
```

---

# 29. What We Have Intentionally Not Built Yet

We have deliberately avoided:

* React UI
* Cesium visualization
* MapLibre visualization
* FastAPI endpoints
* authentication
* microservices
* AI reconstruction
* city-scale tiling
* traffic simulation
* disaster simulation
* utility networks
* production deployment

This is intentional.

The current development strategy is:

```text
DATA MODEL
    ↓
SPATIAL VALIDATION
    ↓
API
    ↓
2D VISUALIZATION
    ↓
3D VISUALIZATION
    ↓
INTEGRATION
```

rather than starting with an attractive frontend backed by an undefined spatial model.

---

# 30. Immediate Next Milestone

The next milestone is to complete and validate:

```text
P001
 │
 └── B001
      │
      ├── F001
      │    ├── U101
      │    └── U102
      │
      ├── F002
      │    ├── U201
      │    └── U202
      │
      └── F003
           ├── U301
           └── U302
```

We need to prove:

1. All records insert successfully.
2. All geometries are valid.
3. B001 is spatially inside P001.
4. Every floor belongs to B001.
5. Every unit belongs to its intended floor.
6. Vertical ranges are valid.
7. The entire hierarchy can be retrieved through one SQL query.
8. Synthetic provenance remains explicit.

Once these conditions pass, we will have the first complete vertical property object in the system.

---

# 31. Engineering Principle Going Forward

Every major component should follow:

```text
WHY?
  ↓
PROBLEM?
  ↓
INPUT?
  ↓
OUTPUT?
  ↓
DATA OWNERSHIP?
  ↓
INTERFACE?
  ↓
FAILURE MODES?
  ↓
TEST?
  ↓
IMPLEMENTATION
```

The objective is not to maximize the amount of code written.

The objective is to create a spatial system whose behavior we can explain, reproduce, validate, and defend technically.

---

# 32. Current Checkpoint

We have moved from:

```text
PROJECT IDEA
```

to:

```text
PROJECT IDEA
      ↓
ARCHITECTURE
      ↓
DEVELOPMENT ENVIRONMENT
      ↓
SPATIAL DATABASE
      ↓
DOMAIN MODEL
      ↓
DATABASE INTEGRITY
```

The next transition is:

```text
DOMAIN MODEL
      ↓
REAL SPATIAL OBJECT
      ↓
SPATIAL VALIDATION
      ↓
API
```

That will mark the point where the prototype becomes a queryable vertical-property system rather than only an architectural design.

# 33. Backend API Phase

After validating the PostGIS property model, development moved to the backend API layer.

The purpose of this phase is to establish a clean interface between the spatial database and the future frontend.

The architecture has now progressed to:

```text
PostGIS
   ↓
psycopg
   ↓
FastAPI
   ↓
HTTP / JSON / GeoJSON
   ↓
Future Web Client
```

The API is deliberately being implemented before MapLibre or Cesium so that both visualization systems eventually consume the same authoritative backend model.

---

# 34. Backend Objective

The first backend milestone is intentionally small.

The API must allow clients to traverse the complete property hierarchy:

```text
PARCEL
   ↓
BUILDING
   ↓
FLOOR
   ↓
UNIT
```

The frontend should not need to know how the underlying PostgreSQL tables are joined.

Instead, the backend exposes domain-oriented resources.

For example:

```text
GET /parcels/P001

GET /parcels/P001/buildings

GET /buildings/B001

GET /buildings/B001/floors

GET /floors/F001

GET /floors/F001/units

GET /units/U101
```

This means the HTTP API mirrors the spatial domain model.

---

# 35. Initial FastAPI Setup

The backend currently uses:

```text
Python
   │
   ├── FastAPI
   ├── Uvicorn
   └── psycopg
```

The initial dependencies were defined in:

```text
backend/requirements.txt
```

with:

```text
fastapi
uvicorn[standard]
psycopg[binary]
```

These provide:

* HTTP API framework
* local ASGI development server
* PostgreSQL connectivity

No ORM has been introduced at this stage.

Direct SQL is being used deliberately because the current spatial queries are small, explicit, and PostGIS-specific.

---

# 36. Backend Directory Structure

The initial backend started with:

```text
backend/
├── app/
│   ├── __init__.py
│   ├── database.py
│   └── main.py
│
└── requirements.txt
```

The first API experiment implemented only:

```text
GET /health
GET /parcels
GET /parcels/P001
```

This was enough to prove the complete path:

```text
PostGIS
   ↓
Python database connection
   ↓
FastAPI
   ↓
JSON
   ↓
Browser
```

All three initial endpoints were successfully tested.

---

# 37. Database Connection Layer

Database connectivity is isolated inside:

```text
backend/app/database.py
```

The application connects using `psycopg`.

Conceptually:

```text
FastAPI Route
      ↓
get_connection()
      ↓
psycopg
      ↓
PostgreSQL
      ↓
PostGIS
```

The development database currently runs at:

```text
localhost:5432
```

with the Dockerized `ulpin` database.

The connection string can be overridden using:

```text
DATABASE_URL
```

This prepares the application for later deployment without requiring application code changes.

---

# 38. Health Endpoint

The first API endpoint implemented was:

```text
GET /health
```

Its purpose is to provide a minimal service-health signal.

The response is approximately:

```json
{
  "status": "ok",
  "service": "3D ULPIN Spatial API",
  "version": "0.1.0"
}
```

This endpoint will eventually help distinguish:

```text
Frontend problem

vs

Backend problem

vs

Database problem
```

during integration and deployment.

---

# 39. Parcel API

The first spatial resource exposed through HTTP was the parcel.

The API provides:

```text
GET /parcels
```

for retrieving parcels and:

```text
GET /parcels/{parcel_id}
```

for retrieving an individual parcel.

The parcel response includes information such as:

```text
parcel_id
official_ulpin
name
source_type
source_name
derivation_method
verification_status
geometry
```

The geometry is converted by PostGIS using:

```sql
ST_AsGeoJSON(...)
```

Therefore:

```text
PostGIS geometry
       ↓
ST_AsGeoJSON
       ↓
JSON response
       ↓
Future MapLibre client
```

The database remains responsible for storing the actual spatial geometry.

---

# 40. GeoJSON API Strategy

A significant backend decision is that the API exposes spatial geometry in GeoJSON-compatible form.

For example:

```text
PostGIS Polygon
      ↓
GeoJSON Polygon
      ↓
HTTP
      ↓
MapLibre
```

This prevents us from creating a separate manually maintained frontend representation of parcel geometry.

The intended principle is:

> The frontend visualizes database geometry rather than owning a duplicate spatial model.

This will become particularly important once real neighborhood datasets are introduced.

---

# 41. SQL Parameterization

API queries use parameterized SQL.

For example, conceptually:

```python
cursor.execute(
    query,
    (parcel_id,)
)
```

rather than constructing SQL such as:

```text
"... WHERE parcel_id = '" + parcel_id + "'"
```

This prevents request values from being interpreted directly as SQL syntax.

The same pattern will be maintained throughout the backend.

---

# 42. Backend Modularization

After proving the initial API path, the backend reached the point where continuing to place all routes inside `main.py` would create unnecessary coupling.

The backend is therefore being organized as a modular monolith.

The structure becomes:

```text
backend/
└── app/
    ├── __init__.py
    ├── main.py
    ├── database.py
    │
    └── routers/
        ├── __init__.py
        ├── parcels.py
        ├── buildings.py
        ├── floors.py
        └── units.py
```

This provides domain separation without introducing microservices.

---

# 43. Why a Modular Monolith

The prototype does not need separate deployable services for:

```text
Parcel Service
Building Service
Floor Service
Unit Service
```

That would introduce:

* additional deployments
* network communication
* service discovery
* distributed failure modes
* duplicated configuration
* unnecessary development overhead

Instead:

```text
             FASTAPI
                │
    ┌───────────┼───────────┐
    │           │           │
 Parcels    Buildings     Floors
                            │
                           Units
                │
                ▼
             POSTGIS
```

All domains remain inside one application process.

The separation exists at the code level rather than the infrastructure level.

---

# 44. Parcel Router

The parcel router is responsible for parcel-oriented operations.

Current/planned endpoints include:

```text
GET /parcels

GET /parcels/{parcel_id}

GET /parcels/{parcel_id}/buildings
```

The final endpoint represents the first downward traversal of the property hierarchy:

```text
Parcel P001
     ↓
Buildings belonging to P001
```

The database relationship is established through:

```text
buildings.parcel_id
```

while the API exposes the human-readable prototype identifier:

```text
P001
```

---

# 45. Building Router

Building operations are separated into the building router.

Endpoints include:

```text
GET /buildings/{building_id}

GET /buildings/{building_id}/floors
```

An individual building response can contain:

```text
building_id
parcel_id
name
height_m
floor_count
source_type
source_name
derivation_method
verification_status
footprint
```

This means a client can retrieve both:

```text
semantic building information
```

and:

```text
building geometry
```

through the same domain resource.

---

# 46. Building-to-Floor Traversal

The endpoint:

```text
GET /buildings/B001/floors
```

provides the next level of vertical traversal.

For the current synthetic property, the logical response represents:

```text
B001
│
├── F001
│   z = 0–3 m
│
├── F002
│   z = 3–6 m
│
└── F003
    z = 6–9 m
```

The floor resources expose both:

```text
horizontal footprint
```

and:

```text
vertical range
```

which will eventually allow Cesium to construct or display floor-level 3D representations.

---

# 47. Floor Router

Floor operations are handled through:

```text
GET /floors/{floor_id}

GET /floors/{floor_id}/units
```

This provides:

```text
Floor
  ↓
Property Units
```

For example:

```text
GET /floors/F001/units
```

returns the property units associated with the first floor.

For the current synthetic model:

```text
F001
├── U101
└── U102
```

---

# 48. Unit Router

The unit endpoint represents the deepest property level currently modeled.

The primary endpoint is:

```text
GET /units/{unit_id}
```

An important design decision is that this response does not only describe the unit.

It also returns its ancestry.

Conceptually:

```text
U101
 │
 ├── Floor F001
 │
 ├── Building B001
 │
 └── Parcel P001
```

This allows reverse traversal.

If a user eventually clicks an apartment/unit in the 3D viewer, the application can immediately determine:

```text
Which floor?
Which building?
Which parcel?
```

without requiring the frontend to reconstruct those relationships.

---

# 49. Bidirectional Property Navigation

The backend is therefore being designed to support both directions.

## Downward

```text
Parcel
   ↓
Building
   ↓
Floor
   ↓
Unit
```

## Upward

```text
Unit
   ↓
Floor
   ↓
Building
   ↓
Parcel
```

This will become important for interactive spatial exploration.

For example:

```text
User selects parcel in 2D
          ↓
Navigate downward
          ↓
Building
          ↓
Floor
          ↓
Unit
```

while:

```text
User selects unit in 3D
          ↓
Navigate upward
          ↓
Floor
          ↓
Building
          ↓
Parcel
```

Both interactions operate on the same spatial model.

---

# 50. API Failure Behavior

The API is also being designed to handle missing entities explicitly.

For example:

```text
GET /units/DOES-NOT-EXIST
```

should return:

```text
HTTP 404
```

rather than:

```text
HTTP 200
null
```

The response is approximately:

```json
{
  "detail": "Unit not found"
}
```

Similar behavior applies to missing parcels, buildings, and floors.

This establishes predictable API semantics before frontend integration begins.

---

# 51. Swagger / OpenAPI

FastAPI automatically generates interactive API documentation.

During local development it is available at:

```text
http://127.0.0.1:8000/docs
```

The routes are organized into logical groups:

```text
System
Parcels
Buildings
Floors
Units
```

Swagger provides a convenient way to test the backend independently from the frontend.

This separation is useful because:

```text
Database
    ↓
Backend
    ↓
Swagger validation
```

can be completed before:

```text
Frontend
```

is introduced.

---

# 52. Current API Traversal

The complete intended backend traversal at this checkpoint is:

```text
GET /parcels/P001
        │
        ▼
GET /parcels/P001/buildings
        │
        ▼
GET /buildings/B001
        │
        ▼
GET /buildings/B001/floors
        │
        ▼
GET /floors/F001
        │
        ▼
GET /floors/F001/units
        │
        ▼
GET /units/U101
```

This directly mirrors:

```text
P001
└── B001
    ├── F001
    │   ├── U101
    │   └── U102
    │
    ├── F002
    │   ├── U201
    │   └── U202
    │
    └── F003
        ├── U301
        └── U302
```

---

# 53. Planned Property Tree Endpoint

One additional backend endpoint is planned before backend v0.1 is frozen:

```text
GET /parcels/{parcel_id}/tree
```

Instead of requiring the frontend to issue several requests to reconstruct the hierarchy, this endpoint will return the complete property tree.

Conceptually:

```json
{
  "parcel_id": "P001",
  "buildings": [
    {
      "building_id": "B001",
      "floors": [
        {
          "floor_id": "F001",
          "floor_number": 1,
          "units": [
            {
              "unit_id": "U101",
              "unit_number": "101"
            },
            {
              "unit_id": "U102",
              "unit_number": "102"
            }
          ]
        }
      ]
    }
  ]
}
```

This endpoint will be particularly useful for a frontend property-navigation panel.

---

# 54. Current End-to-End Architecture

At this checkpoint, the implemented architecture has progressed substantially.

```text
                    SYNTHETIC PROPERTY
                           │
                           ▼
                        POSTGIS
                           │
             ┌─────────────┴─────────────┐
             │                           │
          Geometry                   Relations
             │                           │
             └─────────────┬─────────────┘
                           ▼
                        psycopg
                           │
                           ▼
                        FastAPI
                           │
                           ▼
                     REST / GeoJSON
                           │
                           ▼
                         HTTP
```

The next architectural layer will be:

```text
HTTP
 ↓
React
 ↓
MapLibre
```

followed later by:

```text
React
 ↓
CesiumJS
 ↓
3D vertical property visualization
```

---

# 55. Current Project Status

The system currently has or has established:

```text
PROJECT FOUNDATION

Git repository                     ✓
GitHub repository                  ✓
VS Code environment                ✓
Docker                             ✓


SPATIAL DATABASE

PostgreSQL 17                      ✓
PostGIS 3.5                        ✓
GEOS                               ✓
PROJ                               ✓
Spatial indexes                    ✓


DOMAIN MODEL

Parcel                             ✓
Building                           ✓
Floor                              ✓
Unit                               ✓
Vertical ranges                    ✓
Provenance model                   ✓
Foreign-key hierarchy              ✓


SYNTHETIC PROPERTY

P001                               ✓
B001                               ✓
F001–F003                          ✓
U101–U302                          ✓


VALIDATION

Geometry validity                  ✓
Building inside parcel             ✓
Floor inside building              ✓
Unit inside floor                  ✓
Vertical hierarchy                 ✓
Provenance constraint              ✓


BACKEND FOUNDATION

FastAPI                            ✓
psycopg                            ✓
PostGIS → API connection           ✓
GeoJSON serialization              ✓
Health endpoint                    ✓
Parcel retrieval                   ✓
Modular router architecture        ✓ / in progress
Full hierarchy traversal           ✓ / current milestone
```

---

# 56. What the System Can Now Represent

We started with an abstract concept:

```text
"3D vertical property mapping"
```

The current system can represent this as structured information:

```text
PARCEL P001
│
├── geometry
├── provenance
├── verification
│
└── BUILDING B001
    │
    ├── footprint
    ├── height = 9 m
    ├── floor_count = 3
    │
    ├── FLOOR F001
    │   ├── z = 0–3 m
    │   ├── UNIT U101
    │   └── UNIT U102
    │
    ├── FLOOR F002
    │   ├── z = 3–6 m
    │   ├── UNIT U201
    │   └── UNIT U202
    │
    └── FLOOR F003
        ├── z = 6–9 m
        ├── UNIT U301
        └── UNIT U302
```

And that information is no longer trapped inside PostgreSQL.

It is becoming available through HTTP as machine-readable JSON/GeoJSON.

---

# 57. Important Architectural Property

At this stage we have deliberately kept three concerns separate:

```text
DATA
 ↓
PostGIS

APPLICATION LOGIC
 ↓
FastAPI

VISUALIZATION
 ↓
Future React / MapLibre / Cesium
```

This separation is fundamental.

Changing the visual representation should not require redefining property identity.

Changing a building's appearance should not change its database identity.

Changing from MapLibre to another renderer should not destroy the domain model.

The spatial information exists independently of how it is rendered.

---

# 58. Current Data Flow

The emerging application data flow is:

```text
Spatial source
      ↓
Ingestion pipeline
      ↓
PostGIS
      ↓
FastAPI
      ↓
JSON / GeoJSON
      ↓
React application
      ↓
┌─────────────┬─────────────┐
│             │             │
▼             ▼             ▼
MapLibre    Cesium       Metadata UI
```

This remains consistent with the original data-first architecture.

---

# 59. Backend v0.1 Completion Criteria

Before frontend development begins, backend v0.1 should satisfy:

* [x] Database connectivity
* [x] Health endpoint
* [x] Parcel retrieval
* [x] GeoJSON serialization
* [ ] Parcel → building traversal verified
* [ ] Building → floor traversal verified
* [ ] Floor → unit traversal verified
* [ ] Unit → parent hierarchy verified
* [ ] Missing-resource 404 behavior verified
* [ ] Property tree endpoint
* [ ] CORS configuration
* [ ] Minimal automated API tests

Once these are complete, backend development should temporarily freeze.

The objective is not to build every possible API.

The objective is to provide enough stable functionality for the visualization layer.

---

# 60. Next Development Phase

After backend v0.1 is frozen, development moves to the first visual layer:

```text
MAPLIBRE
```

The initial frontend objective will be intentionally narrow:

```text
Open application
      ↓
Load parcel GeoJSON from FastAPI
      ↓
Render P001
      ↓
Render B001
      ↓
Click P001
      ↓
Retrieve parcel metadata
      ↓
Highlight selected parcel
```

This will prove:

```text
PostGIS
   ↓
FastAPI
   ↓
GeoJSON
   ↓
React
   ↓
MapLibre
   ↓
Interactive spatial feature
```

Only after that 2D pipeline works reliably will Cesium be introduced.

---

# 61. Development Philosophy So Far

The implementation has followed a deliberate progression:

```text
Research
   ↓
Architecture
   ↓
Development environment
   ↓
Spatial database
   ↓
Domain model
   ↓
Synthetic test data
   ↓
Spatial validation
   ↓
Backend API
   ↓
[CURRENT POSITION]
   ↓
2D visualization
   ↓
3D visualization
   ↓
Real neighborhood ingestion
   ↓
Integration
   ↓
Demo
```

This prevents the project from becoming a visually impressive frontend with an undefined or unreliable spatial foundation.

The core rule remains:

> **The spatial model is the system. The frontend is a view of that system.**

---

# 62. Current Technical Checkpoint

The project has moved from:

```text
IDEA
```

to:

```text
IDEA
 ↓
RESEARCH
 ↓
ARCHITECTURE
 ↓
POSTGIS
 ↓
SPATIAL DOMAIN MODEL
 ↓
VERTICAL PROPERTY MODEL
 ↓
SPATIAL VALIDATION
 ↓
FASTAPI
 ↓
HTTP / GEOJSON
```

The next major transition is:

```text
HTTP / GEOJSON
       ↓
REACT
       ↓
MAPLIBRE
       ↓
INTERACTIVE NEIGHBORHOOD MAP
```

Once that succeeds, the system will have its first visible end-to-end geospatial interface.

# 63. Frontend Phase Started

After completing the spatial database and backend API foundation, development moved into the first visualization phase.

The objective of this phase was deliberately narrow:

```text
PostGIS
   ↓
FastAPI
   ↓
GeoJSON
   ↓
React
   ↓
MapLibre
   ↓
Render P001
```

The purpose was not to build the final interface.

The purpose was to prove that spatial geometry stored in PostGIS could travel through the complete application stack and become an interactive feature in the browser.

This milestone has been successfully completed.

---

# 64. Frontend Technology

The frontend was initialized using:

```text
React
TypeScript
Vite
MapLibre GL JS
```

The current frontend structure contains approximately:

```text
frontend/
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── api.ts
│   ├── index.css
│   └── main.tsx
│
├── package.json
├── package-lock.json
├── vite.config.ts
└── ...
```

CesiumJS has intentionally not been introduced yet.

The development sequence remains:

```text
2D spatial interaction
        ↓
Property hierarchy
        ↓
3D vertical interaction
```

---

# 65. Frontend API Layer

A small API client was introduced in:

```text
frontend/src/api.ts
```

The frontend currently communicates with:

```text
http://127.0.0.1:8000
```

The first API operation retrieves parcels from:

```text
GET /parcels
```

The frontend models parcel geometry using GeoJSON polygon types.

Conceptually:

```text
PostGIS Polygon
      ↓
ST_AsGeoJSON
      ↓
FastAPI
      ↓
HTTP response
      ↓
TypeScript Parcel
      ↓
MapLibre GeoJSON source
```

This ensures the map is rendering geometry from the spatial database rather than from hardcoded frontend coordinates.

---

# 66. MapLibre Integration

MapLibre GL JS was integrated into the React application.

The map currently initializes around the synthetic development parcel coordinates.

The initial map intentionally uses a simple dark background rather than a real basemap.

This was a deliberate engineering decision.

The first question was:

> Can our own spatial data render correctly?

rather than:

> Can we display somebody else's basemap?

The answer is now yes.

---

# 67. MapLibre/Vite Compatibility Issue

During integration, Vite produced an optimization error involving:

```text
maplibre-gl-worker.mjs
```

The problem originated from Vite's dependency optimizer attempting to pre-bundle MapLibre's worker-related code.

The Vite configuration was updated to exclude MapLibre from dependency optimization:

```text
optimizeDeps
    ↓
exclude maplibre-gl
```

The Vite optimization cache was then cleared and the development server restarted.

This resolved the worker/dependency optimization issue.

---

# 68. TypeScript Integration Issues

Several TypeScript issues were encountered and corrected during MapLibre integration.

## MapLibre Import

The installed MapLibre module configuration did not expose the expected default export.

The frontend therefore uses a namespace-style MapLibre import rather than assuming a default export.

## Type-Only Imports

Map and GeoJSON interfaces are treated as TypeScript types rather than runtime values.

## GeoJSON Types

GeoJSON TypeScript definitions were introduced so that parcel geometry could be represented explicitly as:

```text
FeatureCollection<Polygon>
```

rather than relying on an undefined global GeoJSON namespace.

## Null Safety

TypeScript correctly identified that a React map reference could theoretically be null inside nested callbacks.

The map initialization/use logic was restructured around a validated local map instance rather than suppressing the compiler warning.

This preserved strict null safety.

---

# 69. Styling Failure and Resolution

After the API and React application began working, the browser initially displayed mostly unstyled HTML.

The screen contained the correct information:

```text
3D ULPIN

Vertical Property Mapping Prototype

Spatial API Connected

Property Explorer

Loaded parcels: 1
```

but the intended application layout and map were not visible.

This revealed an important debugging fact:

```text
Data/API pipeline     ✓
React rendering       ✓
Application CSS       ✗
```

The issue was corrected by restoring the required application layout styles.

The application now establishes explicit dimensions for:

```text
html
body
#root
.app
.workspace
.map
```

This is particularly important for MapLibre because the map container must have an actual width and height before the renderer can display the map.

---

# 70. Current Application Layout

The application now has a stable two-part workspace:

```text
┌─────────────────────────────────────────────────────────────┐
│ 3D ULPIN                         Spatial API ● Connected    │
│ Vertical Property Mapping Prototype                         │
├──────────────────────────────────────────┬──────────────────┤
│                                          │                  │
│                                          │ Property         │
│              MAPLIBRE MAP                │ Explorer         │
│                                          │                  │
│                   P001                   │ P001             │
│                                          │ Metadata         │
│                                          │                  │
└──────────────────────────────────────────┴──────────────────┘
```

The map occupies the primary workspace.

The Property Explorer occupies the right-hand panel.

---

# 71. First Rendered Spatial Entity

The synthetic parcel:

```text
P001
```

is now successfully rendered by MapLibre.

Its geometry originates from:

```text
PostGIS
```

rather than from a frontend constant.

The complete path is:

```text
parcels.geometry
      ↓
PostGIS
      ↓
ST_AsGeoJSON
      ↓
FastAPI /parcels
      ↓
fetch()
      ↓
React state
      ↓
GeoJSON FeatureCollection
      ↓
MapLibre source
      ↓
MapLibre fill layer
      ↓
P001 rendered in browser
```

This is the project's first complete visual end-to-end spatial pipeline.

---

# 72. Parcel Interaction

P001 is interactive.

The map registers pointer interaction against the parcel layer.

When the user selects the parcel:

```text
Map click
    ↓
MapLibre feature
    ↓
parcel_id
    ↓
React Parcel object
    ↓
selectedParcel
    ↓
Property Explorer
```

The Property Explorer then displays the selected parcel.

This proves that rendered geometry retains a connection to its semantic identity.

P001 is not simply a blue rectangle.

It remains:

```text
PARCEL
  │
  ├── ID
  ├── Geometry
  ├── Metadata
  ├── Provenance
  └── Verification state
```

---

# 73. Property Explorer

The Property Explorer currently displays parcel-level information including:

```text
Parcel ID
Name
Official ULPIN
Source
Verification status
```

For the current synthetic parcel, the interface displays approximately:

```text
PARCEL

P001

Name
Prototype Parcel 001

Official ULPIN
Not available

Source
synthetic

Verification
unverified
```

This correctly preserves the distinction between prototype identity and official ULPIN information.

---

# 74. Synthetic Data Disclosure

The interface explicitly displays:

```text
Synthetic demonstration data
```

for P001.

This is an important product requirement rather than merely a visual warning.

The prototype must distinguish:

```text
authoritative
real
derived
synthetic
```

information throughout the system.

The frontend has now demonstrated that provenance stored in the database can propagate all the way to the user interface.

The flow is:

```text
Database provenance
        ↓
FastAPI
        ↓
JSON
        ↓
React
        ↓
Visible provenance disclosure
```

---

# 75. Official ULPIN Handling

Because the current development parcel does not contain an authoritative government-issued ULPIN, the interface correctly displays:

```text
Official ULPIN
Not available
```

rather than fabricating one.

This confirms one of the project's core integrity rules:

> Prototype identifiers must never be presented as government-issued ULPINs.

P001 therefore remains an internal prototype parcel identifier.

---

# 76. Spatial API Status

The interface includes a visible API connectivity indicator:

```text
Spatial API ● Connected
```

During development, the application also correctly entered an error state when FastAPI was unavailable.

This exposed and verified the runtime dependency chain:

```text
React/Vite :5173
      │
      ▼
FastAPI :8000
      │
      ▼
PostGIS :5432
```

All three layers must be operational for the complete application to function.

---

# 77. Local Runtime Procedure

The development environment currently starts in the following order.

## Step 1 — PostGIS

From the repository root:

```powershell
docker compose up -d
```

Verify:

```powershell
docker compose ps
```

The expected database container is:

```text
ulpin-postgis
```

with a healthy status.

---

## Step 2 — FastAPI

With the Python virtual environment activated:

```powershell
uvicorn backend.app.main:app --reload
```

The API runs at:

```text
http://127.0.0.1:8000
```

Useful development endpoints include:

```text
http://127.0.0.1:8000/health

http://127.0.0.1:8000/docs

http://127.0.0.1:8000/parcels
```

---

## Step 3 — React/Vite

From:

```text
frontend/
```

run:

```powershell
npm run dev
```

The application runs at:

```text
http://localhost:5173
```

The resulting runtime architecture is:

```text
Browser
   │
   ▼
React / Vite
:5173
   │
   ▼
FastAPI
:8000
   │
   ▼
PostGIS
:5432
```

---

# 78. Current Visual Milestone

The current application successfully demonstrates:

```text
Open browser
     ↓
React application loads
     ↓
FastAPI contacted
     ↓
P001 retrieved
     ↓
GeoJSON generated
     ↓
MapLibre renders P001
     ↓
User selects P001
     ↓
Property Explorer updates
     ↓
Parcel metadata displayed
```

This entire flow is operational.

---

# 79. Current Verified End-to-End Pipeline

The project has now crossed its first complete frontend boundary:

```text
SYNTHETIC SPATIAL DATA
          ↓
       POSTGIS
          ↓
       FASTAPI
          ↓
       GEOJSON
          ↓
        HTTP
          ↓
        REACT
          ↓
       MAPLIBRE
          ↓
   INTERACTIVE P001
          ↓
  PROPERTY METADATA
```

This is a significant architectural checkpoint because every major layer except the 3D renderer has now participated in a single user interaction.

---

# 80. Current Project Status

At the freeze point, the project status is:

```text
INFRASTRUCTURE

Git / GitHub                         ✓
Docker                               ✓
PostgreSQL                           ✓
PostGIS                              ✓
GEOS                                 ✓
PROJ                                 ✓


DOMAIN MODEL

Parcel                               ✓
Building                             ✓
Floor                                ✓
Unit                                 ✓
Vertical ranges                      ✓
Provenance                           ✓


SYNTHETIC DEVELOPMENT MODEL

P001                                 ✓
B001                                 ✓
F001–F003                            ✓
U101–U302                            ✓


SPATIAL VALIDATION

Geometry validity                    ✓
Building → Parcel                    ✓
Floor → Building                     ✓
Unit → Floor                         ✓
Vertical ranges                      ✓


BACKEND

FastAPI                              ✓
PostGIS connection                   ✓
GeoJSON output                       ✓
Parcel endpoints                     ✓
Property hierarchy endpoints         ✓
Property tree                        ✓
CORS                                 ✓
API tests                            ✓


FRONTEND

React                                ✓
TypeScript                           ✓
Vite                                 ✓
MapLibre                             ✓
FastAPI communication                ✓
Parcel GeoJSON rendering             ✓
Parcel selection                     ✓
Parcel metadata                      ✓
Provenance disclosure                ✓


3D

CesiumJS                             NOT STARTED
Floor rendering                      NOT STARTED
Unit rendering                       NOT STARTED
Vertical navigation                  NOT STARTED


REAL NEIGHBORHOOD

Road ingestion                       NOT STARTED
Park ingestion                       NOT STARTED
Real building ingestion              NOT STARTED
Parcel dataset selection             NOT STARTED
```

---

# 81. Current Git Checkpoint

The current frontend milestone should be committed as:

```text
feat(frontend): render interactive parcel map
```

This commit represents:

```text
PostGIS
   ↓
FastAPI
   ↓
GeoJSON
   ↓
React
   ↓
MapLibre
   ↓
Interactive Parcel
```

The repository should be pushed/synchronized to GitHub before the next development session.

---

# 82. Deliberate Freeze Point

Development is intentionally frozen at this point.

No additional features should be introduced before the next session.

The current system is in a known working state:

```text
Database        WORKING
Backend         WORKING
API tests       WORKING
Frontend        WORKING
MapLibre        WORKING
P001 rendering  WORKING
P001 selection  WORKING
```

This provides a clean recovery point if future changes introduce regressions.

---

# 83. Next Development Session

The next implementation target is:

```text
P001
└── B001
```

B001 will be retrieved from the existing FastAPI backend and rendered as an independently identifiable spatial feature inside P001.

The target interaction becomes:

```text
Select P001
    ↓
Display Parcel
    ↓
Load B001
    ↓
Render Building
    ↓
Select B001
    ↓
Display Building Metadata
    ↓
Expose Floors
```

The Property Explorer will then evolve from a metadata panel into a hierarchy navigator.

---

# 84. Planned Next Milestones

The immediate sequence from this freeze point is:

```text
CURRENT
Interactive P001
      ↓
Render B001
      ↓
Parcel → Building navigation
      ↓
Building → Floor hierarchy
      ↓
Floor → Unit hierarchy
      ↓
2D hierarchy complete
      ↓
CesiumJS integration
      ↓
3D Building
      ↓
3D Floors
      ↓
3D Units
      ↓
Vertical navigation
```

After the vertical interaction is proven with the synthetic model, attention can shift toward the real neighborhood dataset.

---

# 85. Why We Freeze Here

The system currently has a working vertical-property backend and a working spatial frontend.

Continuing immediately into building rendering, neighborhood ingestion, or Cesium would increase the number of simultaneously changing components.

Instead, this checkpoint preserves a stable baseline:

```text
Known-good database
       +
Known-good API
       +
Known-good frontend
       +
Known-good spatial rendering
       =
RECOVERABLE SYSTEM STATE
```

The next development session can therefore begin from a functioning product rather than from an unresolved debugging state.

---

# 86. End-of-Session Architecture

The system at the end of this development session is:

```text
                         USER
                          │
                          ▼
                  ┌───────────────┐
                  │ React + Vite  │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   MapLibre    │
                  │               │
                  │     P001      │
                  └───────┬───────┘
                          │
                     User Selection
                          │
                          ▼
                  Property Explorer
                          │
                          │ HTTP
                          ▼
                  ┌───────────────┐
                  │    FastAPI    │
                  └───────┬───────┘
                          │
                        SQL
                          │
                          ▼
                  ┌───────────────┐
                  │    PostGIS    │
                  │               │
                  │ P001          │
                  │ └── B001      │
                  │     ├── F001  │
                  │     │   ├ U101│
                  │     │   └ U102│
                  │     ├── F002  │
                  │     └── F003  │
                  └───────────────┘
```

The database already understands the vertical property hierarchy.

The browser now understands the parcel.

The next session connects those two concepts visually.

---

# 87. Session Resume Point

When development resumes:

1. Pull/sync the latest Git repository if necessary.
2. Start Docker/PostGIS.
3. Verify the database contains `1 parcel / 1 building / 3 floors / 6 units`.
4. Run the backend test suite.
5. Start FastAPI.
6. Start Vite.
7. Confirm P001 renders and remains selectable.
8. Do not modify the existing parcel pipeline unless it is broken.
9. Begin B001 rendering as the next isolated feature.
10. Commit B001 separately from the current parcel milestone.

Resume objective:

> **Turn the working parcel viewer into a Parcel → Building property explorer without breaking the known-good P001 pipeline.**


# 88. 3D Visualization Phase

After completing the 2D parcel/building workflow and establishing shared application selection state, development moved into the core 3D visualization phase.

The objective was to extend the existing spatial hierarchy:

```text
Parcel
   ↓
Building
   ↓
Floor
   ↓
Unit
```

from database/API representation into an interactive three-dimensional property viewer.

CesiumJS was selected as the 3D geospatial rendering engine.

---

# 89. Shared 2D / 3D Application Model

The application now supports two visualization modes:

```text
2D MAP
   │
   └── MapLibre

3D PROPERTY
   │
   └── CesiumJS
```

These are not separate applications.

Both operate against the same application state and spatial domain model.

The selection hierarchy is conceptually:

```text
SpatialSelection

parcel
building
floor
unit
```

This means a selected building remains the same domain entity regardless of whether it is being viewed through MapLibre or Cesium.

---

# 90. View Mode

A shared view state was introduced:

```text
2D
or
3D
```

The application header provides:

```text
[ 2D Map ] [ 3D Property ]
```

The 3D mode remains unavailable until a building has been selected.

The expected workflow is:

```text
2D Map
   ↓
Select Parcel
   ↓
Select Building
   ↓
Open 3D
   ↓
Inspect vertical property
```

This prevents the 3D viewer from operating without a meaningful property context.

---

# 91. Persistent Viewer Architecture

An early implementation destroyed the MapLibre instance when switching from 2D to 3D.

Returning from 3D caused the 2D viewer to render incorrectly.

The architecture was corrected so that both viewer containers remain mounted.

Conceptually:

```text
VIEWER WORKSPACE
│
├── MapLibre instance
│
└── Cesium instance
        │
        ▼
Visibility switching
```

The application now changes viewer visibility rather than repeatedly destroying and reconstructing the visualization engines.

This provides several benefits:

* camera state can survive mode changes
* loaded spatial resources can survive mode changes
* switching is faster
* viewer lifecycle logic is simpler
* future synchronization becomes easier

MapLibre is explicitly resized when returning to 2D mode.

---

# 92. CesiumJS Integration

CesiumJS was installed as the dedicated 3D geospatial engine.

The initial integration required configuring Vite to correctly serve Cesium's runtime assets.

Cesium depends on runtime resources including:

```text
Workers
Assets
Widgets
WebAssembly / supporting resources
```

A Cesium-specific Vite integration was ultimately used rather than maintaining custom asset-copy logic.

The integration was verified when Cesium successfully initialized a WebGL rendering environment inside the React application.

---

# 93. Cesium Integration Issues

Several integration problems were encountered and resolved.

## Runtime Asset Decoding

An early configuration produced:

```text
InvalidStateError:
The source image could not be decoded.
```

This was traced to Cesium runtime asset handling rather than PostGIS or application geometry.

The asset configuration was simplified using a Cesium-specific Vite integration.

## Plugin Export Compatibility

The installed package version exposed a default plugin function.

Its TypeScript declaration confirmed:

```text
vitePluginCesium(options?) → Vite Plugin
```

The Vite configuration was adjusted to match the installed package API rather than relying on assumptions about another plugin version.

## Black Cesium Screen

After the runtime configuration was fixed, Cesium initially displayed a black screen.

This was expected because the viewer had deliberately been configured with:

```text
No basemap
No terrain
Hidden globe
No entities
Dark background
```

The black canvas therefore confirmed that the Cesium rendering engine itself was functioning.

---

# 94. Isolated Property Inspection Mode

The current Cesium environment is intentionally configured as an isolated property viewer.

At this stage:

```text
Globe       hidden
Basemap     disabled
Terrain     disabled
Property    visible
```

This allows development to focus on the vertical-property geometry without introducing unrelated terrain or imagery variables.

A real geospatial context can be added later.

---

# 95. First 3D Building

The first Cesium domain entity rendered was:

```text
B001
```

B001 was not recreated manually inside the frontend.

Its geometry originated from the existing spatial model:

```text
PostGIS building footprint
        +
building.height_m
        ↓
FastAPI
        ↓
Building object
        ↓
Cesium polygon
        ↓
3D extrusion
```

For B001:

```text
Height = 9 m
```

Cesium therefore extruded the existing building footprint from:

```text
0 m
↓
9 m
```

This produced the project's first georeferenced 3D building volume.

---

# 96. Why the First Building Appeared as a Cuboid

The first B001 representation appeared as a large rectangular/cuboid building.

This was correct.

The synthetic building footprint is rectangular, and the renderer was instructed to extrude that footprint continuously through its full height.

Conceptually:

```text
2D footprint
      +
9 m height
      ↓
Solid building mass
```

This proved:

```text
PostGIS footprint             ✓
GeoJSON coordinates           ✓
Cesium coordinate conversion  ✓
Metric extrusion              ✓
3D entity creation            ✓
Camera framing                ✓
```

The next step was therefore not to artificially improve the cuboid.

Instead, the building was decomposed according to the semantic property model already stored in PostGIS.

---

# 97. Floor-Level 3D Model

B001 contains three floors:

```text
B001
│
├── F001
│   0–3 m
│
├── F002
│   3–6 m
│
└── F003
    6–9 m
```

Rather than representing the building only as one solid extrusion, Cesium now receives individual floor entities.

Conceptually:

```text
             9 m
      ┌───────────────┐
      │     F003      │
      ├───────────────┤
      │     F002      │
      ├───────────────┤
      │     F001      │
      └───────────────┘
             0 m
```

Each floor preserves:

```text
floor_id
floor_number
footprint
z_min_m
z_max_m
source
verification status
```

The 3D viewer therefore derives floor volumes from the same semantic information already used by the backend.

---

# 98. Unit-Level 3D Model

Property units are represented using the same extrusion principle.

For example:

```text
Unit U101

2D footprint
      +
z_min = 0 m
      +
z_max = 3 m
      ↓
3D unit volume
```

The synthetic demonstration hierarchy is:

```text
B001

Floor 3
├── U301
└── U302

Floor 2
├── U201
└── U202

Floor 1
├── U101
└── U102
```

Conceptually, the building can therefore be represented as:

```text
        ┌─────────┬─────────┐
6–9 m   │  U301   │  U302   │
        ├─────────┼─────────┤
3–6 m   │  U201   │  U202   │
        ├─────────┼─────────┤
0–3 m   │  U101   │  U102   │
        └─────────┴─────────┘
```

This is the first visualization that directly represents the project's vertical-property concept.

---

# 99. Semantic 3D Rather Than Mesh-Only 3D

An important architectural property has been preserved.

Cesium does not receive one anonymous mesh representing the entire property.

Instead, the renderer receives identifiable domain entities:

```text
Building B001
Floor F001
Floor F002
Floor F003
Unit U101
Unit U102
...
```

Therefore:

```text
3D object
   ↓
still has
   ↓
domain identity
```

This is fundamental to the project.

The objective is not merely to render buildings.

The objective is to render a machine-readable spatial hierarchy.

---

# 100. Floor and Unit Selection State

The React application now understands the complete selection chain:

```text
Parcel
   ↓
Building
   ↓
Floor
   ↓
Unit
```

For example:

```text
P001
   ↓
B001
   ↓
F001
   ↓
U101
```

Selecting a floor causes the frontend to retrieve its property units.

The selected state can then be reflected in the Cesium visualization.

This creates the current interaction direction:

```text
Property Explorer
       ↓
React selection
       ↓
Cesium rendering
```

Future work will implement the reverse direction:

```text
Cesium click
       ↓
React selection
       ↓
Property Explorer
```

---

# 101. 360-Degree Property Inspection

The Cesium viewer was upgraded from a static 3D view into a property-inspection environment.

Camera controls support:

```text
rotation
tilt
zoom
look
translation
```

The user can therefore inspect the property from arbitrary viewpoints rather than viewing it from one fixed camera.

This enables:

```text
Top inspection
Side inspection
Front/back inspection
Oblique inspection
Full orbit around property
```

This is important because vertical property relationships are significantly easier to understand from multiple viewpoints.

---

# 102. Camera Presets

Three initial camera presets were added.

## Reset

Returns to an oblique property-inspection perspective.

## Top

Provides a near-plan/cadastral perspective.

This is useful for understanding horizontal footprints and unit boundaries.

## Side

Provides a perspective emphasizing the vertical stack.

This is useful for understanding:

```text
Floor 3
Floor 2
Floor 1
```

and their Z relationships.

The presets complement free 360-degree camera movement rather than replacing it.

---

# 103. Spatial Integrity in Visualization

The 3D viewer does not artificially increase building height merely to make the model visually impressive.

B001 remains:

```text
9 m
```

because that is the height stored in the prototype spatial model.

Similarly:

```text
F001 = 0–3 m
F002 = 3–6 m
F003 = 6–9 m
```

Visualization improvements should come from:

```text
camera angle
transparency
selection highlighting
exploded visualization
outlines
lighting
interaction
```

rather than falsifying spatial geometry.

---

# 104. Planned Exploded View

A future visualization mode is planned for vertical inspection.

Normal mode preserves true Z positions:

```text
┌───────────────┐
│ F003          │
├───────────────┤
│ F002          │
├───────────────┤
│ F001          │
└───────────────┘
```

Exploded mode will visually separate floors:

```text
┌───────────────┐
│ F003          │
└───────────────┘

        gap

┌───────────────┐
│ F002          │
└───────────────┘

        gap

┌───────────────┐
│ F001          │
└───────────────┘
```

The important distinction is:

> Exploded mode changes only visualization offsets.

The authoritative/prototype spatial Z values remain unchanged in PostGIS.

---

# 105. Current 2D / 3D Architecture

The application now has the following visualization architecture:

```text
                    SHARED DOMAIN STATE
                           │
               P001 → B001 → Floor → Unit
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
        MAPLIBRE                     CESIUMJS
           2D                           3D
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                   PROPERTY EXPLORER
```

Both viewers ultimately represent the same spatial entities.

---

# 106. Current End-to-End System

The system has now reached:

```text
Spatial database
      ↓
PostGIS domain model
      ↓
Parcel
      ↓
Building
      ↓
Floor
      ↓
Unit
      ↓
FastAPI
      ↓
JSON / GeoJSON
      ↓
React
      ↓
Shared selection state
      ↓
┌───────────────┬────────────────┐
│               │                │
▼               ▼                ▼
MapLibre      Cesium       Property Explorer
2D            3D           Metadata/Hierarchy
```

This is the first point where the prototype demonstrates both horizontal and vertical property information through the same underlying model.

---

# 107. Current Verified User Journey

The current working user journey is approximately:

```text
OPEN APPLICATION
       ↓
VIEW 2D MAP
       ↓
SELECT P001
       ↓
VIEW PARCEL METADATA
       ↓
VIEW B001
       ↓
SELECT B001
       ↓
LOAD F001 / F002 / F003
       ↓
OPEN 3D
       ↓
VIEW B001 IN CESIUM
       ↓
ORBIT PROPERTY 360°
       ↓
SELECT FLOOR
       ↓
LOAD FLOOR UNITS
       ↓
VIEW UNIT VOLUMES
```

This is substantially closer to the intended final product journey.

---

# 108. Current Project Status

At this checkpoint:

```text
FOUNDATION

Git / GitHub                       ✓
Docker                             ✓
PostgreSQL                         ✓
PostGIS                            ✓


SPATIAL DOMAIN

Parcel                             ✓
Building                           ✓
Floor                              ✓
Unit                               ✓
Provenance                         ✓
Vertical ranges                    ✓


BACKEND

FastAPI                            ✓
Hierarchy traversal                ✓
GeoJSON                            ✓
CORS                               ✓
Tests                              ✓


2D

React                              ✓
MapLibre                           ✓
P001 rendering                     ✓
B001 rendering                     ✓
Parcel selection                   ✓
Building selection                 ✓
Property Explorer                  ✓


3D

CesiumJS                           ✓
Vite/Cesium runtime                ✓
Persistent 2D/3D viewers           ✓
Building extrusion                 ✓
Floor volumes                      ✓
Unit volumes                       ✓
360° camera inspection             ✓
Top camera                         ✓
Side camera                        ✓
Reset camera                       ✓


NEXT

Cesium → React picking              NEXT
Exploded floor view                 PLANNED
All-unit loading                    PLANNED
Real neighborhood ingestion         PLANNED
Roads / parks / urban context       PLANNED
Multiple detailed properties        PLANNED
Final UI polish                     PLANNED
```

---

# 109. Current Git Checkpoint

The current 3D milestone should be committed as:

```text
feat(3d): add Cesium vertical property viewer
```

This commit represents:

```text
PostGIS spatial hierarchy
        ↓
FastAPI
        ↓
React
        ↓
Cesium
        ↓
3D Building / Floor / Unit representation
        ↓
360° property inspection
```

This is a major prototype checkpoint and should be pushed to GitHub before continuing.

---

# 110. Next Development Milestone

The next major capability is **direct 3D picking**.

Current interaction:

```text
Property Explorer
       ↓
select Floor / Unit
       ↓
Cesium updates
```

Target interaction:

```text
Cesium
   ↓
click 3D object
   ↓
identify domain entity
   ↓
React selection
   ↓
Property Explorer updates
```

For example:

```text
User clicks U202 in 3D
        ↓
Cesium identifies U202
        ↓
React selects:
P001
B001
F002
U202
        ↓
Property Explorer displays:
Unit 202
Vertical range 3–6 m
Source synthetic
Verification unverified
```

Once this works, the 3D visualization becomes a fully interactive interface to the spatial domain model rather than only a renderer controlled from the sidebar.

---

# 111. Freeze Point

The repository should now be treated as a known-good checkpoint.

Before the next implementation phase:

```text
npm run build
python -m pytest -v
```

should remain clean.

The current prototype can:

```text
Store spatial property entities
        ↓
Validate their relationships
        ↓
Expose them through an API
        ↓
Navigate them in 2D
        ↓
Navigate their hierarchy
        ↓
Represent them in 3D
        ↓
Inspect them from 360°
```

The next development session should begin from this stable point and add direct interaction with the 3D spatial entities.

# 112. Renderer Architecture Change

After the initial CesiumJS vertical-property viewer was implemented, the renderer architecture was reconsidered.

Cesium successfully proved that the spatial hierarchy could be represented in 3D, but it introduced more runtime and rendering complexity than was necessary for the neighborhood-scale prototype.

The project therefore moved toward a unified MapLibre-based visualization architecture.

The application now uses:

```text
MapLibre GL JS
      │
      ├── 2D map rendering
      │
      └── 3D fill-extrusion rendering
```

rather than maintaining separate MapLibre and Cesium rendering systems.

This reduced:

```text
renderer lifecycle complexity
duplicate viewer state
frontend integration complexity
runtime asset handling
switching overhead
```

while preserving the underlying spatial model.

This change reinforced an important architectural principle:

> The spatial domain model must remain independent of the renderer.

The PostGIS representation of parcels, buildings, floors, and units did not need to change when the visualization technology changed.

---

# 113. Real Neighborhood Integration

After proving the vertical-property hierarchy using the deterministic synthetic property, development moved toward real urban context.

The objective became:

```text
Synthetic vertical property model
            +
Real neighborhood geometry
            ↓
Neighborhood-scale prototype
```

OpenStreetMap was selected as the initial real-world geospatial source.

The ingestion pipeline was introduced under:

```text
pipelines/osm/
```

The pipeline retrieves and normalizes neighborhood entities such as:

```text
buildings
roads
parks
water features
```

before inserting them into PostGIS.

The important architectural rule remains:

```text
OpenStreetMap
      ↓
Ingestion pipeline
      ↓
PostGIS
      ↓
FastAPI
      ↓
Frontend
```

The frontend does not directly own or independently fetch the authoritative application copy of the neighborhood dataset.

---

# 114. Neighborhood Database Expansion

The database was expanded beyond the original property hierarchy.

The spatial model now contains neighborhood context including:

```text
buildings
roads
parks
water_features
```

Real OSM buildings coexist with the earlier prototype property model.

This allows the database to represent both:

```text
URBAN CONTEXT
│
├── roads
├── parks
├── water
└── real buildings
```

and:

```text
VERTICAL PROPERTY MODEL
│
├── buildings
├── floors
└── units
```

within the same spatial backend.

---

# 115. Neighborhood API

A neighborhood router was introduced in FastAPI.

The frontend can retrieve real urban context through domain-oriented API endpoints rather than embedding the OSM dataset directly.

The neighborhood API exposes information including:

```text
building footprints
road geometries
parks
water
summary counts
```

The frontend therefore receives real neighborhood geometry through the same architectural path as the property model:

```text
PostGIS
   ↓
FastAPI
   ↓
GeoJSON
   ↓
React
   ↓
MapLibre
```

---

# 116. Real Neighborhood Selection

Several areas were considered during real-data experimentation.

The final prototype geography was moved to:

```text
Bandra Kurla Complex
Mumbai, India
```

BKC was selected because it provides a stronger neighborhood-scale demonstration environment:

```text
organized urban structure
commercial buildings
recognizable named properties
road network
green/public areas
useful building metadata
```

The prototype geography is therefore no longer centered on the original synthetic development location.

---

# 117. BKC Prototype Area

The MapLibre application now initializes around BKC.

The neighborhood is represented using real OSM-derived geometry stored in PostGIS.

The application can display:

```text
BKC
│
├── buildings
├── roads
├── parks
└── water/public spatial context
```

The frontend uses a deliberately simplified visual style rather than a third-party raster basemap.

This keeps the application's own spatial information visually dominant.

---

# 118. Real Building Metadata

Real OSM building records retain information such as:

```text
building_id
OSM identifier
name
building type
height
levels
footprint
source type
source name
```

Not every OSM building contains complete vertical metadata.

For buildings without mapped heights, the renderer may use a visualization-only fallback height.

That fallback must not be confused with stored authoritative or real-world property information.

The distinction is:

```text
database value
      ≠
rendering fallback
```

This preserves the provenance model established earlier in development.

---

# 119. Building Search and Focus

As the neighborhood dataset became larger, manually locating a particular building became an unnecessary usability problem.

A building finder was therefore introduced.

The Property Explorer can search named BKC buildings.

Conceptually:

```text
Search BKC buildings...
        ↓
Raheja Tower
        ↓
Focus
```

When a building is selected through search:

```text
building identity
      ↓
matching GeoJSON feature
      ↓
actual polygon bounds
      ↓
MapLibre fitBounds()
      ↓
camera focuses building
```

The camera focus is therefore derived from the selected building geometry rather than requiring hardcoded coordinates for every property.

---

# 120. Generic Building Selection

Building selection is now connected to semantic OSM metadata.

Selecting a real building updates the Property Explorer with information such as:

```text
OSM ID
name
type
height
levels
source
data classification
```

The selected building is also visually highlighted.

The interaction therefore preserves:

```text
Rendered building
       ↓
building_id
       ↓
domain entity
       ↓
metadata
```

The map is an interface to the spatial entity rather than an independent representation of it.

---

# 121. Flagship Real Building

A real BKC building was selected as the flagship vertical-property demonstration:

```text
Raheja Tower
```

The corresponding OSM record is:

```text
Building ID:
OSM-WAY-353159496

OSM ID:
353159496

Building type:
commercial

Mapped height:
45 m

Mapped levels:
15

Source:
OpenStreetMap
```

The building footprint is represented by real OSM polygon geometry.

This replaced the synthetic B001 cuboid as the primary demonstration object.

---

# 122. Raheja Tower Provenance Boundary

The prototype deliberately separates what is known from OpenStreetMap from what is generated by the prototype.

For Raheja Tower:

```text
REAL / OSM

building identity
name
building type
footprint
height
mapped level count
```

The prototype does not claim that OSM provides:

```text
official cadastral parcel
official ULPIN
authoritative floor polygons
authoritative unit boundaries
ownership
legal title
```

This boundary is explicitly preserved throughout the model.

---

# 123. Derived Vertical Model

Raheja Tower has:

```text
height = 45 m
levels = 15
```

The prototype derives a deterministic floor stack from those values.

For the demonstration:

```text
45 / 15 = 3 m per floor
```

The resulting model is:

```text
F01   [ 0,  3)
F02   [ 3,  6)
F03   [ 6,  9)
...
F13   [36, 39)
F14   [39, 42)
F15   [42, 45)
```

The floor identities are:

```text
RAHEJA-F01
RAHEJA-F02
...
RAHEJA-F15
```

These floor entities use the real building footprint but are classified as derived rather than authoritative.

---

# 124. Derived Floor Provenance

Each generated Raheja floor retains provenance information.

Conceptually:

```text
source_type:
derived

derivation_method:
Derived from OpenStreetMap building footprint,
height, and building:levels

verification_status:
unverified
```

This ensures the system can distinguish:

```text
real source geometry
        ↓
derived vertical entity
```

without presenting the derived entity as an official cadastral record.

---

# 125. Vertical Interval Semantics

A deterministic vertical containment convention was established.

Floor intervals use:

```text
[z_min, z_max)
```

which means:

```text
z_min <= z < z_max
```

For example:

```text
Floor 07 = [18, 21)
Floor 08 = [21, 24)
Floor 09 = [24, 27)
```

Therefore:

```text
20.999999 → Floor 07
21.000000 → Floor 08

23.999999 → Floor 08
24.000000 → Floor 09
```

Using half-open intervals prevents adjacent vertical entities from simultaneously claiming the same boundary coordinate.

---

# 126. Vertical Model Inspection

The frontend can recognize the flagship building and expose its vertical model.

The interaction is:

```text
Search Raheja Tower
        ↓
Focus building
        ↓
Inspect vertical model
        ↓
Load derived floors
        ↓
Switch to 3D
        ↓
Render floor volumes
```

The Property Explorer displays the floor stack and the corresponding vertical ranges.

The model therefore remains inspectable both:

```text
visually
```

and:

```text
semantically
```

---

# 127. Current 3D Rendering Strategy

The current renderer uses MapLibre fill extrusions.

Real neighborhood buildings are represented as building extrusions.

Floor entities are also represented as fill extrusions using:

```text
floor footprint
z_min_m
z_max_m
```

Conceptually:

```text
2D polygon
    ×
vertical interval
    ↓
rendered floor volume
```

This follows the same representation strategy originally established for the database model.

The renderer does not require stored 3D meshes for the current prototype.

---

# 128. Renderer Independence Proven

The project initially used CesiumJS for 3D property inspection and later moved the prototype toward MapLibre-based extrusion.

The underlying property representation survived this transition.

This demonstrates an important system property:

```text
Spatial model
     │
     ├── Cesium representation
     │
     └── MapLibre representation
```

The renderer can change without redefining:

```text
building identity
floor identity
geometry
vertical range
provenance
relationships
```

This validates the earlier principle:

> The spatial model is the system. The visualization is a view of that system.

---

# 129. Spatial Engine Phase

After the real BKC visualization and Raheja vertical model were operational, development moved below the visualization layer.

The objective was to prove that the system could answer a deterministic spatial question without depending on the map:

> Given a physical longitude, latitude, and vertical coordinate, which property entity contains that point?

This introduced the first explicit spatial-engine primitive:

```text
resolve(lon, lat, z)
```

---

# 130. Spatial Resolve API

A spatial router was added to FastAPI.

The primary endpoint is:

```text
GET /spatial/resolve
```

It accepts:

```text
lon
lat
z
```

For example:

```text
lon = 72.86295
lat = 19.06090
z   = 22.5
```

The endpoint combines horizontal PostGIS containment with explicit vertical interval containment.

---

# 131. Horizontal Resolution

Horizontal containment is resolved against the building footprint using PostGIS.

Conceptually:

```text
input longitude / latitude
          ↓
PostGIS point
          ↓
building footprint containment
          ↓
containing building
```

The prototype uses the stored building polygon rather than a renderer-derived screen location.

This means spatial resolution remains available even if the frontend is removed.

---

# 132. Vertical Resolution

After the containing building is identified, floor resolution applies the vertical interval rule:

```text
floor.z_min_m <= z
AND
z < floor.z_max_m
```

For:

```text
z = 22.5
```

Raheja Tower resolves to:

```text
RAHEJA-F08
```

because:

```text
21 <= 22.5 < 24
```

---

# 133. First Successful 3D Coordinate Resolution

The first verified real-world query used:

```text
longitude = 72.86295
latitude  = 19.06090
z         = 22.5 m
```

The system returned:

```text
Building:
Raheja Tower

Building ID:
OSM-WAY-353159496

Floor:
RAHEJA-F08

Floor number:
8

Vertical range:
21–24 m
```

The response also preserved provenance:

```text
Building:
source_type = real
source_name = OpenStreetMap

Floor:
source_type = derived
verification_status = unverified
```

This established the first complete mapping:

```text
physical 3D coordinate
        ↓
spatial property identity
```

---

# 134. Spatial Resolution Hierarchy

The spatial resolver returns not only the matched entities but also their hierarchy.

For the first successful query:

```text
OSM-WAY-353159496
        ↓
RAHEJA-F08
```

Conceptually:

```json
{
  "hierarchy": [
    "OSM-WAY-353159496",
    "RAHEJA-F08"
  ]
}
```

This allows a caller to understand both:

```text
what vertical entity contains the point
```

and:

```text
which larger spatial entity contains that entity
```

---

# 135. Spatial Engine Independence

The spatial resolver does not depend on MapLibre.

Its dependency chain is:

```text
HTTP request
     ↓
FastAPI
     ↓
Spatial query logic
     ↓
PostGIS
     ↓
building + floor identity
```

Therefore the prototype now contains useful spatial behavior independently from its visualization layer.

This is an important transition.

The project is no longer only capable of:

```text
showing vertical space
```

It is also capable of:

```text
querying vertical space
```

---

# 136. Spatial Engine Tests

Automated tests were added for the spatial resolver.

The tests cover behavior including:

```text
Raheja Tower resolution
floor resolution
vertical boundaries
ground-floor resolution
top-floor resolution
provenance preservation
hierarchy output
outside-building behavior
invalid coordinate validation
```

The complete spatial test suite passed at the prototype checkpoint.

---

# 137. Boundary Correctness Tests

The spatial tests explicitly validate the half-open interval semantics.

Verified cases include:

```text
20.999999 → RAHEJA-F07

21.000000 → RAHEJA-F08

23.999999 → RAHEJA-F08

24.000000 → RAHEJA-F09
```

These tests are important because vertical boundary behavior must be deterministic.

A physical Z coordinate should not resolve to two adjacent floors simultaneously.

---

# 138. Provenance Through Spatial Resolution

The resolver preserves the distinction between source and derived data.

For example:

```text
Raheja Tower

source_type:
real

source_name:
OpenStreetMap
```

while:

```text
RAHEJA-F08

source_type:
derived

verification_status:
unverified
```

This demonstrates that provenance is not only database metadata.

It survives through:

```text
PostGIS
   ↓
spatial query
   ↓
FastAPI
   ↓
API response
```

and can therefore be consumed by any future interface.

---

# 139. Prototype Technical Claim

The prototype can now make a narrower and more defensible technical claim than the original project description.

It demonstrates that vertically stacked property space can be represented as explicit spatial entities and resolved from a physical 3D coordinate.

The core primitive is:

```text
(X, Y, Z)
    ↓
spatial identity
```

The current proof object is:

```text
BKC
 ↓
Raheja Tower
 ↓
15 derived floors
 ↓
3D coordinate
 ↓
containing building + floor
```

---

# 140. Current Prototype Boundary

The current prototype intentionally stops before implementing a general-purpose spatial topology engine.

Capabilities such as:

```text
parent(entity)
children(entity)
above(entity)
below(entity)
adjacent(entity)
intersects(volume)
```

are natural extensions of the model but are not required to prove the current prototype thesis.

Likewise, the prototype does not require:

```text
city-scale rendering
authoritative ownership data
legal cadastral integration
production authorization
full 3D topology
real floor plans
real unit boundaries
```

Those remain outside the current scope.

---

# 141. Current Real vs Derived vs Synthetic Model

At the final prototype checkpoint, the data categories are approximately:

```text
REAL

BKC urban context
roads
parks
water
OSM building footprints
Raheja Tower identity
Raheja Tower footprint
Raheja Tower mapped height
Raheja Tower mapped levels


DERIVED

Raheja floor identities
Raheja floor vertical ranges
Raheja floor volumes


SYNTHETIC

Original P001 / B001 development model
prototype unit geometries
prototype unit metadata


AUTHORITATIVE

No government cadastral dataset is currently
claimed as authoritative by the prototype.
```

This classification should remain explicit in all demonstrations and documentation.

---

# 142. Final Prototype Architecture

The current system architecture is:

```text
                         USER
                           │
                           ▼
                 ┌───────────────────┐
                 │ React / TypeScript│
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │     MapLibre      │
                 │                   │
                 │ 2D neighborhood   │
                 │ 3D extrusions     │
                 │ building search   │
                 │ vertical inspect  │
                 └─────────┬─────────┘
                           │
                           │ HTTP / GeoJSON
                           ▼
                 ┌───────────────────┐
                 │      FastAPI      │
                 │                   │
                 │ property API      │
                 │ neighborhood API  │
                 │ spatial API       │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │      PostGIS      │
                 │                   │
                 │ spatial entities  │
                 │ geometry          │
                 │ vertical ranges   │
                 │ provenance        │
                 └─────────┬─────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      OpenStreetMap              Prototype-derived
       real context              vertical entities
```

---

# 143. Final Demonstration Flow

The final prototype demonstration can follow:

```text
1. Start PostGIS

2. Start FastAPI

3. Start React/Vite

4. Open the BKC neighborhood

5. Search:
   Raheja Tower

6. Focus the real building

7. Inspect:
   real OSM metadata
   45 m height
   15 mapped levels

8. Open the vertical model

9. Inspect the 15 derived floor entities

10. Query:

    resolve(
        72.86295,
        19.06090,
        22.5
    )

11. Receive:

    Raheja Tower
        ↓
    RAHEJA-F08
        ↓
    [21 m, 24 m)
```

This connects the visual demonstration directly to the underlying spatial primitive.

---

# 144. Prototype Completion State

The final prototype now contains:

```text
INFRASTRUCTURE

Git / GitHub                         ✓
Docker                               ✓
PostgreSQL                           ✓
PostGIS                              ✓


SPATIAL DOMAIN

Parcel                               ✓
Building                             ✓
Floor                                ✓
Unit schema                          ✓
Vertical ranges                      ✓
Provenance                           ✓


REAL URBAN CONTEXT

BKC                                  ✓
OSM buildings                        ✓
Roads                                ✓
Parks                                ✓
Water                                ✓


BACKEND

FastAPI                              ✓
Property APIs                        ✓
Neighborhood APIs                    ✓
Spatial resolver                     ✓
GeoJSON                              ✓


FRONTEND

React                                ✓
TypeScript                           ✓
MapLibre                             ✓
2D neighborhood                      ✓
3D building extrusion                ✓
Building search                      ✓
Building focus                       ✓
Property metadata                    ✓
Vertical inspection                  ✓


FLAGSHIP PROPERTY

Raheja Tower                         ✓
Real footprint                       ✓
Real OSM metadata                    ✓
15-floor derived model               ✓
Explicit provenance                  ✓


SPATIAL ENGINE

resolve(lon, lat, z)                 ✓
Building resolution                  ✓
Floor resolution                     ✓
Hierarchy response                   ✓
Boundary semantics                   ✓
Automated tests                      ✓
```

---

# 145. What Is Intentionally Not Complete

The following are not required for the current prototype:

```text
authoritative cadastral integration
official ULPIN generation
real ownership records
real Raheja floor plans
real Raheja unit boundaries
production authentication
production authorization
city-scale vector tiling
general 3D topology
adjacency graph
accessibility graph
above/below query API
production deployment
```

These are future-system concerns rather than missing requirements for the current proof.

---

# 146. Final Engineering Principle

The project began with the idea of building a 3D property-mapping interface.

The implementation established a more important principle:

> **The visualization is not the spatial model.**

The spatial model exists independently through:

```text
identity
geometry
vertical extent
relationships
provenance
verification
```

The renderer consumes that model.

The API exposes that model.

The spatial resolver queries that model.

This allows the technology to remain meaningful even if the visualization layer changes again.

---

# 147. Final Prototype Result

The project has progressed through:

```text
IDEA
 ↓
RESEARCH
 ↓
SPATIAL DOMAIN MODEL
 ↓
POSTGIS
 ↓
SYNTHETIC PROPERTY
 ↓
SPATIAL VALIDATION
 ↓
FASTAPI
 ↓
MAPLIBRE
 ↓
3D PROPERTY REPRESENTATION
 ↓
REAL BKC INGESTION
 ↓
REAL BUILDING SELECTION
 ↓
RAHEJA VERTICAL MODEL
 ↓
SPATIAL RESOLUTION
 ↓
AUTOMATED CORRECTNESS TESTS
```

The final result is no longer merely:

```text
a 3D map
```

It is a neighborhood-scale proof that physical vertical space can be represented as addressable, provenance-aware spatial entities and queried using real-world coordinates.

---

# 148. Prototype Freeze

The current implementation is considered sufficient for the prototype objective.

Further feature development should not occur merely to increase visible functionality.

Before final delivery, the remaining work should focus on:

```text
documentation
test verification
frontend production build
repository cleanup
reproducibility
demo preparation
```

The prototype should remain frozen unless a defect prevents the documented demonstration flow from working.

The final operating principle is:

> **A small spatial primitive that works correctly is more valuable than a large collection of unfinished spatial features.**