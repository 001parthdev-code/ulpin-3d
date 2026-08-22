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

export async function getParcels(): Promise<Parcel[]> {
  const response = await fetch(`${API_BASE_URL}/parcels`);

  if (!response.ok) {
    throw new Error(
      `Failed to load parcels: ${response.status}`
    );
  }

  return response.json();
}