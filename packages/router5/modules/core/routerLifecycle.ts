import { events, errorCodes } from "../constants";
import { RouterError } from "../RouterError";
import type { DefaultDependencies, Router } from "../types/router";
import type { DoneFn, State } from "../types/base";

const noop = () => undefined;

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
      done(new RouterError(errorCodes.ROUTER_ALREADY_STARTED));
      return router;
    }

    let startPath = "",
      startState;

    started = true;
    router.invokeEventListeners(events.ROUTER_START);

    // callback
    const cb = (err?: RouterError, state?: State, invokeErrCb = true) => {
      if (!err) {
        router.invokeEventListeners(
          events.TRANSITION_SUCCESS,
          state,
          undefined,
          {
            replace: true,
          },
        );
      }
      if (err && invokeErrCb) {
        router.invokeEventListeners(
          events.TRANSITION_ERROR,
          state,
          undefined,
          err,
        );
      }
      done(err, state);
    };

    if (startPathOrState === undefined && !options.defaultRoute) {
      cb(new RouterError(errorCodes.NO_START_PATH_OR_STATE));
      return router;
    }
    if (typeof startPathOrState === "string") {
      startPath = startPathOrState;
    } else if (typeof startPathOrState === "object") {
      startState = startPathOrState;
    }

    if (!startState) {
      // If no supplied start state, get start state
      startState = !startPath ? null : router.matchPath(startPath);

      // Navigate to default function
      const navigateToDefault = () =>
        router.navigateToDefault({ replace: true }, done);

      const redirect = (state: State) =>
        router.navigate(
          state.name,
          state.params,
          { replace: true, reload: true, redirected: true },
          done,
        );

      const transitionToState = (state: State) => {
        router.transitionToState(state, router.getState(), {}, (err, state) => {
          if (!err) {
            cb(undefined, state);
          } else if (err.redirect) {
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
        cb(new RouterError(errorCodes.ROUTE_NOT_FOUND, { path: startPath }));
      }
    } else {
      // Initialise router with provided start state
      router.setState(startState);
      cb(undefined, startState);
    }

    return router;
  };

  router.stop = (): Router<Dependencies> => {
    if (started) {
      router.setState(undefined);
      started = false;
      router.invokeEventListeners(events.ROUTER_STOP);
    }

    return router;
  };

  return router;
}
