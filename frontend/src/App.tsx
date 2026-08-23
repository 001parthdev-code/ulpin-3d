import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { FeatureCollection, Polygon } from "geojson";

import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import CesiumViewer from "./CesiumViewer";

import {
  getBuildingFloors,
  getFloorUnits,
  getParcelBuildings,
  getParcels,
  type Building,
  type Floor,
  type Parcel,
  type Unit,
} from "./api";

type ViewMode = "2d" | "3d";

interface SpatialSelection {
  parcel: Parcel | null;
  building: Building | null;
  floor: Floor | null;
  unit: Unit | null;
}

const EMPTY_SELECTION: SpatialSelection = {
  parcel: null,
  building: null,
  floor: null,
  unit: null,
};

function App() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);

  const [viewMode, setViewMode] =
    useState<ViewMode>("2d");

  const [selection, setSelection] =
    useState<SpatialSelection>(EMPTY_SELECTION);

  const [parcels, setParcels] =
    useState<Parcel[]>([]);

  const [buildings, setBuildings] =
    useState<Building[]>([]);

  const [floors, setFloors] =
    useState<Floor[]>([]);

  const [units, setUnits] =
    useState<Unit[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // =========================================================
  // LOAD PARCELS
  // =========================================================

  useEffect(() => {
    async function loadParcels() {
      try {
        setError(null);

        const data = await getParcels();

        setParcels(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load parcels"
        );
      }
    }

    loadParcels();
  }, []);

  // =========================================================
  // INITIALIZE MAPLIBRE ONCE
  // =========================================================

  useEffect(() => {
    if (
      !mapContainer.current ||
      map.current
    ) {
      return;
    }

    const mapInstance =
      new maplibregl.Map({
        container: mapContainer.current,

        style: {
          version: 8,
          sources: {},

          layers: [
            {
              id: "background",
              type: "background",

              paint: {
                "background-color":
                  "#111827",
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
  // RESIZE MAP WHEN RETURNING TO 2D
  // =========================================================

  useEffect(() => {
    if (viewMode !== "2d") {
      return;
    }

    const mapInstance = map.current;

    if (!mapInstance) {
      return;
    }

    requestAnimationFrame(() => {
      mapInstance.resize();
    });
  }, [viewMode]);

  // =========================================================
  // PARCEL SELECTION
  // =========================================================

  async function selectParcel(
    parcel: Parcel
  ) {
    try {
      setLoading(true);
      setError(null);

      setSelection({
        parcel,
        building: null,
        floor: null,
        unit: null,
      });

      setBuildings([]);
      setFloors([]);
      setUnits([]);

      const buildingData =
        await getParcelBuildings(
          parcel.parcel_id
        );

      setBuildings(buildingData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load parcel"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // BUILDING SELECTION
  // =========================================================

  async function selectBuilding(
    building: Building
  ) {
    try {
      setLoading(true);
      setError(null);

      setSelection((current) => ({
        ...current,
        building,
        floor: null,
        unit: null,
      }));

      setFloors([]);
      setUnits([]);

      const floorData =
        await getBuildingFloors(
          building.building_id
        );

      setFloors(floorData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load building"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // FLOOR SELECTION
  // =========================================================

  async function selectFloor(
    floor: Floor
  ) {
    try {
      setLoading(true);
      setError(null);

      setSelection((current) => ({
        ...current,
        floor,
        unit: null,
      }));

      setUnits([]);

      const unitData =
        await getFloorUnits(
          floor.floor_id
        );

      setUnits(unitData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load floor"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // UNIT SELECTION
  // =========================================================

  function selectUnit(unit: Unit) {
    setSelection((current) => ({
      ...current,
      unit,
    }));
  }

  // =========================================================
  // RENDER PARCELS
  // =========================================================

  useEffect(() => {
    const mapInstance = map.current;

    if (
      !mapInstance ||
      parcels.length === 0
    ) {
      return;
    }

    const addParcelLayers = () => {
      if (
        mapInstance.getSource("parcels")
      ) {
        return;
      }

      const geojson:
        FeatureCollection<Polygon> = {
          type: "FeatureCollection",

          features: parcels.map(
            (parcel) => ({
              type: "Feature",

              properties: {
                parcel_id:
                  parcel.parcel_id,
              },

              geometry:
                parcel.geometry,
            })
          ),
        };

      mapInstance.addSource(
        "parcels",
        {
          type: "geojson",
          data: geojson,
        }
      );

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
        (event) => {
          const feature =
            event.features?.[0];

          if (!feature) {
            return;
          }

          const parcelId =
            feature.properties
              ?.parcel_id;

          const parcel =
            parcels.find(
              (candidate) =>
                candidate.parcel_id ===
                parcelId
            );

          if (parcel) {
            void selectParcel(parcel);
          }
        }
      );

      mapInstance.on(
        "mouseenter",
        "parcel-fill",
        () => {
          mapInstance.getCanvas()
            .style.cursor = "pointer";
        }
      );

      mapInstance.on(
        "mouseleave",
        "parcel-fill",
        () => {
          mapInstance.getCanvas()
            .style.cursor = "";
        }
      );
    };

    if (mapInstance.loaded()) {
      addParcelLayers();
    } else {
      mapInstance.once(
        "load",
        addParcelLayers
      );
    }
  }, [parcels]);

  // =========================================================
  // RENDER BUILDINGS
  // =========================================================

  useEffect(() => {
    const mapInstance = map.current;

    if (
      !mapInstance ||
      buildings.length === 0
    ) {
      return;
    }

    const geojson:
      FeatureCollection<Polygon> = {
        type: "FeatureCollection",

        features: buildings.map(
          (building) => ({
            type: "Feature",

            properties: {
              building_id:
                building.building_id,
            },

            geometry:
              building.footprint,
          })
        ),
      };

    const existingSource =
      mapInstance.getSource(
        "buildings"
      );

    if (existingSource) {
      (
        existingSource as
          maplibregl.GeoJSONSource
      ).setData(geojson);

      return;
    }

    mapInstance.addSource(
      "buildings",
      {
        type: "geojson",
        data: geojson,
      }
    );

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
        const feature =
          event.features?.[0];

        if (!feature) {
          return;
        }

        const buildingId =
          feature.properties
            ?.building_id;

        const building =
          buildings.find(
            (candidate) =>
              candidate.building_id ===
              buildingId
          );

        if (building) {
          void selectBuilding(
            building
          );
        }
      }
    );

    mapInstance.on(
      "mouseenter",
      "building-fill",
      () => {
        mapInstance.getCanvas()
          .style.cursor = "pointer";
      }
    );

    mapInstance.on(
      "mouseleave",
      "building-fill",
      () => {
        mapInstance.getCanvas()
          .style.cursor = "";
      }
    );
  }, [buildings]);

  // =========================================================
  // VIEW MODE
  // =========================================================

  function open3D() {
    if (!selection.building) {
      return;
    }

    setViewMode("3d");
  }

  function open2D() {
    setViewMode("2d");
  }

  // =========================================================
  // INITIAL ERROR
  // =========================================================

  if (
    error &&
    parcels.length === 0
  ) {
    return (
      <main className="error-screen">
        <h1>
          Spatial API unavailable
        </h1>

        <p>{error}</p>
      </main>
    );
  }

  // =========================================================
  // APPLICATION
  // =========================================================

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          <h1>3D ULPIN</h1>

          <p>
            Vertical Property Mapping
            Prototype
          </p>
        </div>

        <div className="header-actions">
          <div className="view-switcher">
            <button
              type="button"
              className={
                viewMode === "2d"
                  ? "view-button active"
                  : "view-button"
              }
              onClick={open2D}
            >
              2D Map
            </button>

            <button
              type="button"
              className={
                viewMode === "3d"
                  ? "view-button active"
                  : "view-button"
              }
              onClick={open3D}
              disabled={
                !selection.building
              }
            >
              3D Property
            </button>
          </div>

          <div className="status">
            Spatial API
            <span />
            Connected
          </div>
        </div>
      </header>

      <section className="workspace">
        <div className="viewer">
          <div
            ref={mapContainer}
            className={
              viewMode === "2d"
                ? "map viewer-layer active-viewer"
                : "map viewer-layer hidden-viewer"
            }
          />

          <div
            className={
              viewMode === "3d"
                ? "viewer-layer active-viewer"
                : "viewer-layer hidden-viewer"
            }
          >
            <CesiumViewer
              visible={viewMode === "3d"}
              building={selection.building}
              floors = {floors}
              units={units}
              selectedFloor={selection.floor}
              selectedUnit={selection.unit}
            />
          </div>
        </div>

        <aside className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                Property Explorer
              </h2>

              <p>
                Spatial hierarchy and
                metadata
              </p>
            </div>

            {loading && (
              <span className="loading-badge">
                Loading
              </span>
            )}
          </div>

          {error && (
            <div className="inline-error">
              {error}
            </div>
          )}

          {!selection.parcel && (
            <div className="empty-state">
              <p>
                Select a parcel on
                the map.
              </p>

              <small>
                Loaded parcels:{" "}
                {parcels.length}
              </small>
            </div>
          )}

          {selection.parcel && (
            <div className="explorer">
              <section className="entity-card">
                <span className="entity-type parcel-type">
                  PARCEL
                </span>

                <h3>
                  {
                    selection.parcel
                      .parcel_id
                  }
                </h3>

                <dl>
                  <dt>Name</dt>

                  <dd>
                    {selection.parcel
                      .name ?? "—"}
                  </dd>

                  <dt>
                    Official ULPIN
                  </dt>

                  <dd>
                    {selection.parcel
                      .official_ulpin ??
                      "Not available"}
                  </dd>

                  <dt>Source</dt>

                  <dd>
                    {
                      selection.parcel
                        .source_type
                    }
                  </dd>

                  <dt>
                    Verification
                  </dt>

                  <dd>
                    {
                      selection.parcel
                        .verification_status
                    }
                  </dd>
                </dl>

                {selection.parcel
                  .source_type ===
                  "synthetic" && (
                  <div className="synthetic-warning">
                    Synthetic
                    demonstration data
                  </div>
                )}
              </section>

              <section className="hierarchy-section">
                <div className="section-heading">
                  <span>
                    Buildings
                  </span>

                  <strong>
                    {buildings.length}
                  </strong>
                </div>

                {buildings.map(
                  (building) => (
                    <button
                      key={
                        building.building_id
                      }
                      type="button"
                      className={
                        selection
                          .building
                          ?.building_id ===
                        building.building_id
                          ? "hierarchy-item selected building-item"
                          : "hierarchy-item building-item"
                      }
                      onClick={() =>
                        void selectBuilding(
                          building
                        )
                      }
                    >
                      <div>
                        <strong>
                          {
                            building.building_id
                          }
                        </strong>

                        <small>
                          {building.name ??
                            "Unnamed building"}
                        </small>
                      </div>

                      <span>
                        {building.floor_count ??
                          "?"}
                        F
                      </span>
                    </button>
                  )
                )}
              </section>

              {selection.building && (
                <>
                  <section className="entity-card nested-card">
                    <div className="entity-card-header">
                      <div>
                        <span className="entity-type building-type">
                          BUILDING
                        </span>

                        <h3>
                          {
                            selection
                              .building
                              .building_id
                          }
                        </h3>
                      </div>

                      <button
                        type="button"
                        className="open-3d-button"
                        onClick={
                          open3D
                        }
                      >
                        Open 3D
                      </button>
                    </div>

                    <dl>
                      <dt>
                        Height
                      </dt>

                      <dd>
                        {selection
                          .building
                          .height_m !==
                        null
                          ? `${selection.building.height_m} m`
                          : "Unknown"}
                      </dd>

                      <dt>
                        Floors
                      </dt>

                      <dd>
                        {selection
                          .building
                          .floor_count ??
                          "Unknown"}
                      </dd>

                      <dt>
                        Source
                      </dt>

                      <dd>
                        {
                          selection
                            .building
                            .source_type
                        }
                      </dd>

                      <dt>
                        Verification
                      </dt>

                      <dd>
                        {
                          selection
                            .building
                            .verification_status
                        }
                      </dd>
                    </dl>
                  </section>

                  <section className="hierarchy-section">
                    <div className="section-heading">
                      <span>
                        Floors
                      </span>

                      <strong>
                        {
                          floors.length
                        }
                      </strong>
                    </div>

                    {floors.map(
                      (floor) => (
                        <button
                          key={
                            floor.floor_id
                          }
                          type="button"
                          className={
                            selection
                              .floor
                              ?.floor_id ===
                            floor.floor_id
                              ? "hierarchy-item selected floor-item"
                              : "hierarchy-item floor-item"
                          }
                          onClick={() =>
                            void selectFloor(
                              floor
                            )
                          }
                        >
                          <div>
                            <strong>
                              Floor{" "}
                              {
                                floor.floor_number
                              }
                            </strong>

                            <small>
                              {
                                floor.floor_id
                              }
                            </small>
                          </div>

                          <span>
                            {
                              floor.z_min_m
                            }
                            –
                            {
                              floor.z_max_m
                            }{" "}
                            m
                          </span>
                        </button>
                      )
                    )}
                  </section>
                </>
              )}

              {selection.floor && (
                <>
                  <section className="entity-card nested-card">
                    <span className="entity-type floor-type">
                      FLOOR
                    </span>

                    <h3>
                      Floor{" "}
                      {
                        selection.floor
                          .floor_number
                      }
                    </h3>

                    <dl>
                      <dt>ID</dt>

                      <dd>
                        {
                          selection.floor
                            .floor_id
                        }
                      </dd>

                      <dt>
                        Vertical range
                      </dt>

                      <dd>
                        {
                          selection.floor
                            .z_min_m
                        }
                        –
                        {
                          selection.floor
                            .z_max_m
                        }{" "}
                        m
                      </dd>

                      <dt>
                        Source
                      </dt>

                      <dd>
                        {
                          selection.floor
                            .source_type
                        }
                      </dd>

                      <dt>
                        Verification
                      </dt>

                      <dd>
                        {
                          selection.floor
                            .verification_status
                        }
                      </dd>
                    </dl>
                  </section>

                  <section className="hierarchy-section">
                    <div className="section-heading">
                      <span>
                        Units
                      </span>

                      <strong>
                        {units.length}
                      </strong>
                    </div>

                    {units.map(
                      (unit) => (
                        <button
                          key={
                            unit.unit_id
                          }
                          type="button"
                          className={
                            selection
                              .unit
                              ?.unit_id ===
                            unit.unit_id
                              ? "hierarchy-item selected unit-item"
                              : "hierarchy-item unit-item"
                          }
                          onClick={() =>
                            selectUnit(
                              unit
                            )
                          }
                        >
                          <div>
                            <strong>
                              Unit{" "}
                              {
                                unit.unit_number
                              }
                            </strong>

                            <small>
                              {
                                unit.unit_id
                              }
                            </small>
                          </div>

                          <span>
                            {
                              unit.z_min_m
                            }
                            –
                            {
                              unit.z_max_m
                            }{" "}
                            m
                          </span>
                        </button>
                      )
                    )}
                  </section>
                </>
              )}

              {selection.unit && (
                <section className="entity-card nested-card unit-card">
                  <span className="entity-type unit-type">
                    UNIT
                  </span>

                  <h3>
                    Unit{" "}
                    {
                      selection.unit
                        .unit_number
                    }
                  </h3>

                  <dl>
                    <dt>ID</dt>

                    <dd>
                      {
                        selection.unit
                          .unit_id
                      }
                    </dd>

                    <dt>
                      Floor
                    </dt>

                    <dd>
                      {selection.floor
                        ?.floor_number ??
                        "—"}
                    </dd>

                    <dt>
                      Vertical range
                    </dt>

                    <dd>
                      {
                        selection.unit
                          .z_min_m
                      }
                      –
                      {
                        selection.unit
                          .z_max_m
                      }{" "}
                      m
                    </dd>

                    <dt>
                      Source
                    </dt>

                    <dd>
                      {
                        selection.unit
                          .source_type
                      }
                    </dd>

                    <dt>
                      Verification
                    </dt>

                    <dd>
                      {
                        selection.unit
                          .verification_status
                      }
                    </dd>

                    <dt>
                      Entrance
                    </dt>

                    <dd>
                      {selection.unit
                        .entrance
                        ? "Available"
                        : "Not available"}
                    </dd>
                  </dl>
                </section>
              )}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;