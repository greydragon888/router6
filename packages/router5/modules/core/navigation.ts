import { constants, errorCodes } from "../constants";
import { transition } from "../transition";
import type { DefaultDependencies, Router } from "../types/router";
import type {
  CancelFn,
  DoneFn,
  NavigationOptions,
  Params,
  State,
} from "../types/base";

const noop = () => {};

type NavigationArguments =
  | [name: string]
  | [name: string, done?: DoneFn]
  | [name: string, params?: Params, done?: DoneFn]
  | [name: string, params?: Params, opts?: NavigationOptions, done?: DoneFn];

type NavigationFn = {
  (routeName: string): CancelFn;
  (routeName: string, done?: DoneFn): CancelFn;
  (routeName: string, routeParams: Params, done?: DoneFn): CancelFn;
  (
    routeName: string,
    routeParams: Params,
    options: NavigationOptions,
    done?: DoneFn,
  ): CancelFn;
};

const getNavigationArguments = (
  args: NavigationArguments,
): [name: string, params: Params, opts: NavigationOptions, done: DoneFn] => {
  switch (args.length) {
    case 1:
      return [args[0], {}, {}, noop];
    case 2:
      if (typeof args[1] === "function") {
        return [
          args[0],
          {},
          {},
          (args as [name: string, done?: DoneFn])[1] ?? noop,
        ];
      }

      return [
        args[0],
        (args as [name: string, params?: Params])[1] ?? {},
        {},
        noop,
      ];
    case 3:
      if (typeof args[2] === "function") {
        return [
          args[0],
          (args as [name: string, params?: Params])[1] ?? {},
          {},
          (args as [name: string, params?: Params, done?: DoneFn])[2] ?? noop,
        ];
      }
      return [
        args[0],
        (
          args as [name: string, params?: Params, opts?: NavigationOptions]
        )[1] ?? {},
        (
          args as [name: string, params?: Params, opts?: NavigationOptions]
        )[2] ?? {},
        noop,
      ];
    case 4:
      return [args[0], args[1] ?? {}, args[2] ?? {}, args[3] ?? noop];
    default:
      throw new Error("Invalid number of arguments");
  }
};

type NavigationToDefaultArguments =
  | []
  | [done?: DoneFn]
  | [opts: NavigationOptions, done?: DoneFn];

const getNavigationToDefaultArguments = (
  args: NavigationToDefaultArguments,
): [opts: NavigationOptions, done?: DoneFn] => {
  switch (args.length) {
    case 0:
      return [{}, noop];
    case 1:
      if (typeof args[0] === "function") {
        return [{}, (args as [done?: DoneFn])[0]];
      }
      return [args[0] || {}, noop];
    case 2:
      return [args[0], args[1]];
    default:
      throw new Error("Invalid number of arguments");
  }
};

export default function withNavigation<
  Dependencies extends DefaultDependencies,
>(router: Router<Dependencies>): Router<Dependencies> {
  const navigate: NavigationFn = (...args: NavigationArguments): CancelFn => {
    const [name, params = {}, opts = {}, done = noop] =
      getNavigationArguments(args);

    if (!router.isStarted()) {
      done({ code: errorCodes.ROUTER_NOT_STARTED });
      return noop;
    }

    const route = router.buildState(name, params);

    if (!route) {
      const err = { code: errorCodes.ROUTE_NOT_FOUND };
      done(err);
      router.invokeEventListeners(
        constants.TRANSITION_ERROR,
        null,
        router.getState(),
        err,
      );
      return noop;
    }

    const toState = router.makeState(
      route.name,
      route.params,
      router.buildPath(route.name, route.params),
      { params: route.meta, options: opts },
    );

    const sameStates = router.getState()
      ? router.areStatesEqual(router.getState() as State, toState, false)
      : false;

    // Do not proceed further if states are the same and no reload
    // (no deactivation and no callbacks)
    if (sameStates && !opts.reload && !opts.force) {
      const err = { code: errorCodes.SAME_STATES };
      done(err);
      router.invokeEventListeners(
        constants.TRANSITION_ERROR,
        toState,
        router.getState(),
        err,
      );
      return noop;
    }

    const fromState = router.getState();

    if (opts.skipTransition) {
      done(null, toState);
      return noop;
    }

    // Transition
    return router.transitionToState(toState, fromState, opts, (err, state) => {
      if (err) {
        if (typeof err === "object" && "redirect" in err && err.redirect) {
          const { name, params } = err.redirect;

          navigate(
            name,
            params,
            { ...opts, force: true, redirected: true },
            done,
          );
        } else {
          done(err);
        }
      } else {
        router.invokeEventListeners(
          constants.TRANSITION_SUCCESS,
          state,
          fromState,
          opts,
        );
        done(null, state);
      }
    });
  };

  let cancelCurrentTransition: CancelFn | null = null;

  router.navigate = navigate;

  router.navigateToDefault = (
    ...args: NavigationToDefaultArguments
  ): CancelFn => {
    const [opts, done] = getNavigationToDefaultArguments(args);

    const options = router.getOptions();

    if (options.defaultRoute) {
      return navigate(
        options.defaultRoute,
        options.defaultParams || {},
        opts,
        done,
      );
    }

    return noop;
  };

  router.cancel = (): Router<Dependencies> => {
    if (cancelCurrentTransition) {
      cancelCurrentTransition();
      cancelCurrentTransition = null;
    }

    return router;
  };

  router.transitionToState = (
    toState: State,
    fromState: State,
    options: NavigationOptions = {},
    done: DoneFn = noop,
  ): CancelFn => {
    router.cancel();
    router.invokeEventListeners(constants.TRANSITION_START, toState, fromState);

    const callback: DoneFn = (err, state) => {
      cancelCurrentTransition = null;
      state = state || toState;

      if (err) {
        if (
          typeof err === "object" &&
          "redirect" in err &&
          err.code === errorCodes.TRANSITION_CANCELLED
        ) {
          router.invokeEventListeners(
            constants.TRANSITION_CANCEL,
            toState,
            fromState,
          );
        } else {
          router.invokeEventListeners(
            constants.TRANSITION_ERROR,
            toState,
            fromState,
            err,
          );
        }
        done(err);
      } else {
        router.setState(state);
        done(null, state);
      }
    };

    cancelCurrentTransition = transition(
      router as Router,
      toState,
      fromState,
      options,
      callback,
    );

    return cancelCurrentTransition;
  };

  return router;
}
