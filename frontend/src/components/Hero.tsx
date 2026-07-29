import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as Cesium from "cesium";
import s from "../styles/Hero.module.css";

// Placeholder locations for known appraisers (A) and service centers (S).
// Real registry coordinates are off-chain; these seed the globe so the hero
// reads as a living map of "hands a piece can pass through".
const SITES: { lon: number; lat: number; label: string; kind: "A" | "S" }[] = [
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
];

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || viewerRef.current) return; // init exactly once

    let viewer: Cesium.Viewer;
    try {
      viewer = new Cesium.Viewer(el, {
        baseLayer: false as unknown as Cesium.ImageryLayer, // solid globe, no tile/token needed
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
      // If WebGL/Cesium fails, leave the scrim+copy as a graceful fallback.
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

    // Plot the sites as glowing points + labels.
    for (const site of SITES) {
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

    // Slow auto-rotation by re-aiming the camera each frame.
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
  }, []);

  return (
    <header className={s.hero}>
      <div className={s.globe} ref={ref} />
      <div className={s.scrim} />
      <div className={`shell ${s.content}`}>
        <motion.p
          className={s.kicker}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Horologe · registry no. 06—wren
        </motion.p>
        <motion.h1
          className={s.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.08 }}
        >
          Every piece is <em>a chain of hands.</em>
        </motion.h1>
        <motion.p
          className={s.sub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.3 }}
        >
          A watch is not graded here. It is <em>remembered</em>. Each timepiece opens an
          append-only chain — minted, appraised, serviced, transferred — every link
          hashed to the one before it. Read the chronology. Decide for yourself.
        </motion.p>
        <div className={s.legend}>
          <span><i className={`${s.dot} ${s.dotA}`} /> appraisers</span>
          <span><i className={`${s.dot} ${s.dotS}`} /> service centers</span>
        </div>
      </div>
      <div className={s.scrollCue}>scroll the spine ↓</div>
    </header>
  );
}
