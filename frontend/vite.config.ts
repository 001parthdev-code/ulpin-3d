import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePluginCesium from "vite-plugin-cesium";

export default defineConfig({
  plugins: [
    react(),
    vitePluginCesium(),
  ],

  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
});