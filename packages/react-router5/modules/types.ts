import { Router, State } from "router5";

export type RouteContext = {
  router: Router;
} & RouteState;

export interface RouteState {
  route?: State | undefined;
  previousRoute?: State | undefined;
}

export type UnsubscribeFn = () => void;
