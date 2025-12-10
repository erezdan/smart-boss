// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      filename: "sw.js",

      strategies: "generateSW",

      devOptions: {
        enabled: true,
        type: "module",
      },

      workbox: {
        navigateFallbackDenylist: [/^\/__\/auth\/.*/],

        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}"],
      },

      includeAssets: [
        "favicon.png",
        "apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-256.png",
        "icons/icon-512.png",
      ],

      manifest: {
        name: "Smart Boss",
        short_name: "SmartBoss",
        description: "AI Business Assistant",
        lang: "he",
        dir: "rtl",
        start_url: "/?source=pwa",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",

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

      srcDir: "src",
    }),
  ],

  server: {
    port: 5174,
  },
});
