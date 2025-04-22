import { type Params, Router, State } from "router5";

export type RouteContext = {
  router: Router;
} & RouteState;

export interface RouteState<
  P extends Params = Params,
  MP extends Params = Params,
> {
  route: State<P, MP> | undefined;
  previousRoute?: State | undefined;
}

export type UnsubscribeFn = () => void;
