import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom/")) {
            return "react-dom";
          }
          if (
            id.includes("node_modules/react-router-dom/") ||
            id.includes("node_modules/react-router/")
          ) {
            return "react-router";
          }
          if (id.includes("node_modules/react/")) {
            return "react";
          }
          if (id.includes("node_modules/@mui/material")) {
            return "mui-material";
          }
          if (id.includes("node_modules/@mui/icons-material")) {
            return "mui-icons";
          }
          if (id.includes("node_modules/@firebase/")) {
            return "firebase-modules";
          }
          if (id.includes("node_modules/motion")) {
            return "motion";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
