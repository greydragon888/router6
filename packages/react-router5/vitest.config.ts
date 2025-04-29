import { mergeConfig, defineProject } from "vitest/config";
import sharedConfig from "../../vitest.config";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      environment: "happy-dom",
      include: ["**/__tests__/*.test.ts?(x)"],
      setupFiles: "./modules/setup.ts",
    },
  }),
);
