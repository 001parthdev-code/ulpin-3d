import {
  useEffect,
  useRef,
  useState,
} from "react";

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

  focusedBuildingId: string | null;
  verticalBuildingId: string | null;

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

  onParcelSelect: (
    parcel: Parcel
  ) => void;

  onBuildingSelect: (
    building: Building
  ) => void;

  onNeighborhoodBuildingSelect: (
    building: NeighborhoodBuildingProperties
  ) => void;
}

function MapViewer({
  viewMode,

  parcels,
  buildings,
  floors,
  units,

  focusedBuildingId,
  verticalBuildingId,

  neighborhoodBuildings,
  roads,
  parks,
  water,

  onParcelSelect,
  onBuildingSelect,
  onNeighborhoodBuildingSelect,
}: MapViewerProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const mapRef =
    useRef<maplibregl.Map | null>(
      null
    );

  const [mapReady, setMapReady] =
    useState(false);

  // =========================================================
  // MAP INITIALIZATION
  // =========================================================

  useEffect(() => {
    if (
      !containerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const map =
      new maplibregl.Map({
        container:
          containerRef.current,

        style: {
          version: 8,

          sources: {},

          layers: [
            {
              id: "background",

              type: "background",

              paint: {
                "background-color":
                  "#18181b",
              },
            },
          ],
        },

        // BKC, Mumbai
        center: [
          72.8691,
          19.0668,
        ],

        zoom: 15.3,

        pitch: 0,

        bearing: 0,
      });

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    const handleLoad = () => {
      setMapReady(true);
    };

    map.on(
      "load",
      handleLoad
    );

    mapRef.current = map;

    return () => {
      setMapReady(false);

      map.off(
        "load",
        handleLoad
      );

      map.remove();

      mapRef.current = null;
    };
  }, []);

  // =========================================================
  // CAMERA MODE
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }

    if (
      viewMode === "2d"
    ) {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 700,
      });

      return;
    }

    map.easeTo({
      pitch: 62,

      bearing: 32,

      zoom: Math.max(
        map.getZoom(),
        15.3
      ),

      duration: 900,
    });
  }, [
    viewMode,
    mapReady,
  ]);

  // =========================================================
  // WATER
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady ||
      !water
    ) {
      return;
    }

    const source =
      map.getSource(
        "neighborhood-water"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
        water
      );

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
        "fill-color":
          "#0284c7",

        "fill-opacity":
          0.65,
      },
    });

    map.addLayer({
      id: "water-line",

      type: "line",

      source:
        "neighborhood-water",

      paint: {
        "line-color":
          "#38bdf8",

        "line-width":
          2,

        "line-opacity":
          0.9,
      },
    });
  }, [
    water,
    mapReady,
  ]);

  // =========================================================
  // PARKS
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady ||
      !parks
    ) {
      return;
    }

    const source =
      map.getSource(
        "neighborhood-parks"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
        parks
      );

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
        "fill-color":
          "#166534",

        "fill-opacity":
          0.72,
      },
    });

    map.addLayer({
      id: "parks-outline",

      type: "line",

      source:
        "neighborhood-parks",

      paint: {
        "line-color":
          "#4ade80",

        "line-width":
          1.2,
      },
    });
  }, [
    parks,
    mapReady,
  ]);

  // =========================================================
  // ROADS
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady ||
      !roads
    ) {
      return;
    }

    const source =
      map.getSource(
        "neighborhood-roads"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
        roads
      );

      return;
    }

    map.addSource(
      "neighborhood-roads",
      {
        type: "geojson",

        data: roads,
      }
    );

    map.addLayer({
      id: "roads-casing",

      type: "line",

      source:
        "neighborhood-roads",

      paint: {
        "line-color":
          "#3f3f46",

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

        "line-opacity":
          0.95,
      },
    });

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

        "line-opacity":
          0.95,
      },
    });
  }, [
    roads,
    mapReady,
  ]);

  // =========================================================
  // OSM BUILDING SOURCE + LAYERS
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady ||
      !neighborhoodBuildings
    ) {
      return;
    }

    const source =
      map.getSource(
        "osm-buildings"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
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
      id:
        "osm-buildings-2d",

      type:
        "fill",

      source:
        "osm-buildings",

      layout: {
        visibility:
          "visible",
      },

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

        "fill-opacity":
          0.88,
      },
    });

    map.addLayer({
      id:
        "osm-buildings-outline",

      type:
        "line",

      source:
        "osm-buildings",

      layout: {
        visibility:
          "visible",
      },

      paint: {
        "line-color":
          "#52525b",

        "line-width":
          1,

        "line-opacity":
          0.95,
      },
    });

    // -------------------------------------------------------
    // 3D BUILDINGS
    // -------------------------------------------------------

    map.addLayer({
      id:
        "osm-buildings-3d",

      type:
        "fill-extrusion",

      source:
        "osm-buildings",

      layout: {
        visibility:
          "none",
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

          6,
        ],

        "fill-extrusion-base":
          0,

        "fill-extrusion-opacity":
          0.9,
      },
    });
  }, [
    neighborhoodBuildings,
    mapReady,
  ]);

  // =========================================================
  // OSM BUILDING INTERACTION
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }

    const getActiveLayer =
      () =>
        viewMode === "3d"
          ? "osm-buildings-3d"
          : "osm-buildings-2d";

    const getBuildingAtPoint = (
      point:
        maplibregl.Point
    ) => {
      const layerId =
        getActiveLayer();

      if (
        !map.getLayer(
          layerId
        )
      ) {
        return undefined;
      }

      return map.queryRenderedFeatures(
        point,
        {
          layers: [
            layerId,
          ],
        }
      )[0];
    };

    const handleClick = (
      event:
        maplibregl.MapMouseEvent
    ) => {
      const feature =
        getBuildingAtPoint(
          event.point
        );

      const properties =
        feature?.properties;

      if (!properties) {
        return;
      }

      onNeighborhoodBuildingSelect({
        building_id:
          properties.building_id,

        name:
          properties.name ??
          null,

        building_type:
          properties.building_type ??
          null,

        height_m:
          properties.height_m ??
          null,

        levels:
          properties.levels ??
          null,

        source_type:
          properties.source_type,

        source_name:
          properties.source_name,
      });
    };

    const handleMouseMove = (
      event:
        maplibregl.MapMouseEvent
    ) => {
      const feature =
        getBuildingAtPoint(
          event.point
        );

      map.getCanvas()
        .style.cursor =
        feature
          ? "pointer"
          : "";
    };

    map.on(
      "click",
      handleClick
    );

    map.on(
      "mousemove",
      handleMouseMove
    );

    return () => {
      map.off(
        "click",
        handleClick
      );

      map.off(
        "mousemove",
        handleMouseMove
      );

      map.getCanvas()
        .style.cursor =
        "";
    };
  }, [
    mapReady,
    viewMode,
    onNeighborhoodBuildingSelect,
  ]);

  // =========================================================
  // SELECTED / FOCUSED BUILDING STYLE
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }

    const selectedId =
      focusedBuildingId ??
      "";

    if (
      map.getLayer(
        "osm-buildings-2d"
      )
    ) {
      map.setPaintProperty(
        "osm-buildings-2d",

        "fill-color",

        [
          "case",

          [
            "==",

            [
              "get",
              "building_id",
            ],

            selectedId,
          ],

          "#f59e0b",

          [
            "case",

            [
              "has",
              "height_m",
            ],

            "#f4f4f5",

            "#d4d4d8",
          ],
        ]
      );
    }

    if (
      map.getLayer(
        "osm-buildings-outline"
      )
    ) {
      map.setPaintProperty(
        "osm-buildings-outline",

        "line-color",

        [
          "case",

          [
            "==",

            [
              "get",
              "building_id",
            ],

            selectedId,
          ],

          "#fbbf24",

          "#52525b",
        ]
      );

      map.setPaintProperty(
        "osm-buildings-outline",

        "line-width",

        [
          "case",

          [
            "==",

            [
              "get",
              "building_id",
            ],

            selectedId,
          ],

          4,

          1,
        ]
      );
    }

    if (
      map.getLayer(
        "osm-buildings-3d"
      )
    ) {
      map.setPaintProperty(
        "osm-buildings-3d",

        "fill-extrusion-color",

        [
          "case",

          [
            "==",

            [
              "get",
              "building_id",
            ],

            selectedId,
          ],

          "#f59e0b",

          [
            "case",

            [
              "has",
              "height_m",
            ],

            "#e4e4e7",

            "#a1a1aa",
          ],
        ]
      );

      map.setPaintProperty(
        "osm-buildings-3d",

        "fill-extrusion-opacity",

        0.9
      );
    }
  }, [
    focusedBuildingId,
    mapReady,
  ]);

  // =========================================================
  // GENERIC BUILDING FOCUS
  //
  // Finds the selected building's actual GeoJSON polygon,
  // computes its bounding box, and flies to it.
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady ||
      !focusedBuildingId ||
      !neighborhoodBuildings
    ) {
      return;
    }

    const feature =
      neighborhoodBuildings
        .features
        .find(
          (candidate) =>
            candidate.properties
              .building_id ===
            focusedBuildingId
        );

    if (!feature) {
      return;
    }

    const coordinates =
      feature.geometry
        .coordinates[0];

    if (
      coordinates.length === 0
    ) {
      return;
    }

    let minLon =
      Number.POSITIVE_INFINITY;

    let minLat =
      Number.POSITIVE_INFINITY;

    let maxLon =
      Number.NEGATIVE_INFINITY;

    let maxLat =
      Number.NEGATIVE_INFINITY;

    for (
      const coordinate
      of coordinates
    ) {
      const [
        lon,
        lat,
      ] = coordinate;

      minLon =
        Math.min(
          minLon,
          lon
        );

      minLat =
        Math.min(
          minLat,
          lat
        );

      maxLon =
        Math.max(
          maxLon,
          lon
        );

      maxLat =
        Math.max(
          maxLat,
          lat
        );
    }

    const bounds =
      new maplibregl.LngLatBounds(
        [
          minLon,
          minLat,
        ],
        [
          maxLon,
          maxLat,
        ]
      );

    map.fitBounds(
      bounds,
      {
        padding: {
          top: 160,
          right: 180,
          bottom: 160,
          left: 180,
        },

        maxZoom:
          viewMode === "3d"
            ? 18
            : 18.5,

        pitch:
          viewMode === "3d"
            ? 62
            : 0,

        bearing:
          viewMode === "3d"
            ? 32
            : 0,

        duration:
          1200,
      }
    );
  }, [
    focusedBuildingId,
    neighborhoodBuildings,
    mapReady,
    viewMode,
  ]);

  // =========================================================
  // VERTICAL INSPECTION STYLE
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }

    if (
      !map.getLayer(
        "osm-buildings-3d"
      )
    ) {
      return;
    }

    // When a vertical model is active,
    // make that building's original OSM shell
    // partially transparent so the derived
    // floor stack remains visible.
    map.setPaintProperty(
      "osm-buildings-3d",

      "fill-extrusion-opacity",

      verticalBuildingId
        ? [
            "case",

            [
              "==",

              [
                "get",
                "building_id",
              ],

              verticalBuildingId,
            ],

            0.16,

            0.9,
          ]
        : 0.9
    );
  }, [
    verticalBuildingId,
    mapReady,
  ]);

  // =========================================================
  // PROTOTYPE PARCELS
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady ||
      parcels.length === 0
    ) {
      return;
    }

    const geojson:
      FeatureCollection<Polygon> = {
        type:
          "FeatureCollection",

        features:
          parcels.map(
            (parcel) => ({
              type:
                "Feature",

              properties: {
                parcel_id:
                  parcel.parcel_id,
              },

              geometry:
                parcel.geometry,
            })
          ),
      };

    const source =
      map.getSource(
        "prototype-parcels"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
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
      id:
        "prototype-parcels-fill",

      type:
        "fill",

      source:
        "prototype-parcels",

      paint: {
        "fill-color":
          "#06b6d4",

        "fill-opacity":
          0.12,
      },
    });

    map.addLayer({
      id:
        "prototype-parcels-outline",

      type:
        "line",

      source:
        "prototype-parcels",

      paint: {
        "line-color":
          "#22d3ee",

        "line-width":
          3,
      },
    });

    const handleParcelClick = (
      event:
        maplibregl.MapLayerMouseEvent
    ) => {
      const parcelId =
        event.features?.[0]
          ?.properties
          ?.parcel_id;

      const parcel =
        parcels.find(
          (candidate) =>
            candidate.parcel_id ===
            parcelId
        );

      if (parcel) {
        onParcelSelect(
          parcel
        );
      }
    };

    map.on(
      "click",
      "prototype-parcels-fill",
      handleParcelClick
    );

    return () => {
      if (
        map.getLayer(
          "prototype-parcels-fill"
        )
      ) {
        map.off(
          "click",
          "prototype-parcels-fill",
          handleParcelClick
        );
      }
    };
  }, [
    parcels,
    mapReady,
    onParcelSelect,
  ]);

  // =========================================================
  // DETAILED PROPERTY BUILDINGS
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady ||
      buildings.length === 0
    ) {
      return;
    }

    const geojson:
      FeatureCollection<Polygon> = {
        type:
          "FeatureCollection",

        features:
          buildings.map(
            (building) => ({
              type:
                "Feature",

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

    const source =
      map.getSource(
        "detailed-buildings"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
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

    map.addLayer({
      id:
        "detailed-buildings-2d",

      type:
        "fill",

      source:
        "detailed-buildings",

      layout: {
        visibility:
          "visible",
      },

      paint: {
        "fill-color":
          "#ef4444",

        "fill-opacity":
          0.9,
      },
    });

    map.addLayer({
      id:
        "detailed-buildings-outline",

      type:
        "line",

      source:
        "detailed-buildings",

      layout: {
        visibility:
          "visible",
      },

      paint: {
        "line-color":
          "#fecaca",

        "line-width":
          2,
      },
    });

    map.addLayer({
      id:
        "detailed-buildings-3d",

      type:
        "fill-extrusion",

      source:
        "detailed-buildings",

      layout: {
        visibility:
          "none",
      },

      paint: {
        "fill-extrusion-color":
          "#ef4444",

        "fill-extrusion-height": [
          "get",
          "height_m",
        ],

        "fill-extrusion-base":
          0,

        "fill-extrusion-opacity":
          0.95,
      },
    });

    const handleBuildingClick = (
      event:
        maplibregl.MapLayerMouseEvent
    ) => {
      const buildingId =
        event.features?.[0]
          ?.properties
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
      handleBuildingClick
    );

    map.on(
      "click",
      "detailed-buildings-3d",
      handleBuildingClick
    );

    return () => {
      if (
        map.getLayer(
          "detailed-buildings-2d"
        )
      ) {
        map.off(
          "click",
          "detailed-buildings-2d",
          handleBuildingClick
        );
      }

      if (
        map.getLayer(
          "detailed-buildings-3d"
        )
      ) {
        map.off(
          "click",
          "detailed-buildings-3d",
          handleBuildingClick
        );
      }
    };
  }, [
    buildings,
    mapReady,
    onBuildingSelect,
  ]);

  // =========================================================
  // FLOOR VOLUMES
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }

    const geojson:
      FeatureCollection<Polygon> = {
        type:
          "FeatureCollection",

        features:
          floors.map(
            (floor) => ({
              type:
                "Feature",

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

    const source =
      map.getSource(
        "property-floors"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
        geojson
      );

      return;
    }

    if (
      floors.length === 0
    ) {
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
      id:
        "property-floors-3d",

      type:
        "fill-extrusion",

      source:
        "property-floors",

      layout: {
        visibility:
          "none",
      },

      paint: {
        "fill-extrusion-color": [
          "case",

          [
            "==",

            [
              "%",

              [
                "get",
                "floor_number",
              ],

              2,
            ],

            0,
          ],

          "#7c3aed",

          "#c4b5fd",
        ],

        "fill-extrusion-base": [
          "get",
          "z_min_m",
        ],

        "fill-extrusion-height": [
          "get",
          "z_max_m",
        ],

        "fill-extrusion-opacity":
          0.94,
      },
    });
  }, [
    floors,
    mapReady,
  ]);

  // =========================================================
  // UNIT VOLUMES
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }

    const geojson:
      FeatureCollection<Polygon> = {
        type:
          "FeatureCollection",

        features:
          units.map(
            (unit) => ({
              type:
                "Feature",

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

    const source =
      map.getSource(
        "property-units"
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (source) {
      source.setData(
        geojson
      );

      return;
    }

    if (
      units.length === 0
    ) {
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
      id:
        "property-units-3d",

      type:
        "fill-extrusion",

      source:
        "property-units",

      layout: {
        visibility:
          "none",
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
  ]);

  // =========================================================
  // SINGLE SOURCE OF TRUTH FOR VISIBILITY
  // =========================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !mapReady
    ) {
      return;
    }

    const is3D =
      viewMode === "3d";

    const setVisibility = (
      layerId: string,
      visible: boolean
    ) => {
      if (
        !map.getLayer(
          layerId
        )
      ) {
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

    // Real OSM neighborhood.
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

    // Legacy prototype property.
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

    // Vertical entities.
    setVisibility(
      "property-floors-3d",
      is3D &&
        floors.length > 0
    );

    setVisibility(
      "property-units-3d",
      is3D &&
        units.length > 0
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