import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        ai: path.resolve(__dirname, "ai.html"),
        cards: path.resolve(__dirname, "cards.html"),
        notes: path.resolve(__dirname, "notes.html"),
      },
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    proxy: {
      "/agent-api": {
        target: "http://localhost:20129",
        rewrite: (path) => path.replace(/^\/agent-api/, ""),
      },
      "/duet-api": {
        target: "http://localhost:3100",
        rewrite: (path) => path.replace(/^\/duet-api/, "/api"),
      },
    },
  },
});
