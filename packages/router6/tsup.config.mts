import { createIsomorphicConfig } from "../../tsup.base.mjs";

// Bundle private dependencies into the output
export default createIsomorphicConfig({
  noExternal: ["route-tree", "search-params", "type-guards", "router6-types"],
});
