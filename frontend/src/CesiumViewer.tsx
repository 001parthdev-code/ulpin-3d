import { useEffect, useRef } from "react";

import {
  Cartesian3,
  Color,
  HeadingPitchRange,
  HeightReference,
  Math as CesiumMath,
  PolygonHierarchy,
  Viewer,
} from "cesium";

import type {
  Building,
  Floor,
  Unit,
} from "./api";

import "cesium/Build/Cesium/Widgets/widgets.css";
import "./CesiumViewer.css";

interface CesiumViewerProps {
  visible: boolean;

  building: Building | null;

  floors: Floor[];

  units: Unit[];

  selectedFloor: Floor | null;

  selectedUnit: Unit | null;
}

function CesiumViewer({
  visible,
  building,
  floors,
  units,
  selectedFloor,
  selectedUnit,
}: CesiumViewerProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const viewerRef =
    useRef<Viewer | null>(null);

  // =========================================================
  // INITIALIZE CESIUM
  // =========================================================

  useEffect(() => {
    if (
      !containerRef.current ||
      viewerRef.current
    ) {
      return;
    }

    const viewer = new Viewer(
      containerRef.current,
      {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,

        baseLayer: false,

        terrainProvider: undefined,

        selectionIndicator: false,
        infoBox: false,
      }
    );

    viewer.scene.backgroundColor =
      Color.fromCssColorString(
        "#111827"
      );

    // Isolated property inspection mode.
    viewer.scene.globe.show = false;

    // =======================================================
    // 360-DEGREE CAMERA CONTROLS
    // =======================================================

    const controller =
      viewer.scene
        .screenSpaceCameraController;

    controller.enableRotate = true;
    controller.enableTilt = true;
    controller.enableZoom = true;
    controller.enableLook = true;
    controller.enableTranslate = true;

    controller.minimumZoomDistance = 2;
    controller.maximumZoomDistance = 500;

    viewerRef.current = viewer;

    return () => {
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }

      viewerRef.current = null;
    };
  }, []);

  // =========================================================
  // RENDER PROPERTY MODEL
  // =========================================================

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer || !building) {
      return;
    }

    viewer.entities.removeAll();

    // =======================================================
    // BUILDING BASE
    // =======================================================

    const buildingRing =
      building.footprint.coordinates[0];

    if (
      !buildingRing ||
      buildingRing.length < 4
    ) {
      return;
    }

    const buildingPositions =
      buildingRing.map(
        ([longitude, latitude]) =>
          Cartesian3.fromDegrees(
            longitude,
            latitude,
            0
          )
      );

    viewer.entities.add({
      id: `building-base-${building.building_id}`,

      name: building.building_id,

      polygon: {
        hierarchy:
          new PolygonHierarchy(
            buildingPositions
          ),

        height: 0,

        material:
          Color.fromCssColorString(
            "#f59e0b"
          ).withAlpha(0.12),

        outline: true,

        outlineColor:
          Color.fromCssColorString(
            "#f59e0b"
          ),
      },
    });

    // =======================================================
    // FLOORS
    // =======================================================

    floors.forEach((floor) => {
      const ring =
        floor.footprint.coordinates[0];

      if (
        !ring ||
        ring.length < 4
      ) {
        return;
      }

      const positions =
        ring.map(
          ([longitude, latitude]) =>
            Cartesian3.fromDegrees(
              longitude,
              latitude,
              floor.z_min_m
            )
        );

      const isSelected =
        selectedFloor?.floor_id ===
        floor.floor_id;

      const floorColor =
        isSelected
          ? Color.fromCssColorString(
              "#a78bfa"
            )
          : Color.fromCssColorString(
              "#3b82f6"
            );

      viewer.entities.add({
        id: floor.floor_id,

        name:
          `Floor ${floor.floor_number}`,

        properties: {
          entityType: "floor",
          floorId: floor.floor_id,
          floorNumber:
            floor.floor_number,
        },

        polygon: {
          hierarchy:
            new PolygonHierarchy(
              positions
            ),

          height:
            floor.z_min_m,

          extrudedHeight:
            floor.z_max_m,

          heightReference:
            HeightReference.NONE,

          extrudedHeightReference:
            HeightReference.NONE,

          material:
            floorColor.withAlpha(
              isSelected
                ? 0.92
                : 0.52
            ),

          outline: true,

          outlineColor:
            Color.fromCssColorString(
              "#e2e8f0"
            ),

          closeTop: true,
          closeBottom: true,
        },
      });
    });

    // =======================================================
    // UNITS
    // =======================================================

    units.forEach((unit) => {
      const ring =
        unit.footprint.coordinates[0];

      if (
        !ring ||
        ring.length < 4
      ) {
        return;
      }

      const positions =
        ring.map(
          ([longitude, latitude]) =>
            Cartesian3.fromDegrees(
              longitude,
              latitude,
              unit.z_min_m
            )
        );

      const isSelected =
        selectedUnit?.unit_id ===
        unit.unit_id;

      const unitColor =
        isSelected
          ? Color.fromCssColorString(
              "#34d399"
            )
          : Color.fromCssColorString(
              "#10b981"
            );

      viewer.entities.add({
        id: unit.unit_id,

        name:
          `Unit ${unit.unit_number}`,

        properties: {
          entityType: "unit",
          unitId: unit.unit_id,
          unitNumber:
            unit.unit_number,
        },

        polygon: {
          hierarchy:
            new PolygonHierarchy(
              positions
            ),

          height:
            unit.z_min_m,

          extrudedHeight:
            unit.z_max_m,

          heightReference:
            HeightReference.NONE,

          extrudedHeightReference:
            HeightReference.NONE,

          material:
            unitColor.withAlpha(
              isSelected
                ? 0.98
                : 0.8
            ),

          outline: true,

          outlineColor:
            Color.WHITE,

          closeTop: true,
          closeBottom: true,
        },
      });
    });

    // =======================================================
    // INITIAL OBLIQUE CAMERA
    // =======================================================

    void viewer.zoomTo(
      viewer.entities,

      new HeadingPitchRange(
        CesiumMath.toRadians(35),

        CesiumMath.toRadians(-25),

        0
      )
    );

    viewer.scene.requestRender();
  }, [
    building,
    floors,
    units,
    selectedFloor,
    selectedUnit,
  ]);

  // =========================================================
  // HANDLE 2D → 3D RETURN
  // =========================================================

  useEffect(() => {
    const viewer =
      viewerRef.current;

    if (
      !viewer ||
      !visible
    ) {
      return;
    }

    requestAnimationFrame(() => {
      viewer.resize();

      viewer.scene.requestRender();
    });
  }, [visible]);

  // =========================================================
  // RESET CAMERA
  // =========================================================

  function resetView() {
    const viewer =
      viewerRef.current;

    if (
      !viewer ||
      viewer.entities.values.length === 0
    ) {
      return;
    }

    void viewer.zoomTo(
      viewer.entities,

      new HeadingPitchRange(
        CesiumMath.toRadians(35),

        CesiumMath.toRadians(-25),

        0
      )
    );
  }

  // =========================================================
  // TOP CAMERA
  // =========================================================

  function topView() {
    const viewer =
      viewerRef.current;

    if (
      !viewer ||
      viewer.entities.values.length === 0
    ) {
      return;
    }

    void viewer.zoomTo(
      viewer.entities,

      new HeadingPitchRange(
        0,

        CesiumMath.toRadians(-90),

        0
      )
    );
  }

  // =========================================================
  // SIDE CAMERA
  // =========================================================

  function sideView() {
    const viewer =
      viewerRef.current;

    if (
      !viewer ||
      viewer.entities.values.length === 0
    ) {
      return;
    }

    void viewer.zoomTo(
      viewer.entities,

      new HeadingPitchRange(
        CesiumMath.toRadians(90),

        CesiumMath.toRadians(-10),

        0
      )
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="cesium-wrapper">
      <div
        ref={containerRef}
        className="cesium-viewer"
      />

      {visible && building && (
        <div className="cesium-controls">
          <button
            type="button"
            onClick={resetView}
          >
            Reset
          </button>

          <button
            type="button"
            onClick={topView}
          >
            Top
          </button>

          <button
            type="button"
            onClick={sideView}
          >
            Side
          </button>
        </div>
      )}

      {visible && (
        <div className="cesium-help">
          Drag to orbit · Wheel to zoom ·
          Right-drag to tilt
        </div>
      )}
    </div>
  );
}

export default CesiumViewer;