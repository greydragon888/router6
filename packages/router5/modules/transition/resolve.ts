import type { DoneFn, State } from "../types/base";
import type { ActivationFn } from "../types/router";

export function resolve(
  functions: ActivationFn[] | Record<string, ActivationFn>,
  {
    isCancelled,
    toState,
    fromState,
    errorKey = undefined,
  }: {
    isCancelled: () => boolean;
    toState: State;
    fromState: State | null;
    errorKey?: string;
  },
  callback: DoneFn,
) {
  let remainingFunctions = Array.isArray(functions)
    ? functions
    : Object.keys(functions);

  const isState = (obj?: State) =>
    typeof obj === "object" &&
    obj.name !== undefined &&
    obj.params !== undefined &&
    obj.path !== undefined;

  const hasStateChanged = (toState: State, fromState?: State) =>
    fromState?.name !== toState.name ||
    fromState.params !== toState.params ||
    fromState.path !== toState.path;

  const mergeStates = (toState: State, fromState?: State): State =>
    fromState
      ? {
          ...fromState,
          ...toState,
          meta: {
            id: fromState.meta?.id ?? toState.meta?.id ?? 1,
            ...toState.meta,
            params: fromState.params ?? toState.params,
            options: fromState.params ?? toState.params,
            redirected:
              fromState.meta?.redirected ?? toState.meta?.redirected ?? false,
          },
        }
      : toState;

  const processFn = (
    stepFn: Function,
    errBase: Record<string, unknown>,
    state: State | undefined,
    doneCb: DoneFn,
  ) => {
    const done: DoneFn = (err, newState) => {
      if (err) {
        doneCb(err);
      } else if (newState && newState !== state && isState(newState)) {
        if (hasStateChanged(newState, state)) {
          console.error(
            "[router5][transition] Warning: state values (name, params, path) were changed during transition process.",
          );
        }

        doneCb(null, mergeStates(newState, state));
      } else {
        doneCb(null, state);
      }
    };

    const res = stepFn.call(null, state, fromState, done);

    if (isCancelled()) {
      done(null);
    } else if (typeof res === "boolean") {
      done(res ? null : errBase);
    } else if (isState(res)) {
      done(null, res);
    } else if (res && typeof res.then === "function") {
      res.then(
        (resVal?: State | Error) => {
          if (resVal instanceof Error) done({ error: resVal });
          else done(null, resVal);
        },
        (err: Error | object) => {
          if (err instanceof Error) {
            console.error(err.stack || err);

            done({ ...errBase, promiseError: err });
          } else {
            done(typeof err === "object" ? { ...errBase, ...err } : errBase);
          }
        },
      );
    }
    // else: wait for done to be called
  };

  const next: DoneFn = (err, state) => {
    if (isCancelled()) {
      callback();
    } else if (err) {
      callback(err);
    } else {
      if (!remainingFunctions.length) {
        callback(null, state);
      } else {
        const isMapped = typeof remainingFunctions[0] === "string";
        const errBase =
          errorKey && isMapped ? { [errorKey]: remainingFunctions[0] } : {};
        const stepFn = isMapped
          ? (functions as Record<string, Function>)[
              remainingFunctions[0] as string
            ]
          : (remainingFunctions[0] as Function);

        remainingFunctions = remainingFunctions.slice(1);

        processFn(stepFn, errBase, state, next);
      }
    }
  };

  next(null, toState);
}
