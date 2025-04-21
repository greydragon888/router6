import { constants } from "../constants";
import type {
  NavigationOptions,
  Params,
  SimpleState,
  State,
  StateMeta,
} from "../types/base";
import type { DefaultDependencies, Router } from "../types/router";
import type { RouteNode, RouteNodeState } from "route-node";

export default function withState<Dependencies extends DefaultDependencies>(
  router: Router<Dependencies>,
): Router<Dependencies> {
  let stateId = 0;
  let routerState: State | null = null;

  router.getState = () => routerState;

  router.setState = (state: State | null) => {
    routerState = state;
  };

  router.makeState = (
    name: string,
    params?: Params,
    path?: string,
    meta?: Partial<StateMeta>,
    forceId?: number,
  ): State => ({
    name,
    params: {
      ...router.config.defaultParams[name],
      ...params,
    },
    path: path ?? router.buildPath(name, params ?? {}),
    meta: meta
      ? {
          ...meta,
          id: forceId ?? ++stateId,
          params: meta.params ?? {},
          options: meta.options ?? {},
          redirected: meta.redirected ?? false,
        }
      : undefined,
  });

  router.makeNotFoundState = (
    path: string,
    options?: NavigationOptions,
  ): State =>
    router.makeState(
      constants.UNKNOWN_ROUTE,
      { path },
      path,
      options
        ? {
            options: options,
          }
        : undefined,
    );

  router.areStatesEqual = (
    state1: State | null | undefined,
    state2: State | null | undefined,
    ignoreQueryParams = true,
  ): boolean => {
    if (!state1 || !state2) {
      return !state1 === !state2;
    }

    if (state1.name !== state2.name) {
      return false;
    }

    const getUrlParams = (name: string): string[] =>
      router.rootNode
        // @ts-expect-error use private method
        .getSegmentsByName(name)
        .map((segment: RouteNode) => segment.parser!.urlParams)
        .reduce(
          (params: string[], param: string[]) => params.concat(param),
          [],
        );

    const state1Params: string[] = ignoreQueryParams
      ? getUrlParams(state1.name)
      : Object.keys(state1.params);
    const state2Params: string[] = ignoreQueryParams
      ? getUrlParams(state2.name)
      : Object.keys(state2.params);

    return (
      state1Params.length === state2Params.length &&
      state1Params.every(
        (param) => state1.params[param] === state2.params[param],
      )
    );
  };

  router.areStatesDescendants = (
    parentState: State,
    childState: State,
  ): boolean => {
    const regex = new RegExp(`^${parentState.name}\\.(.*)$`);
    if (!regex.test(childState.name)) {
      return false;
    }
    // If child state name extends parent state name, and all parent state params
    // are in child state params.
    return Object.keys(parentState.params).every(
      (p) => parentState.params[p] === childState.params[p],
    );
  };

  router.forwardState = (
    routeName: string,
    routeParams: Params,
  ): SimpleState => {
    const name = router.config.forwardMap[routeName] ?? routeName;
    const params = {
      ...router.config.defaultParams[routeName],
      ...router.config.defaultParams[name],
      ...routeParams,
    };

    return {
      name,
      params,
    };
  };

  router.buildState = (
    routeName: string,
    routeParams: Params,
  ): RouteNodeState | null => {
    const { name, params } = router.forwardState(routeName, routeParams);

    return router.rootNode.buildState(name, params);
  };

  return router;
}
