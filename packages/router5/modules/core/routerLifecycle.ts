import { constants, errorCodes } from "../constants";
import type { DefaultDependencies, Router } from "../types/router";
import type { DoneFn, DoneFnError, State } from "../types/base";

const noop = () => {};

type StartRouterArguments =
  | []
  | [done: DoneFn]
  | [startPathOrState: string | State]
  | [startPathOrState: string | State, done: DoneFn];

const getStartRouterArguments = (
  args: StartRouterArguments,
): [startPathOrState: string | State | undefined, done: DoneFn] => {
  switch (args.length) {
    case 0:
      return [undefined, noop];
    case 1:
      if (typeof args[0] === "function") {
        return [undefined, args[0]];
      }
      return [args[0], noop];
    case 2:
      return [args[0], args[1]];
    default:
      throw new Error("Invalid number of arguments");
  }
};

export default function withRouterLifecycle<
  Dependencies extends DefaultDependencies,
>(router: Router<Dependencies>): Router<Dependencies> {
  let started = false;

  router.isStarted = (): boolean => started;

  router.start = (...args: StartRouterArguments): Router<Dependencies> => {
    const options = router.getOptions();
    const [startPathOrState, done] = getStartRouterArguments(args);

    if (started) {
      done({ code: errorCodes.ROUTER_ALREADY_STARTED });
      return router;
    }

    let startPath = "",
      startState;

    started = true;
    router.invokeEventListeners(constants.ROUTER_START);

    // callback
    const cb = (err: DoneFnError, state?: State, invokeErrCb = true) => {
      if (!err)
        router.invokeEventListeners(constants.TRANSITION_SUCCESS, state, null, {
          replace: true,
        });
      if (err && invokeErrCb)
        router.invokeEventListeners(
          constants.TRANSITION_ERROR,
          state,
          null,
          err,
        );
      done(err, state);
    };

    if (startPathOrState === undefined && !options.defaultRoute) {
      cb({ code: errorCodes.NO_START_PATH_OR_STATE });
      return router;
    }
    if (typeof startPathOrState === "string") {
      startPath = startPathOrState;
    } else if (typeof startPathOrState === "object") {
      startState = startPathOrState;
    }

    if (!startState) {
      // If no supplied start state, get start state
      startState = startPath === undefined ? null : router.matchPath(startPath);

      // Navigate to default function
      const navigateToDefault = () =>
        router.navigateToDefault({ replace: true }, done);

      const redirect = (state: State) =>
        router.navigate(
          state.name,
          state?.params ?? {},
          { replace: true, reload: true, redirected: true },
          done,
        );

      const transitionToState = (state: State) => {
        router.transitionToState(state, router.getState(), {}, (err, state) => {
          if (!err) {
            cb(null, state);
          } else if (
            typeof err === "object" &&
            "redirect" in err &&
            err.redirect
          ) {
            redirect(err.redirect);
          } else if (options.defaultRoute) {
            navigateToDefault();
          } else {
            cb(err, undefined, false);
          }
        });
      };
      // If matched start path
      if (startState) {
        transitionToState(startState);
      } else if (options.defaultRoute) {
        // If default, navigate to default
        navigateToDefault();
      } else if (options.allowNotFound) {
        transitionToState(
          router.makeNotFoundState(startPath, { replace: true }),
        );
      } else {
        // No start match, no default => do nothing
        cb({ code: errorCodes.ROUTE_NOT_FOUND, path: startPath });
      }
    } else {
      // Initialise router with provided start state
      router.setState(startState);
      cb(null, startState);
    }

    return router;
  };

  router.stop = (): Router<Dependencies> => {
    if (started) {
      router.setState(null);
      started = false;
      router.invokeEventListeners(constants.ROUTER_STOP);
    }

    return router;
  };

  return router;
}
