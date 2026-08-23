import type { Point, Polygon } from "geojson";

const API_BASE_URL = "http://127.0.0.1:8000";

// ============================================================
// PARCEL
// ============================================================

export interface Parcel {
  parcel_id: string;
  official_ulpin: string | null;
  name: string | null;

  source_type: string;
  source_name: string | null;
  derivation_method?: string | null;
  verification_status: string;

  geometry: Polygon;
}

// ============================================================
// BUILDING
// ============================================================

export interface Building {
  building_id: string;
  name: string | null;

  height_m: number | null;
  floor_count: number | null;

  source_type: string;
  source_name: string | null;
  derivation_method?: string | null;
  verification_status: string;

  footprint: Polygon;
}

// ============================================================
// FLOOR
// ============================================================

export interface Floor {
  floor_id: string;
  floor_number: number;

  z_min_m: number;
  z_max_m: number;

  source_type: string;
  derivation_method: string | null;
  verification_status: string;

  footprint: Polygon;
}

// ============================================================
// UNIT
// ============================================================

export interface Unit {
  unit_id: string;
  unit_number: string;

  z_min_m: number;
  z_max_m: number;

  source_type: string;
  derivation_method: string | null;
  verification_status: string;

  footprint: Polygon;
  entrance: Point | null;
}

// ============================================================
// PARCEL API
// ============================================================

export async function getParcels(): Promise<Parcel[]> {
  const response = await fetch(
    `${API_BASE_URL}/parcels`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load parcels: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================
// BUILDING API
// ============================================================

export async function getParcelBuildings(
  parcelId: string
): Promise<Building[]> {
  const response = await fetch(
    `${API_BASE_URL}/parcels/${parcelId}/buildings`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load buildings: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================
// FLOOR API
// ============================================================

export async function getBuildingFloors(
  buildingId: string
): Promise<Floor[]> {
  const response = await fetch(
    `${API_BASE_URL}/buildings/${buildingId}/floors`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load floors: ${response.status}`
    );
  }

  return response.json();
}

// ============================================================
// UNIT API
// ============================================================

export async function getFloorUnits(
  floorId: string
): Promise<Unit[]> {
  const response = await fetch(
    `${API_BASE_URL}/floors/${floorId}/units`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load units: ${response.status}`
    );
  }

  return response.json();
}