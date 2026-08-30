import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

const RAHEJA_TOWER_ID =
  "OSM-WAY-353159496";

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

  const [
    selectedOsmBuilding,
    setSelectedOsmBuilding,
  ] = useState<
    NeighborhoodBuildingProperties | null
  >(null);

  const [
    focusedBuildingId,
    setFocusedBuildingId,
  ] = useState<string | null>(null);

  const [
    verticalBuildingId,
    setVerticalBuildingId,
  ] = useState<string | null>(null);

  const [
    buildingSearch,
    setBuildingSearch,
  ] = useState("");

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
  ] = useState<
    NeighborhoodSummary | null
  >(null);

  // =========================================================
  // UI STATE
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // =========================================================
  // BUILDING SEARCH
  // =========================================================

  const searchableBuildings =
    useMemo(() => {
      if (!neighborhoodBuildings) {
        return [];
      }

      return neighborhoodBuildings.features
        .filter(
          (feature) =>
            Boolean(
              feature.properties.name
            )
        )
        .sort((a, b) =>
          (
            a.properties.name ?? ""
          ).localeCompare(
            b.properties.name ?? ""
          )
        );
    }, [
      neighborhoodBuildings,
    ]);

  const buildingSearchResults =
    useMemo(() => {
      const query =
        buildingSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return searchableBuildings.slice(
          0,
          8
        );
      }

      return searchableBuildings
        .filter((feature) => {
          const properties =
            feature.properties;

          const searchableText = [
            properties.name,
            properties.building_id,
            properties.building_type,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            query
          );
        })
        .slice(
          0,
          8
        );
    }, [
      buildingSearch,
      searchableBuildings,
    ]);

  // =========================================================
  // INITIAL LOAD
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
  // REAL OSM BUILDING SELECTION
  // =========================================================

  function selectNeighborhoodBuilding(
    building: NeighborhoodBuildingProperties
  ) {
    setSelectedOsmBuilding(
      building
    );

    setFocusedBuildingId(
      building.building_id
    );

    if (
      verticalBuildingId !==
      building.building_id
    ) {
      setVerticalBuildingId(null);
      setFloors([]);
      setUnits([]);
    }
  }

  function focusBuilding(
    building: NeighborhoodBuildingProperties
  ) {
    setSelectedOsmBuilding(
      building
    );

    setFocusedBuildingId(
      building.building_id
    );

    setVerticalBuildingId(null);

    setFloors([]);
    setUnits([]);

    setBuildingSearch(
      building.name ?? ""
    );
  }

  // =========================================================
  // VERTICAL MODEL INSPECTION
  // =========================================================

  async function inspectVerticalModel() {
    if (!selectedOsmBuilding) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const floorData =
        await getBuildingFloors(
          selectedOsmBuilding.building_id
        );

      if (
        floorData.length === 0
      ) {
        throw new Error(
          "No vertical model is available for this building."
        );
      }

      setFloors(floorData);
      setUnits([]);

      setFocusedBuildingId(
        selectedOsmBuilding.building_id
      );

      setVerticalBuildingId(
        selectedOsmBuilding.building_id
      );

      setViewMode("3d");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load vertical model"
      );
    } finally {
      setLoading(false);
    }
  }

  function closeVerticalModel() {
    setVerticalBuildingId(null);

    setFloors([]);
    setUnits([]);
  }

  // =========================================================
  // PARCEL SELECTION
  // =========================================================

  async function selectParcel(
    parcel: Parcel
  ) {
    try {
      setLoading(true);
      setError(null);

      setSelectedOsmBuilding(null);
      setFocusedBuildingId(null);
      setVerticalBuildingId(null);

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
  // DETAILED BUILDING SELECTION
  // =========================================================

  async function selectBuilding(
    building: Building
  ) {
    try {
      setLoading(true);
      setError(null);

      setSelectedOsmBuilding(null);
      setFocusedBuildingId(null);
      setVerticalBuildingId(null);

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

        <p>
          {error}
        </p>
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
              onClick={
                open2D
              }
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
              onClick={
                open3D
              }
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
            viewMode={
              viewMode
            }
            parcels={
              parcels
            }
            buildings={
              buildings
            }
            floors={
              floors
            }
            units={
              units
            }
            focusedBuildingId={
              focusedBuildingId
            }
            verticalBuildingId={
              verticalBuildingId
            }
            neighborhoodBuildings={
              neighborhoodBuildings
            }
            roads={
              roads
            }
            parks={
              parks
            }
            water={
              water
            }
            onParcelSelect={
              selectParcel
            }
            onBuildingSelect={
              selectBuilding
            }
            onNeighborhoodBuildingSelect={
              selectNeighborhoodBuilding
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
                BKC neighborhood and vertical
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

          {/* =================================================
              BUILDING FINDER
              ================================================= */}

          <section className="building-finder">
            <div className="section-heading">
              <span>
                Find Building
              </span>

              <strong>
                {
                  searchableBuildings.length
                }
              </strong>
            </div>

            <input
              type="search"
              className="building-search-input"
              value={
                buildingSearch
              }
              placeholder="Search BKC buildings..."
              onChange={(event) =>
                setBuildingSearch(
                  event.target.value
                )
              }
            />

            <div className="building-search-results">
              {buildingSearchResults.length ===
                0 && (
                <div className="building-search-empty">
                  No named building found.
                </div>
              )}

              {buildingSearchResults.map(
                (feature) => {
                  const building =
                    feature.properties;

                  const selected =
                    selectedOsmBuilding
                      ?.building_id ===
                    building.building_id;

                  return (
                    <button
                      key={
                        building.building_id
                      }
                      type="button"
                      className={
                        selected
                          ? "building-search-result selected"
                          : "building-search-result"
                      }
                      onClick={() =>
                        focusBuilding(
                          building
                        )
                      }
                    >
                      <div>
                        <strong>
                          {building.name ??
                            building.building_id}
                        </strong>

                        <small>
                          {building.building_type ??
                            "building"}

                          {building.height_m !==
                            null &&
                            building.height_m !==
                              undefined
                            ? ` · ${building.height_m} m`
                            : ""}

                          {building.levels !==
                            null &&
                            building.levels !==
                              undefined
                            ? ` · ${building.levels} levels`
                            : ""}
                        </small>
                      </div>

                      <span>
                        Focus
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* =================================================
              SELECTED OSM BUILDING
              ================================================= */}

          {selectedOsmBuilding && (
            <section className="entity-card osm-building-card">
              <span className="entity-type osm-building-type">
                REAL OSM BUILDING
              </span>

              <h3>
                {selectedOsmBuilding.name ??
                  selectedOsmBuilding.building_id}
              </h3>

              <dl>
                <dt>
                  OSM ID
                </dt>

                <dd>
                  {
                    selectedOsmBuilding.building_id
                  }
                </dd>

                <dt>
                  Name
                </dt>

                <dd>
                  {selectedOsmBuilding.name ??
                    "Not mapped"}
                </dd>

                <dt>
                  Type
                </dt>

                <dd>
                  {selectedOsmBuilding.building_type ??
                    "building"}
                </dd>

                <dt>
                  Height
                </dt>

                <dd>
                  {selectedOsmBuilding.height_m !==
                  null
                    ? `${selectedOsmBuilding.height_m} m`
                    : "Unknown"}
                </dd>

                <dt>
                  Levels
                </dt>

                <dd>
                  {selectedOsmBuilding.levels ??
                    "Unknown"}
                </dd>

                <dt>
                  Source
                </dt>

                <dd>
                  {
                    selectedOsmBuilding.source_name
                  }
                </dd>

                <dt>
                  Data class
                </dt>

                <dd>
                  Real-world context
                </dd>
              </dl>

              {selectedOsmBuilding.building_id ===
                RAHEJA_TOWER_ID &&
                verticalBuildingId !==
                  RAHEJA_TOWER_ID && (
                  <button
                    type="button"
                    className="inspect-vertical-button"
                    onClick={() =>
                      void inspectVerticalModel()
                    }
                  >
                    Inspect 15-Floor Model
                  </button>
                )}

              {verticalBuildingId ===
                selectedOsmBuilding.building_id && (
                <div className="vertical-model-panel">
                  <div className="vertical-model-header">
                    <div>
                      <span className="vertical-model-label">
                        VERTICAL MODEL
                      </span>

                      <strong>
                        {floors.length} Floors
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="close-vertical-button"
                      onClick={
                        closeVerticalModel
                      }
                    >
                      Close
                    </button>
                  </div>

                  <div className="vertical-model-range">
                    <span>
                      Base

                      <strong>
                        0 m
                      </strong>
                    </span>

                    <span>
                      Top

                      <strong>
                        {selectedOsmBuilding.height_m ??
                          "?"}{" "}
                        m
                      </strong>
                    </span>
                  </div>

                  <div className="vertical-floor-list">
                    {[...floors]
                      .sort(
                        (a, b) =>
                          b.floor_number -
                          a.floor_number
                      )
                      .map(
                        (floor) => (
                          <div
                            key={
                              floor.floor_id
                            }
                            className="vertical-floor-row"
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
                          </div>
                        )
                      )}
                  </div>

                  <div className="vertical-provenance">
                    Floor geometry is
                    prototype-derived from the
                    real OSM footprint, 45 m
                    height and 15 mapped levels.
                  </div>
                </div>
              )}

              {selectedOsmBuilding.height_m ===
                null && (
                <div className="osm-height-warning">
                  OSM does not provide a
                  height or level count for
                  this building. Its displayed
                  3D height is a visualization
                  fallback and is not stored as
                  authoritative property data.
                </div>
              )}
            </section>
          )}

          {!selection.parcel &&
            !selectedOsmBuilding && (
              <div className="empty-state">
                <p>
                  Search for a named BKC
                  building or select one
                  directly from the map.
                </p>

                <small>
                  Search "Raheja" for the
                  flagship vertical model.
                </small>
              </div>
            )}

          {/* =================================================
              LEGACY DETAILED PROPERTY
              ================================================= */}

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
                  <dt>
                    Name
                  </dt>

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