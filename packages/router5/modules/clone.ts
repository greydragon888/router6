import createRouter from "./createRouter";
import type { DefaultDependencies, Router } from "./types/router";

export default function cloneRouter<Dependencies extends DefaultDependencies>(
  router: Router<Dependencies>,
  dependencies?: Dependencies,
): Router<Dependencies> {
  const middlewareFactories = router.getMiddlewareFactories();

  const clonedRouter = createRouter<Dependencies>(
    router.rootNode,
    router.getOptions(),
    dependencies,
  );

  clonedRouter.useMiddleware(...middlewareFactories);
  clonedRouter.usePlugin(...router.getPlugins());
  clonedRouter.config = router.config;

  const [canDeactivateFactories, canActivateFactories] =
    router.getLifecycleFactories();

  Object.keys(canDeactivateFactories).forEach((name) =>
    clonedRouter.canDeactivate(name, canDeactivateFactories[name]),
  );
  Object.keys(canActivateFactories).forEach((name) =>
    clonedRouter.canActivate(name, canActivateFactories[name]),
  );

  return clonedRouter;
}
