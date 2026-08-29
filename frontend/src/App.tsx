import { useEffect, useState } from "react";

import type {
  FeatureCollection,
  Geometry,
  Polygon,
} from "geojson";

import "./App.css";

import MapViewer from "./components/MapViewer";

import {
  getBuildingFloors,
  getFloorUnits,
  getNeighborhoodBuildings,
  getNeighborhoodParks,
  getNeighborhoodRoads,
  getNeighborhoodSummary,
  getNeighborhoodWater,
  getParcelBuildings,
  getParcels,
  type Building,
  type Floor,
  type NeighborhoodBuildingProperties,
  type NeighborhoodSummary,
  type Parcel,
  type ParkProperties,
  type RoadProperties,
  type Unit,
  type WaterProperties,
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
  // =========================================================
  // VIEW + SELECTION
  // =========================================================

  const [viewMode, setViewMode] =
    useState<ViewMode>("2d");

  const [selection, setSelection] =
    useState<SpatialSelection>(
      EMPTY_SELECTION
    );

  // =========================================================
  // DETAILED PROPERTY DATA
  // =========================================================

  const [parcels, setParcels] =
    useState<Parcel[]>([]);

  const [buildings, setBuildings] =
    useState<Building[]>([]);

  const [floors, setFloors] =
    useState<Floor[]>([]);

  const [units, setUnits] =
    useState<Unit[]>([]);

  // =========================================================
  // REAL OSM NEIGHBORHOOD DATA
  // =========================================================

  const [
    neighborhoodBuildings,
    setNeighborhoodBuildings,
  ] = useState<
    FeatureCollection<
      Polygon,
      NeighborhoodBuildingProperties
    > | null
  >(null);

  const [roads, setRoads] =
    useState<
      FeatureCollection<
        Geometry,
        RoadProperties
      > | null
    >(null);

  const [parks, setParks] =
    useState<
      FeatureCollection<
        Geometry,
        ParkProperties
      > | null
    >(null);

  const [water, setWater] =
    useState<
      FeatureCollection<
        Geometry,
        WaterProperties
      > | null
    >(null);

  const [
    neighborhoodSummary,
    setNeighborhoodSummary,
  ] =
    useState<NeighborhoodSummary | null>(
      null
    );

  // =========================================================
  // UI STATE
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // =========================================================
  // INITIAL APPLICATION LOAD
  //
  // Load both:
  //
  // 1. Detailed prototype property data
  // 2. Real OSM neighborhood context
  //
  // in parallel.
  // =========================================================

  useEffect(() => {
    async function loadApplication() {
      try {
        setLoading(true);
        setError(null);

        const [
          parcelData,
          osmBuildings,
          roadData,
          parkData,
          waterData,
          summaryData,
        ] = await Promise.all([
          getParcels(),
          getNeighborhoodBuildings(),
          getNeighborhoodRoads(),
          getNeighborhoodParks(),
          getNeighborhoodWater(),
          getNeighborhoodSummary(),
        ]);

        setParcels(parcelData);

        setNeighborhoodBuildings(
          osmBuildings
        );

        setRoads(roadData);
        setParks(parkData);
        setWater(waterData);

        setNeighborhoodSummary(
          summaryData
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load application"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadApplication();
  }, []);

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

      setBuildings(
        buildingData
      );
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

      setSelection(
        (current) => ({
          ...current,

          building,

          floor: null,
          unit: null,
        })
      );

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

      setSelection(
        (current) => ({
          ...current,

          floor,

          unit: null,
        })
      );

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

  function selectUnit(
    unit: Unit
  ) {
    setSelection(
      (current) => ({
        ...current,
        unit,
      })
    );
  }

  // =========================================================
  // VIEW MODE
  // =========================================================

  function open2D() {
    setViewMode("2d");
  }

  function open3D() {
    setViewMode("3d");
  }

  // =========================================================
  // INITIAL FAILURE
  // =========================================================

  if (
    error &&
    !neighborhoodBuildings &&
    parcels.length === 0
  ) {
    return (
      <main className="error-screen">
        <h1>
          Spatial application unavailable
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
          <h1>
            3D ULPIN
          </h1>

          <p>
            Vertical Property Mapping
            Prototype
          </p>
        </div>

        <div className="header-actions">
          {neighborhoodSummary && (
            <div className="neighborhood-stats">
              <span>
                {
                  neighborhoodSummary.buildings
                }{" "}
                buildings
              </span>

              <span>
                {
                  neighborhoodSummary.roads
                }{" "}
                roads
              </span>

              <span>
                {
                  neighborhoodSummary.parks
                }{" "}
                green areas
              </span>
            </div>
          )}

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
            >
              3D Neighborhood
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
          <MapViewer
            viewMode={viewMode}
            parcels={parcels}
            buildings={buildings}
            floors={floors}
            units={units}
            neighborhoodBuildings={
              neighborhoodBuildings
            }
            roads={roads}
            parks={parks}
            water={water}
            onParcelSelect={
              selectParcel
            }
            onBuildingSelect={
              selectBuilding
            }
          />

          <div className="osm-attribution">
            © OpenStreetMap contributors
          </div>
        </div>

        <aside className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                Property Explorer
              </h2>

              <p>
                Neighborhood and vertical
                property hierarchy
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

          {neighborhoodSummary && (
            <section className="neighborhood-card">
              <span className="entity-type neighborhood-type">
                REAL OSM NEIGHBORHOOD
              </span>

              <div className="neighborhood-grid">
                <div>
                  <strong>
                    {
                      neighborhoodSummary.buildings
                    }
                  </strong>

                  <span>
                    Buildings
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      neighborhoodSummary.roads
                    }
                  </strong>

                  <span>
                    Roads
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      neighborhoodSummary.parks
                    }
                  </strong>

                  <span>
                    Green
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      neighborhoodSummary.water_features
                    }
                  </strong>

                  <span>
                    Water
                  </span>
                </div>
              </div>

              <div className="osm-source">
                Source: OpenStreetMap
              </div>
            </section>
          )}

          {!selection.parcel && (
            <div className="empty-state">
              <p>
                Explore the real neighborhood
                or select the detailed parcel.
              </p>

              <small>
                Detailed vertical property:
                P001
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

                  <dt>
                    Source
                  </dt>

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
                    Synthetic detailed
                    demonstration property
                  </div>
                )}
              </section>

              <section className="hierarchy-section">
                <div className="section-heading">
                  <span>
                    Buildings
                  </span>

                  <strong>
                    {
                      buildings.length
                    }
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
                      <dt>
                        ID
                      </dt>

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
                        {
                          units.length
                        }
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
                    <dt>
                      ID
                    </dt>

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