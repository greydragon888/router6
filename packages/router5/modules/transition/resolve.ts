import type { DoneFn, State } from "../types/base";
import type { ActivationFn } from "../types/router";

type StepFnType = (
  toState?: State,
  fromState?: State,
  done?: DoneFn,
) => State | Promise<State | Error | undefined> | boolean | undefined;

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
    errorKey?: string;
  },
  callback: DoneFn,
) {
  let remainingFunctions = Array.isArray(functions)
    ? functions
    : Object.keys(functions);

  const isState = (obj: Partial<State>) =>
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
            params: fromState.meta?.params ?? toState.meta?.params ?? {},
            options: fromState.meta?.options ?? toState.meta?.options ?? {},
            redirected:
              fromState.meta?.redirected ?? toState.meta?.redirected ?? false,
          },
        }
      : toState;

  const processFn = (
    stepFn: StepFnType,
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

        doneCb(undefined, mergeStates(newState, state));
      } else {
        doneCb(undefined, state);
      }
    };

    const res = stepFn.call(null, state, fromState, done);

    type ResErrType = State | Error | undefined;

    if (isCancelled()) {
      done();
    }

    if (res === undefined) {
      // wait for done to be called
      return;
    } else if (typeof res === "boolean") {
      done(res ? undefined : errBase);
      // is it a state?
    } else if ("name" in res && isState(res)) {
      done(undefined, res);
      // is it a promise?
    } else if ("then" in res) {
      (res as Promise<ResErrType>).then(
        (resVal: ResErrType) => {
          if (resVal instanceof Error) {
            done({ error: resVal });
          } else {
            done(undefined, resVal);
          }
        },
        (err: unknown) => {
          if (err instanceof Error) {
            console.error(err.stack ?? err);

            done({ ...errBase, promiseError: err });
          } else {
            done(typeof err === "object" ? { ...errBase, ...err } : errBase);
          }
        },
      );
    }
  };

  const next: DoneFn = (err, state) => {
    if (isCancelled()) {
      callback();
    } else if (err) {
      callback(err);
    } else {
      if (!remainingFunctions.length) {
        callback(undefined, state);
      } else {
        const isMapped = typeof remainingFunctions[0] === "string";
        const errBase =
          errorKey && isMapped ? { [errorKey]: remainingFunctions[0] } : {};
        const stepFn = isMapped
          ? (functions as Record<string, StepFnType>)[
              remainingFunctions[0] as string
            ]
          : (remainingFunctions[0] as StepFnType);

        remainingFunctions = remainingFunctions.slice(1);

        processFn(stepFn, errBase, state, next);
      }
    }
  };

  next(undefined, toState);
}
