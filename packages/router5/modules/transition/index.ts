import transitionPath, { nameToIDs } from "router5-transition-path";
import { resolve } from "./resolve";
import { constants, errorCodes } from "../constants";
import { RouterError } from "../RouterError";
import type { ActivationFn, Router } from "../types/router";
import type { State, NavigationOptions, DoneFn, CancelFn } from "../types/base";

export function transition(
  router: Router,
  toState: State,
  fromState: State | undefined,
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
      callback(new RouterError(errorCodes.TRANSITION_CANCELLED));
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
    code: string,
    err?: RouterError | Error | string,
  ): RouterError | undefined => {
    if (typeof err === "string") {
      return new RouterError(code, { message: err });
    }

    if (err instanceof RouterError) {
      err.setCode(code);

      return err;
    }

    if (err instanceof Error) {
      const result = new RouterError(code);

      result.setErrorInstance(err);

      return result;
    }

    if (typeof err === "object") {
      const result = new RouterError(code);

      result.setAdditionalFields(err);

      return result;
    }

    return undefined;
  };

  const isUnknownRoute = toState.name === constants.UNKNOWN_ROUTE;
  const asyncBase = { isCancelled, toState, fromState };

  const { toDeactivate, toActivate } = transitionPath(toState, fromState);

  const canDeactivate = (_toState: State, _fromState: State, cb: DoneFn) => {
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
        cb(makeError(errorCodes.CANNOT_DEACTIVATE, err));
      },
    );
  };

  const canActivate = (_toState: State, _fromState: State, cb: DoneFn) => {
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
      (err) => {
        cb(makeError(errorCodes.CANNOT_ACTIVATE, err));
      },
    );
  };

  const middleware = (toState: State, _fromState: State, cb: DoneFn) => {
    resolve(middlewareFunctions, { ...asyncBase }, (err, state?: State) => {
      cb(makeError(errorCodes.TRANSITION_ERR, err), state ?? toState);
    });
  };

  const pipeline = [
    !fromState || opts.forceDeactivate ? undefined : canDeactivate,
    isUnknownRoute ? undefined : canActivate,
    !middlewareFunctions.length ? undefined : middleware,
  ].filter((fn): fn is ActivationFn => Boolean(fn));

  resolve(pipeline, asyncBase, done);

  return cancel;
}
