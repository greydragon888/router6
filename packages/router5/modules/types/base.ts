import type { RouteNodeStateMeta } from "route-node/dist/RouteNode";

export type Unsubscribe = () => void;

export type DoneFnError =
  | {
      code?: string;
      error?: State | Error;
      segment?: string;
      reason?: string;
      redirect?: State;
      [key: string]: unknown;
    } // Errors with a code and additional properties
  | { promiseError: Error; redirect?: State; [key: string]: unknown } // Errors from promises
  | Error // Standard errors
  | string; // String errors

export type DoneFn = (err?: DoneFnError, state?: State) => void;

export type CancelFn = () => void;

export interface RouteNodeState<P extends Params = Params> {
  name: string;
  params: P;
  meta: RouteNodeStateMeta;
}

export interface SimpleState<P extends Params = Params> {
  name: string;
  params: P;
}

export interface State<P extends Params = Params, MP extends Params = Params> {
  name: string;
  params: P;
  path: string;
  meta?: StateMeta<MP> | undefined;
}

export interface StateMeta<P extends Params = Params> {
  id: number;
  params: P;
  options: NavigationOptions;
  redirected: boolean;
  source?: string | undefined;
}

export interface NavigationOptions {
  replace?: boolean;
  reload?: boolean;
  skipTransition?: boolean;
  force?: boolean;
  [key: string]:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | undefined;
}

export interface Params {
  [key: string]:
    | string
    | number
    | boolean
    | Params
    | Record<string, string>
    | undefined;
}
