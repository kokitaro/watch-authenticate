import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

// watch-authenticate (Horologe) — "Chronology of objects"
// Distinct toolchain from sibling apps: Cesium + three + framer-motion + gsap.
const zipStub = fileURLToPath(new URL("./src/lib/cesium-zip-stub.js", import.meta.url));

export default defineConfig({
  base: "./",
  cacheDir: ".vite_cache",
  plugins: [react(), cesium()],
  resolve: {
    alias: {
      // Cesium's KmlDataSource imports a zip submodule that the installed
      // @zip.js version no longer exposes; we don't use KML, so stub it.
      "@zip.js/zip.js/lib/zip-no-worker.js": zipStub,
    },
  },
  server: { port: 5381 },
  build: {
    rollupOptions: {
      output: {
        // Peel the large *static* libraries into their own chunks so the entry
        // bundle stays under Vite's 500 kB warning threshold. Cesium is already
        // externalized to a global by vite-plugin-cesium, so it never enters a
        // chunk here. RainbowKit / WalletConnect / Reown keep their built-in
        // per-wallet, per-locale dynamic splitting and are left ungrouped.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/react-dom/") || id.includes("/scheduler/")) return "react-dom";
          if (id.includes("/react-router") || id.includes("/@remix-run/")) return "router";
          if (id.includes("/react/")) return "react";
          if (id.includes("/genlayer-js/")) return "genlayer";
          if (id.includes("/three/")) return "three";
          if (id.includes("/gsap/")) return "gsap";
          if (
            id.includes("/framer-motion/") ||
            id.includes("/motion-dom/") ||
            id.includes("/motion-utils/")
          ) {
            return "framer";
          }
          // @metamask/sdk pulls in a heavy transport + modal + provider stack.
          // Peel its separable dependencies into their own chunk so the SDK
          // core chunk stays under the 500 kB limit (these are leaf packages
          // w.r.t. the SDK core, so no circular chunk is formed).
          if (
            id.includes("/socket.io-client/") ||
            id.includes("/engine.io-client/") ||
            id.includes("/engine.io-parser/") ||
            id.includes("/socket.io-parser/") ||
            id.includes("/eciesjs/") ||
            id.includes("/cross-fetch/") ||
            id.includes("/@metamask/sdk-communication-layer/") ||
            id.includes("/@metamask/sdk-install-modal-web/") ||
            id.includes("/@metamask/sdk-analytics/") ||
            id.includes("/@metamask/providers/") ||
            id.includes("/@metamask/onboarding/") ||
            id.includes("/@paulmillr/qr/") ||
            id.includes("/bowser/") ||
            id.includes("/readable-stream/") ||
            id.includes("/eventemitter2/") ||
            id.includes("/obj-multiplex/")
          ) {
            return "walletsdk";
          }
          // Leaf crypto primitives have no back-dependency on viem/wagmi, so
          // they isolate cleanly without forming a circular chunk.
          if (
            id.includes("/@noble/") ||
            id.includes("/@scure/") ||
            id.includes("/@adraffy/")
          ) {
            return "cryptolib";
          }
          // viem + ox + abitype + wagmi together: folding wagmi in with viem
          // avoids the wagmi <-> crypto circular chunk Rollup flags when they
          // are split, while staying under the 500 kB limit.
          if (
            id.includes("/viem/") ||
            id.includes("/abitype/") ||
            id.includes("/ox/") ||
            id.includes("/wagmi/") ||
            id.includes("/@wagmi/")
          ) {
            return "crypto";
          }
          if (id.includes("/@tanstack/")) return "tanstack";
        },
      },
    },
  },
});
