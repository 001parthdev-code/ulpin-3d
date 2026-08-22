import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { FeatureCollection, Polygon } from "geojson";

import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import { getParcels, type Parcel } from "./api";

function App() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] =
    useState<Parcel | null>(null);

  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------
  // Load parcels from FastAPI
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // Initialize MapLibre
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // Add parcel GeoJSON to MapLibre
  // ---------------------------------------------------------

  useEffect(() => {
    const mapInstance = map.current;

    if (!mapInstance || parcels.length === 0) {
      return;
    }

    const addParcelLayer = () => {
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

      // Parcel fill
      mapInstance.addLayer({
        id: "parcel-fill",
        type: "fill",
        source: "parcels",

        paint: {
          "fill-color": "#2563eb",
          "fill-opacity": 0.45,
        },
      });

      // Parcel boundary
      mapInstance.addLayer({
        id: "parcel-outline",
        type: "line",
        source: "parcels",

        paint: {
          "line-color": "#ffffff",
          "line-width": 2,
        },
      });

      // Parcel selection
      mapInstance.on(
        "click",
        "parcel-fill",
        (event) => {
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
        }
      );

      // Cursor feedback
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
      addParcelLayer();
    } else {
      mapInstance.once("load", addParcelLayer);
    }
  }, [parcels]);

  // ---------------------------------------------------------
  // API error state
  // ---------------------------------------------------------

  if (error) {
    return (
      <main className="error-screen">
        <h1>Spatial API unavailable</h1>
        <p>{error}</p>
      </main>
    );
  }

  // ---------------------------------------------------------
  // Application
  // ---------------------------------------------------------

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
              <p>Select a parcel on the map.</p>

              <small>
                Loaded parcels: {parcels.length}
              </small>
            </div>
          )}

          {selectedParcel && (
            <div className="property">
              <span className="entity-type">
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
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;