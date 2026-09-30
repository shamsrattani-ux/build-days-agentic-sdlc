import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    // Vite normalizes resolved paths via fs.realpathSync by default, which
    // resolves the `subst`-mapped X: drive (used to work around Windows'
    // 260-char MAX_PATH limit on this deeply nested worktree) back to its
    // long real path and breaks module resolution consistency. Preserve the
    // drive-letter path as-is instead.
    preserveSymlinks: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
});
