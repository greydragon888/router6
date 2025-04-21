// @ts-check

import eslintConfig from "../../eslint.config.mjs";
import tsEslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import testingLibraryPlugin from "eslint-plugin-testing-library";

export default tsEslint.config(
  ...eslintConfig,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  reactHooksPlugin.configs["recommended-latest"],
  {
    files: ["**/__tests__/*.test.tsx"],
    ...testingLibraryPlugin.configs["flat/react"],
  },
);
