import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  cacheDir: "./.vitest",
  test: {
    clearMocks: true,
    globals: true,
    environment: "node",
    reporters: ["dot"],
    watch: false,
    include: ["**/__tests__/*.ts?(x)"],
    coverage: {
      provider: "v8",
      clean: true,
      include: ["modules/*"],
      exclude: [
        "**/types/**",
        "**/__mocks__/**",
        "**/__fixtures__/**",
        "**/assets",
        "**/contexts.ts",
        "**/enums.ts",
        "**/interfaces.ts",
      ],
      extension: ["ts", "tsx"],
      thresholds: {
        global: {
          statements: 10,
          branches: 10,
          functions: 10,
          lines: 10,
        },
      },
      reporter: ["lcovonly", ["text", { skipFull: true }]],
      reportsDirectory: "./coverage",
    },
  },
});
