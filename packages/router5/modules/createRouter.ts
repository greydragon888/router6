import withOptions from "./core/options";
import withRoutes from "./core/routes";
import withDependencies from "./core/dependencies";
import withState from "./core/state";
import withPlugins from "./core/plugins";
import withMiddleware from "./core/middleware";
import withObservability from "./core/observable";
import withNavigation from "./core/navigation";
import withRouterLifecycle from "./core/routerLifecycle";
import withRouteLifecycle from "./core/routeLifecycle";
import type { RouteNode } from "route-node";
import type {
  DefaultDependencies,
  Options,
  Route,
  Router,
} from "./types/router";

type Enhancer<Dependencies extends DefaultDependencies = DefaultDependencies> =
  (router: Router<Dependencies>) => Router<Dependencies>;

const pipe =
  <Dependencies extends DefaultDependencies = DefaultDependencies>(
    ...fns: Enhancer<Dependencies>[]
  ) =>
  (arg: Router<Dependencies>): Router<Dependencies> =>
    fns.reduce((prev: Router<Dependencies>, fn) => fn(prev), arg);

const createRouter = <
  Dependencies extends DefaultDependencies = DefaultDependencies,
>(
  routes: Route<Dependencies>[] | RouteNode = [],
  options: Partial<Options> = {},
  dependencies: Dependencies = <Dependencies>{},
): Router<Dependencies> => {
  const uninitializedRouter = {
    config: {
      decoders: {},
      encoders: {},
      defaultParams: {},
      forwardMap: {},
    },
  };

  return pipe<Dependencies>(
    withOptions(options),
    withDependencies(dependencies),
    withObservability,
    withState,
    withRouterLifecycle,
    withRouteLifecycle,
    withNavigation,
    withPlugins,
    withMiddleware,
    withRoutes(routes),
  )(<Router<Dependencies>>uninitializedRouter);
};

export default createRouter;
