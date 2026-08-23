import type { Polygon } from "geojson";

const API_BASE_URL = "http://127.0.0.1:8000";

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

export interface Building {
  building_id: string;
  name: string | null;

  height_m: number | null;
  floor_count: number | null;

  source_type: string;
  source_name: string | null;
  verification_status: string;

  footprint: Polygon;
}

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