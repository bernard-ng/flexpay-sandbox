import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

const apiTarget = process.env.FLEXPAY_API_URL ?? "http://127.0.0.1:8080";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwind(), tanstackStart({ spa: { enabled: true } }), react()],

  // Keep the prerender server and its requests on the same loopback address.
  preview: { host: "127.0.0.1" },

  server: {
    proxy: {
      "/api": apiTarget,
      "/v1.1": apiTarget,
      "/health": apiTarget,
    },
  },
});
