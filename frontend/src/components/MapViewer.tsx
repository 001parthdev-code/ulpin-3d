import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";

import type {
  FeatureCollection,
  Geometry,
  Polygon,
} from "geojson";

import type {
  Building,
  Floor,
  NeighborhoodBuildingProperties,
  ParkProperties,
  Parcel,
  RoadProperties,
  Unit,
  WaterProperties,
} from "../api";

import "maplibre-gl/dist/maplibre-gl.css";

type ViewMode = "2d" | "3d";

interface MapViewerProps {
  viewMode: ViewMode;

  parcels: Parcel[];
  buildings: Building[];
  floors: Floor[];
  units: Unit[];

  neighborhoodBuildings:
    FeatureCollection<
      Polygon,
      NeighborhoodBuildingProperties
    > | null;

  roads:
    FeatureCollection<
      Geometry,
      RoadProperties
    > | null;

  parks:
    FeatureCollection<
      Geometry,
      ParkProperties
    > | null;

  water:
    FeatureCollection<
      Geometry,
      WaterProperties
    > | null;

  onParcelSelect: (parcel: Parcel) => void;
  onBuildingSelect: (building: Building) => void;
}

function MapViewer({
  viewMode,

  parcels,
  buildings,
  floors,
  units,

  neighborhoodBuildings,
  roads,
  parks,
  water,

  onParcelSelect,
  onBuildingSelect,
}: MapViewerProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<maplibregl.Map | null>(null);

  const [mapReady, setMapReady] =
    useState(false);

  // =========================================================
  // INITIALIZE MAP
  // =========================================================

  useEffect(() => {
    if (
      !containerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,

      style: {
        version: 8,

        sources: {},

        layers: [
          {
            id: "background",
            type: "background",

            paint: {
              "background-color": "#18181b",
            },
          },
        ],
      },

      // Mumbai — Lower Parel / Worli AOI
      center: [
        72.8309,
        19.0007,
      ],

      zoom: 16.2,

      pitch: 0,

      bearing: 0,
    });

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    map.on("load", () => {
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      setMapReady(false);

      map.remove();

      mapRef.current = null;
    };
  }, []);

  // =========================================================
  // VIEW MODE
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    if (viewMode === "2d") {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 700,
      });
    } else {
      map.easeTo({
        pitch: 62,
        bearing: 32,
        zoom: Math.max(
          map.getZoom(),
          16.2
        ),
        duration: 900,
      });
    }
  }, [viewMode, mapReady]);

  // =========================================================
  // WATER
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !mapReady ||
      !water
    ) {
      return;
    }

    const existingSource =
      map.getSource(
        "neighborhood-water"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (existingSource) {
      existingSource.setData(water);
      return;
    }

    map.addSource(
      "neighborhood-water",
      {
        type: "geojson",
        data: water,
      }
    );

    map.addLayer({
      id: "water-fill",

      type: "fill",

      source:
        "neighborhood-water",

      filter: [
        "==",
        "$type",
        "Polygon",
      ],

      paint: {
        "fill-color": "#0284c7",
        "fill-opacity": 0.65,
      },
    });

    map.addLayer({
      id: "water-line",

      type: "line",

      source:
        "neighborhood-water",

      paint: {
        "line-color": "#38bdf8",
        "line-width": 2,
        "line-opacity": 0.9,
      },
    });
  }, [water, mapReady]);

  // =========================================================
  // PARKS
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !mapReady ||
      !parks
    ) {
      return;
    }

    const existingSource =
      map.getSource(
        "neighborhood-parks"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (existingSource) {
      existingSource.setData(parks);
      return;
    }

    map.addSource(
      "neighborhood-parks",
      {
        type: "geojson",
        data: parks,
      }
    );

    map.addLayer({
      id: "parks-fill",

      type: "fill",

      source:
        "neighborhood-parks",

      paint: {
        "fill-color": "#166534",
        "fill-opacity": 0.72,
      },
    });

    map.addLayer({
      id: "parks-outline",

      type: "line",

      source:
        "neighborhood-parks",

      paint: {
        "line-color": "#4ade80",
        "line-width": 1.2,
      },
    });
  }, [parks, mapReady]);

  // =========================================================
  // ROADS
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !mapReady ||
      !roads
    ) {
      return;
    }

    const existingSource =
      map.getSource(
        "neighborhood-roads"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (existingSource) {
      existingSource.setData(roads);
      return;
    }

    map.addSource(
      "neighborhood-roads",
      {
        type: "geojson",
        data: roads,
      }
    );

    // Dark edge around roads.
    map.addLayer({
      id: "roads-casing",

      type: "line",

      source:
        "neighborhood-roads",

      paint: {
        "line-color": "#3f3f46",

        "line-width": [
          "match",

          [
            "get",
            "highway_type",
          ],

          [
            "motorway",
            "trunk",
            "primary",
          ],
          10,

          [
            "secondary",
            "tertiary",
          ],
          8,

          [
            "residential",
            "service",
          ],
          5,

          3,
        ],

        "line-opacity": 0.95,
      },
    });

    // Light road surface.
    map.addLayer({
      id: "roads-surface",

      type: "line",

      source:
        "neighborhood-roads",

      paint: {
        "line-color": [
          "match",

          [
            "get",
            "highway_type",
          ],

          [
            "motorway",
            "trunk",
            "primary",
          ],
          "#f4f4f5",

          [
            "secondary",
            "tertiary",
          ],
          "#d4d4d8",

          [
            "residential",
            "service",
          ],
          "#a1a1aa",

          "#71717a",
        ],

        "line-width": [
          "match",

          [
            "get",
            "highway_type",
          ],

          [
            "motorway",
            "trunk",
            "primary",
          ],
          7,

          [
            "secondary",
            "tertiary",
          ],
          5.5,

          [
            "residential",
            "service",
          ],
          3,

          1.5,
        ],

        "line-opacity": 0.95,
      },
    });
  }, [roads, mapReady]);

  // =========================================================
  // REAL OSM BUILDINGS
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !mapReady ||
      !neighborhoodBuildings
    ) {
      return;
    }

    const existingSource =
      map.getSource(
        "osm-buildings"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (existingSource) {
      existingSource.setData(
        neighborhoodBuildings
      );

      return;
    }

    map.addSource(
      "osm-buildings",
      {
        type: "geojson",

        data:
          neighborhoodBuildings,
      }
    );

    // -------------------------------------------------------
    // 2D BUILDINGS
    // -------------------------------------------------------

    map.addLayer({
      id: "osm-buildings-2d",

      type: "fill",

      source:
        "osm-buildings",

      paint: {
        "fill-color": [
          "case",

          [
            "has",
            "height_m",
          ],
          "#f4f4f5",

          "#d4d4d8",
        ],

        "fill-opacity": 0.88,
      },
    });

    map.addLayer({
      id: "osm-buildings-outline",

      type: "line",

      source:
        "osm-buildings",

      paint: {
        "line-color": "#52525b",

        "line-width": 1,

        "line-opacity": 0.95,
      },
    });

    // -------------------------------------------------------
    // 3D BUILDINGS
    // -------------------------------------------------------

    map.addLayer({
      id: "osm-buildings-3d",

      type: "fill-extrusion",

      source:
        "osm-buildings",

      layout: {
        visibility:
          viewMode === "3d"
            ? "visible"
            : "none",
      },

      paint: {
        "fill-extrusion-color": [
          "case",

          [
            "has",
            "height_m",
          ],

          "#e4e4e7",

          "#a1a1aa",
        ],

        "fill-extrusion-height": [
          "coalesce",

          [
            "get",
            "height_m",
          ],

          // Rendering fallback only.
          6,
        ],

        "fill-extrusion-base": 0,

        "fill-extrusion-opacity":
          0.9,
      },
    });
  }, [
    neighborhoodBuildings,
    mapReady,
    viewMode,
  ]);

  // =========================================================
  // PROTOTYPE PARCELS
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !mapReady ||
      parcels.length === 0
    ) {
      return;
    }

    const geojson:
      FeatureCollection<Polygon> = {
        type: "FeatureCollection",

        features:
          parcels.map(
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

    const existingSource =
      map.getSource(
        "prototype-parcels"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (existingSource) {
      existingSource.setData(
        geojson
      );

      return;
    }

    map.addSource(
      "prototype-parcels",
      {
        type: "geojson",
        data: geojson,
      }
    );

    map.addLayer({
      id: "prototype-parcels-fill",

      type: "fill",

      source:
        "prototype-parcels",

      paint: {
        "fill-color": "#06b6d4",

        "fill-opacity": 0.12,
      },
    });

    map.addLayer({
      id: "prototype-parcels-outline",

      type: "line",

      source:
        "prototype-parcels",

      paint: {
        "line-color": "#22d3ee",

        "line-width": 3,
      },
    });

    map.on(
      "click",

      "prototype-parcels-fill",

      (event) => {
        const feature =
          event.features?.[0];

        const parcelId =
          feature?.properties
            ?.parcel_id;

        const parcel =
          parcels.find(
            (candidate) =>
              candidate.parcel_id ===
              parcelId
          );

        if (parcel) {
          onParcelSelect(parcel);
        }
      }
    );

    map.on(
      "mouseenter",

      "prototype-parcels-fill",

      () => {
        map.getCanvas()
          .style.cursor =
          "pointer";
      }
    );

    map.on(
      "mouseleave",

      "prototype-parcels-fill",

      () => {
        map.getCanvas()
          .style.cursor = "";
      }
    );
  }, [
    parcels,
    mapReady,
    onParcelSelect,
  ]);

  // =========================================================
  // DETAILED PROPERTY BUILDINGS
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !mapReady ||
      buildings.length === 0
    ) {
      return;
    }

    const geojson:
      FeatureCollection<Polygon> = {
        type: "FeatureCollection",

        features:
          buildings.map(
            (building) => ({
              type: "Feature",

              properties: {
                building_id:
                  building.building_id,

                height_m:
                  building.height_m ??
                  6,
              },

              geometry:
                building.footprint,
            })
          ),
      };

    const existingSource =
      map.getSource(
        "detailed-buildings"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (existingSource) {
      existingSource.setData(
        geojson
      );

      return;
    }

    map.addSource(
      "detailed-buildings",
      {
        type: "geojson",
        data: geojson,
      }
    );

    // Detailed vertical-property building = red.
    map.addLayer({
      id: "detailed-buildings-2d",

      type: "fill",

      source:
        "detailed-buildings",

      paint: {
        "fill-color": "#ef4444",

        "fill-opacity": 0.9,
      },
    });

    map.addLayer({
      id: "detailed-buildings-outline",

      type: "line",

      source:
        "detailed-buildings",

      paint: {
        "line-color": "#fecaca",

        "line-width": 2,
      },
    });

    map.addLayer({
      id: "detailed-buildings-3d",

      type: "fill-extrusion",

      source:
        "detailed-buildings",

      layout: {
        visibility:
          viewMode === "3d"
            ? "visible"
            : "none",
      },

      paint: {
        "fill-extrusion-color":
          "#ef4444",

        "fill-extrusion-height": [
          "get",
          "height_m",
        ],

        "fill-extrusion-base": 0,

        "fill-extrusion-opacity":
          0.95,
      },
    });

    const selectBuilding =
      (event: maplibregl.MapLayerMouseEvent) => {
        const feature =
          event.features?.[0];

        const buildingId =
          feature?.properties
            ?.building_id;

        const building =
          buildings.find(
            (candidate) =>
              candidate.building_id ===
              buildingId
          );

        if (building) {
          onBuildingSelect(
            building
          );
        }
      };

    map.on(
      "click",
      "detailed-buildings-2d",
      selectBuilding
    );

    map.on(
      "click",
      "detailed-buildings-3d",
      selectBuilding
    );
  }, [
    buildings,
    mapReady,
    onBuildingSelect,
    viewMode,
  ]);

  // =========================================================
  // FLOOR VOLUMES
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    const geojson:
      FeatureCollection<Polygon> = {
        type: "FeatureCollection",

        features:
          floors.map(
            (floor) => ({
              type: "Feature",

              properties: {
                floor_id:
                  floor.floor_id,

                floor_number:
                  floor.floor_number,

                z_min_m:
                  floor.z_min_m,

                z_max_m:
                  floor.z_max_m,
              },

              geometry:
                floor.footprint,
            })
          ),
      };

    const existingSource =
      map.getSource(
        "property-floors"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (existingSource) {
      existingSource.setData(
        geojson
      );

      return;
    }

    if (floors.length === 0) {
      return;
    }

    map.addSource(
      "property-floors",
      {
        type: "geojson",
        data: geojson,
      }
    );

    map.addLayer({
      id: "property-floors-3d",

      type: "fill-extrusion",

      source:
        "property-floors",

      layout: {
        visibility:
          viewMode === "3d"
            ? "visible"
            : "none",
      },

      paint: {
        "fill-extrusion-color":
          "#8b5cf6",

        "fill-extrusion-base": [
          "get",
          "z_min_m",
        ],

        "fill-extrusion-height": [
          "get",
          "z_max_m",
        ],

        "fill-extrusion-opacity":
          0.7,
      },
    });
  }, [
    floors,
    mapReady,
    viewMode,
  ]);

  // =========================================================
  // UNIT VOLUMES
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    const geojson:
      FeatureCollection<Polygon> = {
        type: "FeatureCollection",

        features:
          units.map(
            (unit) => ({
              type: "Feature",

              properties: {
                unit_id:
                  unit.unit_id,

                unit_number:
                  unit.unit_number,

                z_min_m:
                  unit.z_min_m,

                z_max_m:
                  unit.z_max_m,
              },

              geometry:
                unit.footprint,
            })
          ),
      };

    const existingSource =
      map.getSource(
        "property-units"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (existingSource) {
      existingSource.setData(
        geojson
      );

      return;
    }

    if (units.length === 0) {
      return;
    }

    map.addSource(
      "property-units",
      {
        type: "geojson",
        data: geojson,
      }
    );

    map.addLayer({
      id: "property-units-3d",

      type: "fill-extrusion",

      source:
        "property-units",

      layout: {
        visibility:
          viewMode === "3d"
            ? "visible"
            : "none",
      },

      paint: {
        "fill-extrusion-color":
          "#10b981",

        "fill-extrusion-base": [
          "get",
          "z_min_m",
        ],

        "fill-extrusion-height": [
          "get",
          "z_max_m",
        ],

        "fill-extrusion-opacity":
          0.88,
      },
    });
  }, [
    units,
    mapReady,
    viewMode,
  ]);

  // =========================================================
  // SYNCHRONIZE 2D / 3D LAYER VISIBILITY
  // =========================================================

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    const is3D =
      viewMode === "3d";

    const setVisibility = (
      layerId: string,
      visible: boolean
    ) => {
      if (!map.getLayer(layerId)) {
        return;
      }

      map.setLayoutProperty(
        layerId,

        "visibility",

        visible
          ? "visible"
          : "none"
      );
    };

    setVisibility(
      "osm-buildings-2d",
      !is3D
    );

    setVisibility(
      "osm-buildings-outline",
      !is3D
    );

    setVisibility(
      "osm-buildings-3d",
      is3D
    );

    setVisibility(
      "detailed-buildings-2d",
      !is3D
    );

    setVisibility(
      "detailed-buildings-outline",
      !is3D
    );

    setVisibility(
      "detailed-buildings-3d",
      is3D
    );

    setVisibility(
      "property-floors-3d",
      is3D
    );

    setVisibility(
      "property-units-3d",
      is3D
    );
  }, [
    viewMode,
    mapReady,
    neighborhoodBuildings,
    buildings,
    floors,
    units,
  ]);

  return (
    <div
      ref={containerRef}
      className="map"
    />
  );
}

export default MapViewer;