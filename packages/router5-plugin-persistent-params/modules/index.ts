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
    if (!router) {
      throw new Error("Router instance is required");
    }

    // Persistent parameters
    const persistentParams: Params = Array.isArray(params)
      ? params.reduce((acc, param) => ({ ...acc, [param]: undefined }), {})
      : params;

    const paramNames = Object.keys(persistentParams);
    const hasQueryParams = router.rootNode.path.indexOf("?") !== -1;
    const queryParams = paramNames.join("&");
    const search = queryParams
      ? `${hasQueryParams ? "&" : "?"}${queryParams}`
      : "";

    // Root node path
    const path = router.rootNode.path.split("?")[0] + search;
    router.setRootPath(path);

    const { buildPath, buildState } = router;

    // Decorators
    router.buildPath = function (route, params) {
      const routeParams = {
        ...getDefinedParams(persistentParams),
        ...params,
      };
      return buildPath.call(router, route, routeParams);
    };

    router.buildState = function (route, params) {
      const routeParams = {
        ...getDefinedParams(persistentParams),
        ...params,
      };
      return buildState.call(router, route, routeParams);
    };

    return {
      onTransitionSuccess(toState) {
        if (!toState) {
          throw new Error("State is required");
        }

        Object.keys(toState.params)
          .filter((param) => paramNames.indexOf(param) !== -1)
          .forEach(
            (param) => (persistentParams[param] = toState.params[param]),
          );
      },
    };
  };
}

export default persistentParamsPluginFactory;
