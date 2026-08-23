import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { FeatureCollection, Polygon } from "geojson";

import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import {
  getParcels,
  getParcelBuildings,
  type Parcel,
  type Building,
} from "./api";

function App() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);

  const [selectedParcel, setSelectedParcel] =
    useState<Parcel | null>(null);

  const [selectedBuilding, setSelectedBuilding] =
    useState<Building | null>(null);

  const [error, setError] = useState<string | null>(null);

  // =========================================================
  // LOAD PARCELS
  // =========================================================

  useEffect(() => {
    async function loadParcels() {
      try {
        const data = await getParcels();
        setParcels(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unknown API error"
        );
      }
    }

    loadParcels();
  }, []);

  // =========================================================
  // INITIALIZE MAPLIBRE
  // =========================================================

  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,

      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: {
              "background-color": "#111827",
            },
          },
        ],
      },

      center: [78.0322, 30.31655],
      zoom: 18,
      pitch: 0,
    });

    mapInstance.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // =========================================================
  // RENDER PARCELS
  // =========================================================

  useEffect(() => {
    const mapInstance = map.current;

    if (!mapInstance || parcels.length === 0) {
      return;
    }

    const addParcelLayers = () => {
      if (mapInstance.getSource("parcels")) {
        return;
      }

      const geojson: FeatureCollection<Polygon> = {
        type: "FeatureCollection",

        features: parcels.map((parcel) => ({
          type: "Feature",

          properties: {
            parcel_id: parcel.parcel_id,
          },

          geometry: parcel.geometry,
        })),
      };

      mapInstance.addSource("parcels", {
        type: "geojson",
        data: geojson,
      });

      mapInstance.addLayer({
        id: "parcel-fill",
        type: "fill",
        source: "parcels",

        paint: {
          "fill-color": "#2563eb",
          "fill-opacity": 0.35,
        },
      });

      mapInstance.addLayer({
        id: "parcel-outline",
        type: "line",
        source: "parcels",

        paint: {
          "line-color": "#60a5fa",
          "line-width": 2,
        },
      });

      mapInstance.on(
        "click",
        "parcel-fill",
        async (event) => {
          const feature = event.features?.[0];

          if (!feature) {
            return;
          }

          const parcelId =
            feature.properties?.parcel_id;

          const parcel = parcels.find(
            (candidate) =>
              candidate.parcel_id === parcelId
          );

          if (!parcel) {
            return;
          }

          setSelectedParcel(parcel);
          setSelectedBuilding(null);

          try {
            const buildingData =
              await getParcelBuildings(
                parcel.parcel_id
              );

            setBuildings(buildingData);
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to load buildings"
            );
          }
        }
      );

      mapInstance.on(
        "mouseenter",
        "parcel-fill",
        () => {
          mapInstance.getCanvas().style.cursor =
            "pointer";
        }
      );

      mapInstance.on(
        "mouseleave",
        "parcel-fill",
        () => {
          mapInstance.getCanvas().style.cursor = "";
        }
      );
    };

    if (mapInstance.loaded()) {
      addParcelLayers();
    } else {
      mapInstance.once("load", addParcelLayers);
    }
  }, [parcels]);

  // =========================================================
  // RENDER BUILDINGS
  // =========================================================

  useEffect(() => {
    const mapInstance = map.current;

    if (!mapInstance || buildings.length === 0) {
      return;
    }

    const geojson: FeatureCollection<Polygon> = {
      type: "FeatureCollection",

      features: buildings.map((building) => ({
        type: "Feature",

        properties: {
          building_id: building.building_id,
        },

        geometry: building.footprint,
      })),
    };

    const existingSource =
      mapInstance.getSource("buildings");

    if (existingSource) {
      (
        existingSource as maplibregl.GeoJSONSource
      ).setData(geojson);

      return;
    }

    mapInstance.addSource("buildings", {
      type: "geojson",
      data: geojson,
    });

    mapInstance.addLayer({
      id: "building-fill",
      type: "fill",
      source: "buildings",

      paint: {
        "fill-color": "#f59e0b",
        "fill-opacity": 0.82,
      },
    });

    mapInstance.addLayer({
      id: "building-outline",
      type: "line",
      source: "buildings",

      paint: {
        "line-color": "#fef3c7",
        "line-width": 2,
      },
    });

    mapInstance.on(
      "click",
      "building-fill",
      (event) => {
        const feature = event.features?.[0];

        if (!feature) {
          return;
        }

        const buildingId =
          feature.properties?.building_id;

        const building = buildings.find(
          (candidate) =>
            candidate.building_id === buildingId
        );

        if (!building) {
          return;
        }

        setSelectedBuilding(building);
      }
    );

    mapInstance.on(
      "mouseenter",
      "building-fill",
      () => {
        mapInstance.getCanvas().style.cursor =
          "pointer";
      }
    );

    mapInstance.on(
      "mouseleave",
      "building-fill",
      () => {
        mapInstance.getCanvas().style.cursor = "";
      }
    );
  }, [buildings]);

  // =========================================================
  // ERROR STATE
  // =========================================================

  if (error) {
    return (
      <main className="error-screen">
        <h1>Spatial API unavailable</h1>
        <p>{error}</p>
      </main>
    );
  }

  // =========================================================
  // APPLICATION UI
  // =========================================================

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>3D ULPIN</h1>

          <p>
            Vertical Property Mapping Prototype
          </p>
        </div>

        <div className="status">
          Spatial API
          <span />
          Connected
        </div>
      </header>

      <section className="workspace">
        <div
          ref={mapContainer}
          className="map"
        />

        <aside className="panel">
          <h2>Property Explorer</h2>

          {!selectedParcel && (
            <div className="empty-state">
              <p>
                Select a parcel on the map.
              </p>

              <small>
                Loaded parcels: {parcels.length}
              </small>
            </div>
          )}

          {selectedParcel && (
            <>
              <div className="property">
                <span className="entity-type parcel-type">
                  PARCEL
                </span>

                <h3>
                  {selectedParcel.parcel_id}
                </h3>

                <dl>
                  <dt>Name</dt>

                  <dd>
                    {selectedParcel.name ?? "—"}
                  </dd>

                  <dt>Official ULPIN</dt>

                  <dd>
                    {selectedParcel.official_ulpin ??
                      "Not available"}
                  </dd>

                  <dt>Source</dt>

                  <dd>
                    {selectedParcel.source_type}
                  </dd>

                  <dt>Verification</dt>

                  <dd>
                    {
                      selectedParcel.verification_status
                    }
                  </dd>
                </dl>

                {selectedParcel.source_type ===
                  "synthetic" && (
                  <div className="synthetic-warning">
                    Synthetic demonstration data
                  </div>
                )}
              </div>

              <div className="hierarchy">
                <div className="hierarchy-header">
                  <h3>Buildings</h3>

                  <span>
                    {buildings.length}
                  </span>
                </div>

                {buildings.length === 0 && (
                  <p className="hierarchy-empty">
                    No buildings loaded.
                  </p>
                )}

                {buildings.map((building) => (
                  <button
                    key={building.building_id}
                    type="button"
                    className={
                      selectedBuilding?.building_id ===
                      building.building_id
                        ? "entity-button entity-button-selected"
                        : "entity-button"
                    }
                    onClick={() =>
                      setSelectedBuilding(building)
                    }
                  >
                    <div className="entity-button-main">
                      <span className="building-icon">
                        B
                      </span>

                      <div>
                        <strong>
                          {building.building_id}
                        </strong>

                        <small>
                          {building.name ??
                            "Unnamed building"}
                        </small>
                      </div>
                    </div>

                    <span className="floor-count">
                      {building.floor_count ?? "?"} floors
                    </span>
                  </button>
                ))}
              </div>

              {selectedBuilding && (
                <div className="property building-property">
                  <span className="entity-type building-type">
                    BUILDING
                  </span>

                  <h3>
                    {selectedBuilding.building_id}
                  </h3>

                  <dl>
                    <dt>Name</dt>

                    <dd>
                      {selectedBuilding.name ?? "—"}
                    </dd>

                    <dt>Height</dt>

                    <dd>
                      {selectedBuilding.height_m !==
                      null
                        ? `${selectedBuilding.height_m} m`
                        : "Unknown"}
                    </dd>

                    <dt>Floors</dt>

                    <dd>
                      {selectedBuilding.floor_count ??
                        "Unknown"}
                    </dd>

                    <dt>Source</dt>

                    <dd>
                      {selectedBuilding.source_type}
                    </dd>

                    <dt>Verification</dt>

                    <dd>
                      {
                        selectedBuilding.verification_status
                      }
                    </dd>
                  </dl>

                  {selectedBuilding.source_type ===
                    "synthetic" && (
                    <div className="synthetic-warning">
                      Synthetic demonstration data
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;