import { useEffect, useRef } from "react";
import * as THREE from "three";

// A small three.js glyph whose shape + spin are seeded by a serial hash.
// Each piece therefore gets a distinct, deterministic "sigil".
export function ThreeGlyph({ seed, size = 132 }: { seed: string; size?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Derive numbers from the hash hex.
    const h = (seed || "0").replace(/[^0-9a-f]/gi, "") || "0";
    const n1 = parseInt(h.slice(0, 4) || "1", 16) || 1;
    const n2 = parseInt(h.slice(4, 8) || "2", 16) || 2;
    const n3 = parseInt(h.slice(8, 12) || "3", 16) || 3;
    const detail = n1 % 3; // 0..2
    const hue = (n2 % 60) / 360 + 0.09; // warm band (brass/bronze)

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.z = 3.1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const geo = new THREE.IcosahedronGeometry(1.18, detail);
    const wire = new THREE.WireframeGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color().setHSL(hue, 0.62, 0.56),
      transparent: true,
      opacity: 0.92,
    });
    const lines = new THREE.LineSegments(wire, lineMat);
    scene.add(lines);

    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue, 0.5, 0.18),
      transparent: true,
      opacity: 0.5,
    });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.86, 0), coreMat);
    scene.add(core);

    const sx = 0.0026 + (n2 % 50) / 60000;
    const sy = 0.0034 + (n3 % 50) / 60000;
    lines.rotation.x = (n1 % 360) * (Math.PI / 180);
    lines.rotation.y = (n3 % 360) * (Math.PI / 180);

    let raf = 0;
    const tick = () => {
      lines.rotation.x += sx;
      lines.rotation.y += sy;
      core.rotation.y -= sx * 0.6;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      geo.dispose();
      wire.dispose();
      lineMat.dispose();
      coreMat.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [seed, size]);

  return <div ref={mountRef} style={{ width: size, height: size }} aria-hidden="true" />;
}
