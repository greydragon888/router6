import type { Plugin, PluginFactory } from "router5";
import type { Params } from "router5";

const getDefinedParams = (params: Params) =>
  Object.keys(params)
    .filter((param) => params[param] !== undefined)
    .reduce((acc, param) => ({ ...acc, [param]: params[param] }), {});

function persistentParamsPluginFactory(
  params: Params | string[] = {},
): PluginFactory {
  return function persistentParamsPlugin(router): Plugin {
    // Persistent parameters
    const persistentParams: Params = Array.isArray(params)
      ? params.reduce((acc, param) => ({ ...acc, [param]: undefined }), {})
      : params;

    const paramNames = Object.keys(persistentParams);
    const hasQueryParams = router.rootNode.path.includes("?");
    const queryParamsStr = `${hasQueryParams ? "&" : "?"}${paramNames.join("&")}`;
    const search = queryParamsStr.length ? queryParamsStr : "";

    // Root node path
    const path = router.rootNode.path.split("?")[0] + search;

    router.setRootPath(path);

    const originalBuildPath = router.buildPath.bind(router);
    const originalBuildState = router.buildState.bind(router);

    // Decorators

    router.buildPath = (route, params) => {
      const routeParams = {
        ...getDefinedParams(persistentParams),
        ...params,
      };
      return originalBuildPath(route, routeParams);
    };

    router.buildState = (route, params) => {
      const routeParams = {
        ...getDefinedParams(persistentParams),
        ...params,
      };
      return originalBuildState(route, routeParams);
    };

    return {
      onTransitionSuccess(toState) {
        Object.keys(toState.params)
          .filter((param) => paramNames.includes(param))
          .forEach(
            (param) => (persistentParams[param] = toState.params[param]),
          );
      },
    };
  };
}

export default persistentParamsPluginFactory;
