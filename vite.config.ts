import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), cloudflare()],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
