import { mergeConfig, defineProject } from "vitest/config";
import sharedConfig from "../../vitest.config";

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      environment: "happy-dom",
      setupFiles: "./modules/setup.ts",
    },
  }),
);
