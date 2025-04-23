import { constants } from "../constants";
import { RouteNode } from "route-node";
import { isString } from "../typeGuards";
import type { Params, State } from "../types/base";
import type { Router, Route, DefaultDependencies } from "../types/router";

export default function withRoutes<Dependencies extends DefaultDependencies>(
  routes: Route<Dependencies>[] | RouteNode,
): (router: Router<Dependencies>) => Router<Dependencies> {
  return (router: Router<Dependencies>): Router<Dependencies> => {
    router.forward = (fromRoute, toRoute) => {
      router.config.forwardMap[fromRoute] = toRoute;

      return router;
    };

    const rootNode =
      routes instanceof RouteNode
        ? routes
        : new RouteNode("", "", routes, { onAdd: onRouteAdded });

    function onRouteAdded(route: Route<Dependencies>) {
      if (route.canActivate) {
        router.canActivate(route.name, route.canActivate);
      }

      if (route.forwardTo) {
        router.forward(route.name, route.forwardTo);
      }

      if (route.decodeParams) {
        router.config.decoders[route.name] = (params: Params): Params =>
          route.decodeParams!(params);
      }

      if (route.encodeParams) {
        router.config.encoders[route.name] = (params: Params): Params =>
          route.encodeParams!(params);
      }

      if (route.defaultParams) {
        router.config.defaultParams[route.name] = route.defaultParams;
      }
    }

    router.rootNode = rootNode;

    router.add = (routes, finalSort?) => {
      rootNode.add(routes, onRouteAdded, !finalSort);
      if (finalSort) {
        rootNode.sortDescendants();
      }
      return router;
    };

    router.addNode = (name, path, canActivateHandler?) => {
      rootNode.addNode(name, path);
      if (canActivateHandler) {
        router.canActivate(name, canActivateHandler);
      }
      return router;
    };

    router.isActive = (
      name: string,
      params: Params = {},
      strictEquality = false,
      ignoreQueryParams = true,
    ): boolean => {
      const activeState = router.getState();

      if (!activeState) {
        return false;
      }

      if (strictEquality || activeState.name === name) {
        return router.areStatesEqual(
          router.makeState(name, params),
          activeState,
          ignoreQueryParams,
        );
      }

      return router.areStatesDescendants(
        router.makeState(name, params),
        activeState,
      );
    };

    router.buildPath = (route: string, params?: Params): string => {
      if (route === constants.UNKNOWN_ROUTE) {
        return isString(params?.path) ? params.path : "";
      }

      const paramsWithDefault = {
        ...router.config.defaultParams[route],
        ...params,
      };

      const { trailingSlashMode, queryParamsMode, queryParams } =
        router.getOptions();
      const encodedParams = router.config.encoders[route]
        ? router.config.encoders[route](paramsWithDefault)
        : paramsWithDefault;

      // @ts-expect-error TS2379. Should make fixes to route-node
      return router.rootNode.buildPath(route, encodedParams, {
        trailingSlashMode,
        queryParamsMode,
        queryParams,
        urlParamsEncoding: router.getOptions().urlParamsEncoding,
      });
    };

    router.matchPath = <P extends Params = Params, MP extends Params = Params>(
      path: string,
      source?: string,
    ): State<P, MP> | undefined => {
      const options = router.getOptions();
      const match = router.rootNode.matchPath(path, options);

      if (match) {
        const { name, params, meta } = match;
        const decodedParams = router.config.decoders[name]
          ? router.config.decoders[name](params)
          : params;
        const { name: routeName, params: routeParams } = router.forwardState(
          name,
          decodedParams,
        );
        const builtPath = !options.rewritePathOnMatch
          ? path
          : router.buildPath(routeName, routeParams);

        return router.makeState<P, MP>(routeName, routeParams, builtPath, {
          id: 1,
          params: <MP>meta,
          options: {},
          source,
          redirected: false,
        });
      }

      return undefined;
    };

    router.setRootPath = (rootPath) => {
      router.rootNode.setPath(rootPath);
    };

    return router;
  };
}
