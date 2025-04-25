import { events } from "../constants";
import type {
  TrailingSlashMode,
  QueryParamsMode,
  QueryParamsOptions,
  RouteNode,
  URLParamsEncodingType,
} from "route-node";
import type {
  State,
  SimpleState,
  Params,
  DoneFn,
  NavigationOptions,
  Unsubscribe,
  CancelFn,
  StateMeta,
  RouteNodeState,
} from "./base";
import type { RouterError } from "../RouterError";
import type { EventsKeys } from "../constants";

export interface Route<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> {
  name: string;
  path: string;
  canActivate?: ActivationFnFactory<Dependencies>;
  forwardTo?: string;
  children?: Route<Dependencies>[];
  encodeParams?: (stateParams: Params) => Params;
  decodeParams?: (pathParams: Params) => Params;
  defaultParams?: Params;
}

export interface Options {
  defaultRoute?: string;
  defaultParams?: Params;
  strictTrailingSlash: boolean;
  trailingSlashMode: TrailingSlashMode;
  queryParamsMode: QueryParamsMode;
  autoCleanUp: boolean;
  allowNotFound: boolean;
  strongMatching: boolean;
  rewritePathOnMatch: boolean;
  queryParams?: QueryParamsOptions;
  caseSensitive: boolean;
  urlParamsEncoding?: URLParamsEncodingType;
}

export type ActivationFn = (
  toState: State,
  fromState: State | undefined,
  done: DoneFn,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => boolean | Promise<boolean | object | Error | void> | State | void;

export type ActivationFnFactory<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> = (router: Router<Dependencies>, dependencies: Dependencies) => ActivationFn;

export type DefaultDependencies = Partial<Record<string, unknown>>;

export interface Config {
  decoders: Record<string, (params: Params) => Params>;
  encoders: Record<string, (params: Params) => Params>;
  defaultParams: Record<string, Params>;
  forwardMap: Record<string, string>;
}

export interface Router<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> {
  [key: symbol]: unknown;
  [key: string]: unknown;
  config: Config;

  rootNode: RouteNode;
  add: (
    routes: Route<Dependencies>[] | Route<Dependencies>,
    finalSort?: boolean,
  ) => Router<Dependencies>;
  addNode: (
    name: string,
    path: string,
    canActivateHandler?: ActivationFnFactory<Dependencies>,
  ) => Router<Dependencies>;
  isActive: (
    name: string,
    params?: Params,
    strictEquality?: boolean,
    ignoreQueryParams?: boolean,
  ) => boolean;
  buildPath: (route: string, params?: Params) => string;
  matchPath: <P extends Params = Params, MP extends Params = Params>(
    path: string,
    source?: string,
  ) => State<P, MP> | undefined;
  setRootPath: (rootPath: string) => void;

  getOptions: () => Options;
  setOption: (
    option: keyof Options,
    value: Options[keyof Options],
  ) => Router<Dependencies>;

  makeState: <P extends Params = Params, MP extends Params = Params>(
    name: string,
    params?: P,
    path?: string,
    meta?: StateMeta<MP>,
    forceId?: number,
  ) => State<P, MP>;
  makeNotFoundState: (path: string, options?: NavigationOptions) => State;
  getState: <P extends Params = Params, MP extends Params = Params>() =>
    | State<P, MP>
    | undefined;
  setState: <P extends Params = Params, MP extends Params = Params>(
    state?: State<P, MP>,
  ) => void;
  areStatesEqual: (
    state1: State | undefined,
    state2: State | undefined,
    ignoreQueryParams?: boolean,
  ) => boolean;
  areStatesDescendants: (parentState: State, childState: State) => boolean;
  forwardState: <P extends Params = Params>(
    routeName: string,
    routeParams: P,
  ) => SimpleState<P>;
  buildState: (
    routeName: string,
    routeParams: Params,
  ) => RouteNodeState | undefined;

  isStarted: () => boolean;
  start: (() => Router<Dependencies>) &
    ((done: DoneFn) => Router<Dependencies>) &
    ((startPathOrState: string | State) => Router<Dependencies>) &
    ((startPathOrState: string | State, done: DoneFn) => Router<Dependencies>);
  stop: () => void;

  canDeactivate: (
    name: string,
    canDeactivateHandler: ActivationFnFactory<Dependencies> | boolean,
  ) => Router<Dependencies>;
  clearCanDeactivate: (name: string) => Router<Dependencies>;
  canActivate: (
    name: string,
    canActivateHandler: ActivationFnFactory<Dependencies> | boolean,
  ) => Router<Dependencies>;
  getLifecycleFactories: () => [
    Record<string, ActivationFnFactory<Dependencies>>,
    Record<string, ActivationFnFactory<Dependencies>>,
  ];
  getLifecycleFunctions: () => [
    Record<string, ActivationFn>,
    Record<string, ActivationFn>,
  ];

  usePlugin: (...plugins: PluginFactory<Dependencies>[]) => Unsubscribe;
  addPlugin: (plugin: Plugin) => Router<Dependencies>;
  getPlugins: () => PluginFactory<Dependencies>[];

  useMiddleware: (
    ...middlewares: MiddlewareFactory<Dependencies>[]
  ) => Unsubscribe;
  clearMiddleware: () => Router<Dependencies>;
  getMiddlewareFactories: () => MiddlewareFactory<Dependencies>[];
  getMiddlewareFunctions: () => Middleware[];

  setDependency: (
    dependencyName: keyof Dependencies,
    dependency: Dependencies[keyof Dependencies],
  ) => Router<Dependencies>;
  setDependencies: (deps: Dependencies) => Router<Dependencies>;
  getDependencies: () => Dependencies;
  getInjectables: () => [Router<Dependencies>, Dependencies];
  executeFactory: <Return>(
    factory: (
      router: Router<Dependencies>,
      dependencies: Dependencies,
    ) => Return,
  ) => Return;

  invokeEventListeners: (
    eventName: (typeof events)[EventsKeys],
    toState?: State,
    fromState?: State,
    arg?: RouterError | NavigationOptions,
  ) => void;
  removeEventListener: (
    eventName: (typeof events)[EventsKeys],
    cb: Plugin[keyof Plugin],
  ) => void;
  addEventListener: (
    eventName: (typeof events)[EventsKeys],
    cb: Plugin[keyof Plugin],
  ) => Unsubscribe;

  cancel: () => Router<Dependencies>;
  forward: (fromRoute: string, toRoute: string) => Router<Dependencies>;
  navigate: ((routeName: string) => CancelFn) &
    ((routeName: string, routeParams: Params) => CancelFn) &
    ((routeName: string, done: DoneFn) => CancelFn) &
    ((
      routeName: string,
      routeParams: Params,
      options: NavigationOptions,
    ) => CancelFn) &
    ((routeName: string, routeParams: Params, done: DoneFn) => CancelFn) &
    ((
      routeName: string,
      routeParams: Params,
      options: NavigationOptions,
      done: DoneFn,
    ) => CancelFn);
  navigateToDefault: (() => CancelFn) &
    ((done: DoneFn) => CancelFn) &
    ((opts: NavigationOptions) => CancelFn) &
    ((opts: NavigationOptions, done: DoneFn) => CancelFn);
  transitionToState: (
    toState: State,
    fromState: State | undefined,
    opts: NavigationOptions,
    done?: DoneFn,
  ) => CancelFn;

  subscribe: (listener: SubscribeFn | Listener) => Unsubscribe | Subscription;
}

export interface Plugin {
  onStart?: () => void;
  onStop?: () => void;
  onTransitionStart?: (toState: State, fromState?: State) => void;
  onTransitionCancel?: (toState: State, fromState?: State) => void;
  onTransitionError?: (
    toState: State,
    fromState: State | undefined,
    err: RouterError,
  ) => void;
  onTransitionSuccess?: (
    toState: State,
    fromState: State | undefined,
    opts: NavigationOptions,
  ) => void;
  teardown?: () => void;
}

// eslint-disable-next-line sonarjs/redundant-type-aliases
export type Middleware = ActivationFn;

export type MiddlewareFactory<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> = (router: Router<Dependencies>, dependencies: Dependencies) => Middleware;

export type PluginFactory<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> = (router: Router<Dependencies>, dependencies: Dependencies) => Plugin;

export interface SubscribeState {
  route: State;
  previousRoute?: State | undefined;
}

export type SubscribeFn = (state: SubscribeState) => void;

export interface Listener {
  next: (val: unknown) => object;
  [key: string]: unknown;
}

export interface Subscription {
  unsubscribe: Unsubscribe;
}
