import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwind(), tanstackStart({ spa: { enabled: true } }), react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8080",
      "/v1.1": "http://127.0.0.1:8080",
      "/health": "http://127.0.0.1:8080",
    },
  },
});
