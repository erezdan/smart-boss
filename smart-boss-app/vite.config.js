import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      devOptions: {
        enabled: false,
      },

      manifest: {
        name: "Smart Boss",
        short_name: "SmartBoss",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        description: "AI Business Assistant",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-256.png",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        navigateFallback: "/",
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },

      includeAssets: ["/apple-touch-icon.png"],
    }),
  ],
  server: {
    port: 5174,
  },
});
