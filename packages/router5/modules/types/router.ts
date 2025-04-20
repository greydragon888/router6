import type {
  TrailingSlashMode,
  QueryParamsMode,
  QueryParamsOptions,
  RouteNode,
  RouteNodeState,
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
} from "./base";

export interface Route<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> {
  name: string;
  path: string;
  canActivate?: ActivationFnFactory<Dependencies>;
  forwardTo?: string;
  children?: Array<Route<Dependencies>>;
  encodeParams?(stateParams: Params): Params;
  decodeParams?(pathParams: Params): Params;
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
  fromState: State,
  done: DoneFn,
) => boolean | Promise<boolean | Error | void> | void;

export type ActivationFnFactory<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> = (router: Router<Dependencies>, dependencies?: Dependencies) => ActivationFn;

export type DefaultDependencies = Record<string, any>;

export interface Config {
  decoders: Record<string, any>;
  encoders: Record<string, any>;
  defaultParams: Record<string, any>;
  forwardMap: Record<string, any>;
}

export interface Router<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> {
  config: Config;

  rootNode: RouteNode;
  add(
    routes: Array<Route<Dependencies>> | Route<Dependencies>,
    finalSort?: boolean,
  ): Router<Dependencies>;
  addNode(
    name: string,
    path: string,
    canActivateHandler?: ActivationFnFactory<Dependencies>,
  ): Router<Dependencies>;
  isActive(
    name: string,
    params?: Params,
    strictEquality?: boolean,
    ignoreQueryParams?: boolean,
  ): boolean;
  buildPath(route: string, params?: Params): string;
  matchPath(path: string, source?: string): State | null;
  setRootPath(rootPath: string): void;

  getOptions(): Options;
  setOption(option: string, value: any): Router<Dependencies>;

  makeState(
    name: string,
    params?: Params,
    path?: string,
    meta?: Partial<StateMeta>,
    forceId?: number,
  ): State;
  makeNotFoundState(path: string, options?: NavigationOptions): State;
  getState(): State | null;
  setState(state: State | null): void;
  areStatesEqual(
    state1: State | null | undefined,
    state2: State | null | undefined,
    ignoreQueryParams?: boolean,
  ): boolean;
  areStatesDescendants(parentState: State, childState: State): boolean;
  forwardState(routeName: string, routeParams: Params): SimpleState;
  buildState(routeName: string, routeParams: Params): RouteNodeState | null;

  isStarted(): boolean;
  start(startPathOrState: string | State, done?: DoneFn): Router<Dependencies>;
  start(done?: DoneFn): Router<Dependencies>;
  stop(): void;

  canDeactivate(
    name: string,
    canDeactivateHandler: ActivationFnFactory<Dependencies> | boolean,
  ): Router<Dependencies>;
  clearCanDeactivate(name: string): Router<Dependencies>;
  canActivate(
    name: string,
    canActivateHandler: ActivationFnFactory<Dependencies> | boolean,
  ): Router<Dependencies>;
  getLifecycleFactories(): [
    { [key: string]: ActivationFnFactory<Dependencies> },
    { [key: string]: ActivationFnFactory<Dependencies> },
  ];
  getLifecycleFunctions(): [
    { [key: string]: ActivationFn },
    { [key: string]: ActivationFn },
  ];

  usePlugin(...plugins: Array<PluginFactory<Dependencies>>): Unsubscribe;
  addPlugin(plugin: Plugin): Router<Dependencies>;
  getPlugins(): Array<PluginFactory<Dependencies>>;

  useMiddleware(
    ...middlewares: Array<MiddlewareFactory<Dependencies>>
  ): Unsubscribe;
  clearMiddleware(): Router<Dependencies>;
  getMiddlewareFactories: () => Array<MiddlewareFactory<Dependencies>>;
  getMiddlewareFunctions: () => Middleware[];

  setDependency(
    dependencyName: keyof Dependencies,
    dependency: Dependencies[keyof Dependencies],
  ): Router<Dependencies>;
  setDependencies(deps: Dependencies): Router<Dependencies>;
  getDependencies(): Dependencies;
  getInjectables(): [Router<Dependencies>, Dependencies];
  executeFactory<Return>(
    factory: (
      router: Router<Dependencies>,
      dependencies: Dependencies,
    ) => Return,
  ): Return;

  // ToDo: improve arguments types
  invokeEventListeners: (eventName: string, ...args: unknown[]) => void;
  removeEventListener: (
    eventName: string,
    cb: (toState: State, fromState?: State) => void,
  ) => void;
  addEventListener: (
    eventName: string,
    cb: (toState: State, fromState?: State) => void,
  ) => Unsubscribe;

  cancel(): Router<Dependencies>;
  forward(fromRoute: string, toRoute: string): Router<Dependencies>;
  navigate(routeName: string): CancelFn;
  navigate(routeName: string, routeParams: Params): CancelFn;
  navigate(routeName: string, done: DoneFn): CancelFn;
  navigate(
    routeName: string,
    routeParams: Params,
    options: NavigationOptions,
  ): CancelFn;
  navigate(routeName: string, routeParams: Params, done: DoneFn): CancelFn;
  navigate(
    routeName: string,
    routeParams: Params,
    options: NavigationOptions,
    done: DoneFn,
  ): CancelFn;
  navigateToDefault(done: DoneFn | undefined): CancelFn;
  navigateToDefault(opts: NavigationOptions): CancelFn;
  navigateToDefault(
    opts: NavigationOptions,
    done: DoneFn | undefined,
  ): CancelFn;
  transitionToState(
    toState: State,
    fromState: State | null,
    opts: NavigationOptions,
    done: DoneFn,
  ): CancelFn;

  subscribe(listener: SubscribeFn | Listener): Unsubscribe | Subscription;
}

export interface Plugin {
  onStart?(): void;
  onStop?(): void;
  onTransitionStart?(toState: State, fromState?: State): void;
  onTransitionCancel?(toState: State, fromState?: State): void;
  onTransitionError?(toState: State, fromState?: State, err?: any): void;
  onTransitionSuccess?(
    toState: State,
    fromState?: State,
    opts?: NavigationOptions,
  ): void;
  teardown?(): void;
}

export type Middleware = (
  toState: State,
  fromState: State,
  done: DoneFn,
) => boolean | Promise<any> | void;

export type MiddlewareFactory<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> = (router: Router<Dependencies>, dependencies: Dependencies) => Middleware;

export type PluginFactory<
  Dependencies extends DefaultDependencies = DefaultDependencies,
> = (router: Router<Dependencies>, dependencies?: Dependencies) => Plugin;

export interface SubscribeState {
  route: State;
  previousRoute: State | null;
}

export type SubscribeFn = (state: SubscribeState) => void;

export interface Listener {
  next: (val: any) => {};
  [key: string]: any;
}

export interface Subscription {
  unsubscribe: Unsubscribe;
}
