import { constants } from "../constants";
import { isRouteNodeState, isState } from "../typeGuards";
import type {
  NavigationOptions,
  Params,
  RouteNodeState,
  SimpleState,
  State,
  StateMeta,
} from "../types/base";
import type { DefaultDependencies, Router } from "../types/router";
import type { RouteNode } from "route-node";

export default function withState<Dependencies extends DefaultDependencies>(
  router: Router<Dependencies>,
): Router<Dependencies> {
  let stateId = 0;
  let routerState: State | undefined = undefined;

  router.getState = <
    P extends Params = Params,
    MP extends Params = Params,
  >() => (isState<P, MP>(routerState) ? routerState : undefined);

  router.setState = (state: State | undefined) => {
    routerState = state;
  };

  router.makeState = <P extends Params = Params, MP extends Params = Params>(
    name: string,
    params?: P,
    path?: string,
    meta?: StateMeta<MP>,
    forceId?: number,
  ): State<P, MP> => ({
    name,
    // Important! It is not true!!! Idk what is defaultParams type
    // Надо подумать, как привести router.config.defaultParams к P
    params: <P>{
      ...router.config.defaultParams[name],
      ...(params ?? {}),
    },
    path: path ?? router.buildPath(name, params),
    // write guard is meta
    meta: meta
      ? {
          ...meta,
          id: forceId ?? ++stateId,
          params: meta.params,
          options: meta.options,
          redirected: meta.redirected,
        }
      : undefined,
  });

  router.makeNotFoundState = (
    path: string,
    options?: NavigationOptions,
  ): State =>
    router.makeState<{ path: string }>(
      constants.UNKNOWN_ROUTE,
      { path },
      path,
      options
        ? {
            id: ++stateId,
            options,
            params: {},
            redirected: false,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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

  router.forwardState = <P extends Params = Params>(
    routeName: string,
    routeParams: P,
    // ToDo: it is not shure if this is correct
  ): SimpleState<P> => {
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

  router.buildState = <P extends Params = Params>(
    routeName: string,
    routeParams: P,
  ): RouteNodeState<P> | undefined => {
    const { name, params } = router.forwardState(routeName, routeParams);

    const state = router.rootNode.buildState(name, params);

    return isRouteNodeState<P>(state) ? state : undefined;
  };

  return router;
}
