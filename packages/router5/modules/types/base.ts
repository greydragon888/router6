import type { RouteNodeStateMeta } from "route-node/dist/RouteNode";
import type { RouterError } from "../RouterError";

export type Unsubscribe = () => void;

export type DoneFn = (err?: RouterError, state?: State) => void;

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
