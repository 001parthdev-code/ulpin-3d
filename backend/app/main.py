# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse

from .routers import buildings, floors, parcels, units

app = FastAPI(
    title="3D ULPIN Spatial API",
    description="Spatial API for the 3D ULPIN vertical property mapping prototype.",
    version="0.1.0",
)

# Allow any origin (useful during development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=JSONResponse, tags=["System"]) 
def root():
    return {"message": "Welcome to the 3D ULPIN Spatial API"}

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