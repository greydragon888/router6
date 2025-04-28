import createRouter from "./createRouter";
import transitionPath from "router5-transition-path";
import { events, errorCodes, constants } from "./constants";
import cloneRouter from "./clone";
import { RouterError } from "./RouterError";
import type { RouteNode } from "route-node";
import type { ErrorCodes, Constants } from "./constants";

// Types
export type {
  Route,
  Options,
  ActivationFn,
  ActivationFnFactory,
  Router,
  Plugin,
  PluginFactory,
  Middleware,
  SubscribeState,
  SubscribeFn,
  Listener,
  Subscription,
} from "./types/router";

export type {
  Params,
  State,
  StateMeta,
  NavigationOptions,
  DoneFn,
} from "./types/base";

export {
  createRouter,
  cloneRouter,
  transitionPath,
  constants,
  events,
  errorCodes,
  RouterError,
};

export type { ErrorCodes, Constants, RouteNode };

export default createRouter;
