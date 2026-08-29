import type {
  FeatureCollection,
  Geometry,
  Point,
  Polygon,
} from "geojson";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8000";

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

export interface NeighborhoodBuildingProperties {
  building_id: string;
  name: string | null;
  building_type: string | null;
  height_m: number | null;
  levels: number | null;
  source_type: string;
  source_name: string;
}

export interface RoadProperties {
  road_id: string;
  name: string | null;
  highway_type: string | null;
  source_type: string;
  source_name: string;
}

export interface ParkProperties {
  park_id: string;
  name: string | null;
  feature_type: string | null;
  source_type: string;
  source_name: string;
}

export interface WaterProperties {
  water_id: string;
  name: string | null;
  feature_type: string | null;
  source_type: string;
  source_name: string;
}

export interface NeighborhoodSummary {
  buildings: number;
  roads: number;
  parks: number;
  water_features: number;
  buildings_with_height: number;
}

export async function getNeighborhoodBuildings(): Promise<
  FeatureCollection<Polygon, NeighborhoodBuildingProperties>
> {
  const response = await fetch(
    `${API_BASE_URL}/neighborhood/buildings`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load neighborhood buildings: ${response.status}`
    );
  }

  return response.json();
}

export async function getNeighborhoodRoads(): Promise<
  FeatureCollection<Geometry, RoadProperties>
> {
  const response = await fetch(
    `${API_BASE_URL}/neighborhood/roads`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load neighborhood roads: ${response.status}`
    );
  }

  return response.json();
}

export async function getNeighborhoodParks(): Promise<
  FeatureCollection<Geometry, ParkProperties>
> {
  const response = await fetch(
    `${API_BASE_URL}/neighborhood/parks`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load neighborhood parks: ${response.status}`
    );
  }

  return response.json();
}

export async function getNeighborhoodWater(): Promise<
  FeatureCollection<Geometry, WaterProperties>
> {
  const response = await fetch(
    `${API_BASE_URL}/neighborhood/water`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load neighborhood water: ${response.status}`
    );
  }

  return response.json();
}

export async function getNeighborhoodSummary(): Promise<
  NeighborhoodSummary
> {
  const response = await fetch(
    `${API_BASE_URL}/neighborhood/summary`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load neighborhood summary: ${response.status}`
    );
  }

  return response.json();
}