import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  cacheDir: './.vitest',
  test: {
    clearMocks: true,
    globals: true,
    environment: "node",
    reporters: ["dot"],
    watch: false,
    include: ["**/__tests__/*.ts?(x)"],
  },
})
