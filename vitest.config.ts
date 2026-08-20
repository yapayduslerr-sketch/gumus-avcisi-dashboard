import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    root: ".",
    include: ["server/**/*.test.ts", "client/src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
