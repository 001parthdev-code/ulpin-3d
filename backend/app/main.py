from fastapi import FastAPI

from .routers import buildings, floors, parcels, units


app = FastAPI(
    title="3D ULPIN Spatial API",
    description="Spatial API for the 3D ULPIN vertical property mapping prototype.",
    version="0.1.0",
)


@app.get("/health", tags=["System"])
def health():
    return {
        "status": "ok",
        "service": "3D ULPIN Spatial API",
        "version": "0.1.0",
    }


app.include_router(parcels.router)
app.include_router(buildings.router)
app.include_router(floors.router)
app.include_router(units.router)