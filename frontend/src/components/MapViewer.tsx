import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { Building, Floor, Parcel, Unit } from "../api";

type ViewMode = "2d" | "3d";

interface Props {
  viewMode: ViewMode;
  parcels: Parcel[];
  buildings: Building[];
  floors: Floor[];
  units: Unit[];
  selectedParcel: Parcel | null;
  selectedBuilding: Building | null;
  onSelectParcel: (parcel: Parcel) => void | Promise<void>;
  onSelectBuilding: (building: Building) => void | Promise<void>;
}

const collection = (features: Feature[]): FeatureCollection => ({ type: "FeatureCollection", features });

function polygonFeature(geometry: Polygon, properties: Record<string, unknown>): Feature<Polygon> {
  return { type: "Feature", geometry, properties };
}

export default function MapViewer({
  viewMode, parcels, buildings, floors, units, selectedParcel, selectedBuilding,
  onSelectParcel, onSelectBuilding,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dataRef = useRef({ parcels, buildings });
  dataRef.current = { parcels, buildings };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#111827" } }] },
      center: [78.0322, 30.31655],
      zoom: 17,
      pitch: 0,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.on("load", () => {
      for (const id of ["parcels", "buildings", "floors", "units"]) map.addSource(id, { type: "geojson", data: collection([]) });
      map.addLayer({ id: "parcels-fill", type: "fill", source: "parcels", paint: { "fill-color": "#22c55e", "fill-opacity": 0.18 } });
      map.addLayer({ id: "parcels-line", type: "line", source: "parcels", paint: { "line-color": "#4ade80", "line-width": 3 } });
      map.addLayer({ id: "buildings-fill", type: "fill", source: "buildings", paint: { "fill-color": "#f59e0b", "fill-opacity": 0.38 } });
      map.addLayer({ id: "buildings-line", type: "line", source: "buildings", paint: { "line-color": "#fbbf24", "line-width": 2 } });
      map.addLayer({ id: "floors-3d", type: "fill-extrusion", source: "floors", layout: { visibility: "none" }, paint: { "fill-extrusion-color": "#3b82f6", "fill-extrusion-base": ["get", "zMin"], "fill-extrusion-height": ["get", "zMax"], "fill-extrusion-opacity": 0.72 } });
      map.addLayer({ id: "units-3d", type: "fill-extrusion", source: "units", layout: { visibility: "none" }, paint: { "fill-extrusion-color": "#a78bfa", "fill-extrusion-base": ["get", "zMin"], "fill-extrusion-height": ["get", "zMax"], "fill-extrusion-opacity": 0.5 } });
      map.on("click", "parcels-fill", (event) => {
        const id = event.features?.[0]?.properties?.parcel_id;
        const parcel = dataRef.current.parcels.find((item) => item.parcel_id === id);
        if (parcel) void onSelectParcel(parcel);
      });
      map.on("click", "buildings-fill", (event) => {
        const id = event.features?.[0]?.properties?.building_id;
        const building = dataRef.current.buildings.find((item) => item.building_id === id);
        if (building) void onSelectBuilding(building);
      });
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [onSelectBuilding, onSelectParcel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    (map.getSource("parcels") as GeoJSONSource)?.setData(collection(parcels.map((p) => polygonFeature(p.geometry, { parcel_id: p.parcel_id }))));
    (map.getSource("buildings") as GeoJSONSource)?.setData(collection(buildings.map((b) => polygonFeature(b.footprint, { building_id: b.building_id }))));
    (map.getSource("floors") as GeoJSONSource)?.setData(collection(floors.map((f) => polygonFeature(f.footprint, { floor_id: f.floor_id, zMin: f.z_min_m, zMax: f.z_max_m }))));
    (map.getSource("units") as GeoJSONSource)?.setData(collection(units.map((u) => polygonFeature(u.footprint, { unit_id: u.unit_id, zMin: u.z_min_m, zMax: u.z_max_m }))));
  }, [parcels, buildings, floors, units]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const is3d = viewMode === "3d";
    map.setLayoutProperty("floors-3d", "visibility", is3d ? "visible" : "none");
    map.setLayoutProperty("units-3d", "visibility", is3d ? "visible" : "none");
    map.easeTo({ pitch: is3d ? 60 : 0, bearing: is3d ? -25 : 0, duration: 500 });
  }, [viewMode]);

  useEffect(() => {
    const geometry = selectedBuilding?.footprint ?? selectedParcel?.geometry;
    const map = mapRef.current;
    if (!map || !geometry) return;
    const ring = geometry.coordinates[0];
    if (!ring?.length) return;
    const bounds = ring.reduce((b, point) => b.extend(point as [number, number]), new maplibregl.LngLatBounds(ring[0] as [number, number], ring[0] as [number, number]));
    map.fitBounds(bounds, { padding: 90, maxZoom: 19, duration: 600 });
  }, [selectedParcel, selectedBuilding]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} aria-label="ULPIN spatial map" />;
}
