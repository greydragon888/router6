import { RouterError } from "../RouterError";
import { errorCodes } from "../constants";
import { isPromise, isState } from "../typeGuards";
import type { DoneFn, State } from "../types/base";
import type { ActivationFn } from "../types/router";

type ResErrType = State | Error | undefined;

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
    fromState?: State | undefined;
    errorKey?: "segment" | undefined;
  },
  callback: DoneFn,
) {
  let remainingFunctions = Array.isArray(functions)
    ? functions
    : Object.keys(functions);

  const hasStateChanged = (toState: State, fromState?: State) =>
    fromState?.name !== toState.name ||
    fromState.params !== toState.params ||
    fromState.path !== toState.path;

  const mergeStates = (toState: State, fromState?: State): State => {
    if (fromState) {
      return {
        ...fromState,
        ...toState,
        meta: {
          id: fromState.meta?.id ?? toState.meta?.id ?? 1,
          ...toState.meta,
          params: fromState.meta?.params ?? toState.meta?.params ?? {},
          options: fromState.meta?.options ?? toState.meta?.options ?? {},
          redirected:
            fromState.meta?.redirected ?? toState.meta?.redirected ?? false,
        },
      };
    }

    return toState;
  };

  const processFn = (
    stepFn: ActivationFn,
    errBase: {
      segment?: string | undefined;
    },
    state: State,
    doneCb: (err: RouterError | undefined, state: State) => void,
  ) => {
    const done: DoneFn = (err, newState) => {
      if (err) {
        doneCb(err, state);
      } else if (newState && newState !== state && isState(newState)) {
        if (hasStateChanged(newState, state)) {
          console.error(
            "[router5][transition] Warning: state values (name, params, path) were changed during transition process.",
          );
        }

        doneCb(undefined, mergeStates(newState, state));
      } else {
        doneCb(undefined, state);
      }
    };

    const res = stepFn.call(null, state, fromState, done);

    const { segment } = errBase;

    if (isCancelled()) {
      done();
    }

    if (res === undefined) {
      // wait for done to be called
      return;
      // is activation or deactivation available?
    } else if (typeof res === "boolean") {
      if (res) {
        done();
      } else {
        // temporal code. Will be redefined
        done(new RouterError(errorCodes.TRANSITION_ERR, { segment }));
      }
      // is it a state?
    } else if ("name" in res && isState(res)) {
      done(undefined, res);
      // is it a promise?
    } else if (isPromise<ResErrType>(res)) {
      res.then(
        (resVal: ResErrType) => {
          if (resVal instanceof Error) {
            done(
              // temporal code. Will be redefined
              new RouterError(errorCodes.TRANSITION_ERR, {
                segment,
                message: resVal.message,
                stack: resVal.stack,
                cause: resVal.cause,
              }),
            );
          } else {
            done(undefined, resVal);
          }
        },
        // Посмотреть по тестам, когда актуален unknown
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        (err: Error | object | unknown) => {
          if (err instanceof Error) {
            console.error(err.stack ?? err);

            done(
              // temporal code. Will be redefined
              new RouterError(errorCodes.TRANSITION_ERR, {
                segment,
                message: err.message,
                stack: err.stack,
                cause: err.cause,
              }),
            );
          } else if (typeof err === "object") {
            done(
              // temporal code. Will be redefined
              new RouterError(errorCodes.TRANSITION_ERR, { segment, ...err }),
            );
          } else {
            // temporal code. Will be redefined
            done(new RouterError(errorCodes.TRANSITION_ERR, { segment }));
          }
        },
      );
    }
  };

  const next = (err: RouterError | undefined, state: State) => {
    if (isCancelled()) {
      callback();

      return;
    }

    if (err) {
      callback(err);

      return;
    }

    if (!remainingFunctions.length) {
      callback(undefined, state);

      return;
    }

    const firstRemainingFunctions = remainingFunctions[0];

    const errBase =
      errorKey && typeof firstRemainingFunctions === "string"
        ? { [errorKey]: firstRemainingFunctions }
        : {};

    let stepFn: ActivationFn;

    if (typeof firstRemainingFunctions !== "string") {
      stepFn = firstRemainingFunctions;
    } else if (
      !Array.isArray(functions) &&
      firstRemainingFunctions in functions
    ) {
      stepFn = functions[firstRemainingFunctions];
    } else {
      throw new Error("Invalid function name");
    }

    remainingFunctions = remainingFunctions.slice(1);

    processFn(stepFn, errBase, state, next);
  };

  next(undefined, toState);
}
