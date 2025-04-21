import transitionPath, { nameToIDs } from "router5-transition-path";
import { resolve } from "./resolve";
import { constants, errorCodes } from "../constants";
import type { ActivationFn, Router } from "../types/router";
import type {
  State,
  NavigationOptions,
  DoneFn,
  CancelFn,
  DoneFnError,
} from "../types/base";

export function transition(
  router: Router,
  toState: State,
  fromState: State | null,
  opts: NavigationOptions,
  callback: DoneFn,
): CancelFn {
  let cancelled = false;
  let completed = false;

  const options = router.getOptions();
  const [canDeactivateFunctions, canActivateFunctions] =
    router.getLifecycleFunctions();
  const middlewareFunctions = router.getMiddlewareFunctions();
  const isCancelled = () => cancelled;
  const cancel = () => {
    if (!cancelled && !completed) {
      cancelled = true;
      callback({ code: errorCodes.TRANSITION_CANCELLED });
    }
  };
  const done: DoneFn = (err, state) => {
    completed = true;

    if (isCancelled()) {
      return;
    }

    if (!err && options.autoCleanUp) {
      const activeSegments = nameToIDs(toState.name);
      Object.keys(canDeactivateFunctions).forEach((name) => {
        if (!activeSegments.includes(name)) {
          router.clearCanDeactivate(name);
        }
      });
    }

    callback(err, state ?? toState);
  };
  const makeError = (
    base: { code: string },
    err?: Record<string, unknown> | Error | string | null,
  ) => ({
    ...base,
    ...(err && Object.keys(err).length ? (err as object) : { error: err }),
  });

  const isUnknownRoute = toState.name === constants.UNKNOWN_ROUTE;
  const asyncBase = { isCancelled, toState, fromState };
  const { toDeactivate, toActivate } = transitionPath(toState, fromState);

  const canDeactivate =
    !fromState || opts.forceDeactivate
      ? undefined
      : (_toState: State, _fromState: State, cb: DoneFn) => {
          const canDeactivateFunctionMap = toDeactivate
            .filter((name) => name in canDeactivateFunctions)
            .reduce(
              (fnMap, name) => ({
                ...fnMap,
                [name]: canDeactivateFunctions[name],
              }),
              {},
            );

          resolve(
            canDeactivateFunctionMap,
            { ...asyncBase, errorKey: "segment" },
            (err) => {
              cb(
                err
                  ? makeError({ code: errorCodes.CANNOT_DEACTIVATE }, err)
                  : null,
              );
            },
          );
        };

  const canActivate = isUnknownRoute
    ? undefined
    : (_toState: State, _fromState: State, cb: DoneFn) => {
        const canActivateFunctionMap = toActivate
          .filter((name) => name in canActivateFunctions)
          .reduce(
            (fnMap, name) => ({
              ...fnMap,
              [name]: canActivateFunctions[name],
            }),
            {},
          );

        resolve(
          canActivateFunctionMap,
          { ...asyncBase, errorKey: "segment" },
          (err?: DoneFnError) => {
            cb(
              err ? makeError({ code: errorCodes.CANNOT_ACTIVATE }, err) : null,
            );
          },
        );
      };

  const middleware = !middlewareFunctions.length
    ? undefined
    : (toState: State, _fromState: State, cb: DoneFn) => {
        resolve(middlewareFunctions, { ...asyncBase }, (err, state?: State) => {
          cb(
            err ? makeError({ code: errorCodes.TRANSITION_ERR }, err) : null,
            state ?? toState,
          );
        });
      };

  const pipeline = [canDeactivate, canActivate, middleware].filter(
    Boolean,
  ) as ActivationFn[];

  resolve(pipeline, asyncBase, done);

  return cancel;
}
