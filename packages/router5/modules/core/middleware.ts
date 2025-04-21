import type {
  DefaultDependencies,
  Middleware,
  MiddlewareFactory,
  Router,
} from "../types/router";
import type { Unsubscribe } from "../types/base";

export default function withMiddleware<
  Dependencies extends DefaultDependencies,
>(router: Router<Dependencies>): Router<Dependencies> {
  let middlewareFactories: MiddlewareFactory<Dependencies>[] = [];
  let middlewareFunctions: Middleware[] = [];

  router.useMiddleware = (...passedMiddlewareFactories): Unsubscribe => {
    const removePluginFns: (() => void)[] = passedMiddlewareFactories.map(
      (middlewareFactory) => {
        const middleware = router.executeFactory<Middleware>(middlewareFactory);

        middlewareFactories.push(middlewareFactory);
        middlewareFunctions.push(middleware);

        return () => {
          middlewareFactories = middlewareFactories.filter(
            (curMiddlewareFactory) => {
              return curMiddlewareFactory !== middlewareFactory; // Remove the middleware factory
            },
          );
          middlewareFunctions = middlewareFunctions.filter(
            (curMiddlewareFunction) => {
              return curMiddlewareFunction !== middleware; // Remove the middleware
            },
          );
        };
      },
    );

    return () => {
      removePluginFns.forEach((fn) => {
        fn();
      });
    };
  };

  router.clearMiddleware = () => {
    middlewareFactories = [];
    middlewareFunctions = [];

    return router;
  };

  router.getMiddlewareFactories = (): MiddlewareFactory<Dependencies>[] => {
    return middlewareFactories;
  };

  router.getMiddlewareFunctions = (): Middleware[] => {
    return middlewareFunctions;
  };

  return router;
}
