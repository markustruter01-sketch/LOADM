import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["server/**/*.test.ts", "shared/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./server/__tests__/setup.ts"],
  },
  resolve: { alias: { "@shared": path.resolve(import.meta.dirname, "shared"), "@": path.resolve(import.meta.dirname, "client/src") } },
});
