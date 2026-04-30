import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    proxy: {
      // In dev, proxy /api/off → OFF to bypass CORS
      "/api/off": {
        target: "https://world.openfoodfacts.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/off/, ""),
        // OFF requires a User-Agent to avoid 503 blocks.
        // Browsers cannot set this header themselves, so the proxy sets it.
        headers: {
          "User-Agent": "FoodTracker/1.0 (https://github.com/food-tracker26; educational project)",
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Food Tracker",
        short_name: "FoodTracker",
        description: "Offline-first Ernährungs-Tracker",
        theme_color: "#10b981",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "open-food-facts",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
