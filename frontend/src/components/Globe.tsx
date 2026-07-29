import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

// A self-contained, token-free Cesium globe that slowly auto-rotates and pins
// known appraiser (A) + service-center (S) cities. Extracted so both the
// landing hero and any future view can mount it without duplicating setup.
// Coordinates are illustrative seeds — real registry sites live off-chain.
export interface GlobeSite {
  lon: number;
  lat: number;
  label: string;
  kind: "A" | "S";
}

export const DEFAULT_SITES: GlobeSite[] = [
  { lon: 6.143, lat: 46.204, label: "Geneva", kind: "S" },
  { lon: 6.213, lat: 46.586, label: "Le Brassus", kind: "S" },
  { lon: 13.793, lat: 50.85, label: "Glashütte", kind: "S" },
  { lon: 139.69, lat: 35.68, label: "Tokyo", kind: "A" },
  { lon: -74.006, lat: 40.712, label: "New York", kind: "A" },
  { lon: -0.127, lat: 51.507, label: "London", kind: "A" },
  { lon: 114.17, lat: 22.32, label: "Hong Kong", kind: "S" },
  { lon: 55.27, lat: 25.2, label: "Dubai", kind: "A" },
  { lon: 2.349, lat: 48.864, label: "Paris", kind: "A" },
  { lon: 8.541, lat: 47.376, label: "Zürich", kind: "S" },
  { lon: 116.41, lat: 39.9, label: "Beijing", kind: "A" },
  { lon: -118.24, lat: 34.05, label: "Los Angeles", kind: "A" },
];

export function Globe({
  className,
  sites = DEFAULT_SITES,
}: {
  className?: string;
  sites?: GlobeSite[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || viewerRef.current) return; // init exactly once

    let viewer: Cesium.Viewer;
    try {
      viewer = new Cesium.Viewer(el, {
        baseLayer: false as unknown as Cesium.ImageryLayer,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        selectionIndicator: false,
        infoBox: false,
        creditContainer: document.createElement("div"),
      });
    } catch {
      return;
    }
    viewerRef.current = viewer;

    const scene = viewer.scene;
    scene.globe.baseColor = Cesium.Color.fromCssColorString("#241c15");
    scene.globe.showGroundAtmosphere = false;
    scene.backgroundColor = Cesium.Color.fromCssColorString("#120d09");
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
    if (scene.skyBox) scene.skyBox.show = false;
    if (scene.sun) scene.sun.show = false;
    if (scene.moon) scene.moon.show = false;
    scene.fog.enabled = false;
    viewer.scene.screenSpaceCameraController.enableInputs = false;

    for (const site of sites) {
      const color =
        site.kind === "A"
          ? Cesium.Color.fromCssColorString("#e8c466")
          : Cesium.Color.fromCssColorString("#8b5a2b");
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(site.lon, site.lat),
        point: {
          pixelSize: 8,
          color,
          outlineColor: Cesium.Color.fromCssColorString("#1a1410"),
          outlineWidth: 1.5,
        },
        label: {
          text: site.label,
          font: "12px 'IBM Plex Mono', monospace",
          fillColor: Cesium.Color.fromCssColorString("#f3e9d2"),
          style: Cesium.LabelStyle.FILL,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          scale: 0.8,
          translucencyByDistance: new Cesium.NearFarScalar(1.5e7, 1.0, 4.0e7, 0.0),
        },
      });
    }

    let lon = 18;
    const onPre = () => {
      lon += 0.045;
      if (lon > 360) lon -= 360;
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(lon, 16, 24_000_000),
      });
    };
    scene.preRender.addEventListener(onPre);

    return () => {
      try {
        scene.preRender.removeEventListener(onPre);
        if (!viewer.isDestroyed()) viewer.destroy();
      } catch {
        /* noop */
      }
      viewerRef.current = null;
    };
  }, [sites]);

  return <div className={className} ref={ref} />;
}
