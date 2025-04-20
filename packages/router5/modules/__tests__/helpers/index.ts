import type { State } from "../../types/base";

export { default as createTestRouter } from "./testRouters";

export function omitMeta(obj: State) {
  return {
    name: obj.name,
    params: obj.params,
    path: obj.path,
  };
}
