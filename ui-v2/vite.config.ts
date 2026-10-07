import { defineConfig } from "vite";
import stylex from "@stylexjs/unplugin";

export default defineConfig(({ command }) => ({
  plugins: [
    stylex.vite({
      // Match Astryx's published StyleX specificity strategy.
      useCSSLayers: false,
      dev: command !== "build",
      // Published Astryx styles use minified property keys in both environments.
      // Debug property names prevent xstyle overrides from merging with them.
      debug: false,
      enableMinifiedKeys: true,
      runtimeInjection: false,
    }),
  ],
  base: command === "build" ? "/static/v2/" : "/",
  build: { outDir: "../static/v2", emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8434",
      "/uploads": "http://127.0.0.1:8434",
      "/static/i18n": "http://127.0.0.1:8434",
      "/static/vendor": "http://127.0.0.1:8434",
      "/static/favicon.ico": "http://127.0.0.1:8434",
      "/static/img": "http://127.0.0.1:8434",
    },
  },
}));
