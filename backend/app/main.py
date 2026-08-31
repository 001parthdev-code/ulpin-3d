# pyrefly: ignore [missing-import]
from fastapi import FastAPI

import os 

# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse

from .routers import (
    buildings,
    floors,
    neighborhood,
    parcels,
    spatial,
    units,
)


app = FastAPI(
    title="3D ULPIN Spatial API",
    description=(
        "Spatial API for the 3D ULPIN "
        "vertical property mapping prototype."
    ),
    version="0.1.0",
)


cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        (
            "http://localhost:5173,"
            "http://127.0.0.1:5173"
        ),
    ).split(",")
    if origin.strip()
]

# Development CORS policy.
#
# This is intentionally permissive for the local prototype.
# Production deployments should restrict allowed origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/",
    response_class=JSONResponse,
    tags=["System"],
)
def root():
    return {
        "message":
            "Welcome to the 3D ULPIN Spatial API"
    }


@app.get(
    "/health",
    tags=["System"],
)
def health():
    return {
        "status": "ok",
        "service":
            "3D ULPIN Spatial API",
        "version": "0.1.0",
    }


app.include_router(parcels.router)
app.include_router(buildings.router)
app.include_router(floors.router)
app.include_router(units.router)
app.include_router(neighborhood.router)
app.include_router(spatial.router)