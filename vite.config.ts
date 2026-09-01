import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  plugins: mode === "test" || process.env.VITEST ? [react()] : [react(), cloudflare()],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
}));
