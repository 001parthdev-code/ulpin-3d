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
