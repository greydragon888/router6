import type { Params, RouteNodeState, State } from "./types/base";

export function isObjKey<T extends object>(
  key: string,
  obj: T,
): key is Extract<keyof T, string> {
  return key in obj;
}

export function isString(str: unknown): str is string {
  return typeof str === "string";
}

export function isRouteNodeState<P extends Params>(
  state: unknown,
): state is RouteNodeState<P> {
  return (
    typeof state === "object" &&
    state !== null &&
    "name" in state &&
    "params" in state &&
    "meta" in state &&
    state.name !== undefined &&
    state.params !== undefined &&
    state.meta !== undefined
  );
}

export function isState<P extends Params, MP extends Params>(
  state: unknown,
): state is State<P, MP> {
  return (
    typeof state === "object" &&
    state !== null &&
    "name" in state &&
    "params" in state &&
    "path" in state &&
    state.name !== undefined &&
    state.params !== undefined &&
    state.path !== undefined
  );
}

export function isStateMeta<M extends Params>(
  meta: unknown,
): meta is State<M>["meta"] {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "id" in meta &&
    "params" in meta &&
    "options" in meta &&
    "redirected" in meta &&
    meta.id !== undefined &&
    meta.params !== undefined &&
    meta.options !== undefined &&
    meta.redirected !== undefined
  );
}

export function isPromise<T = unknown>(obj: unknown): obj is Promise<T> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "then" in obj &&
    typeof obj.then === "function"
  );
}

export function isBoolean(val: unknown): val is boolean {
  return typeof val === "boolean";
}
