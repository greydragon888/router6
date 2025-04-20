import type {
  ActivationFn,
  ActivationFnFactory,
  DefaultDependencies,
  Router,
} from "../types/router";

function toFunction<T extends Function>(val: T): T;
function toFunction<T>(val: T): () => () => T;
function toFunction(val: unknown): unknown {
  return typeof val === "function" ? val : () => () => val;
}

export default function withRouteLifecycle<
  Dependencies extends DefaultDependencies = DefaultDependencies,
>(router: Router<Dependencies>): Router<Dependencies> {
  const canDeactivateFactories: Record<
    string,
    ActivationFnFactory<Dependencies>
  > = {};
  const canActivateFactories: Record<
    string,
    ActivationFnFactory<Dependencies>
  > = {};
  const canDeactivateFunctions: Record<string, ActivationFn> = {};
  const canActivateFunctions: Record<string, ActivationFn> = {};

  router.getLifecycleFactories = (): [
    { [key: string]: ActivationFnFactory<Dependencies> },
    { [key: string]: ActivationFnFactory<Dependencies> },
  ] => {
    return [canDeactivateFactories, canActivateFactories];
  };

  router.getLifecycleFunctions = () => {
    return [canDeactivateFunctions, canActivateFunctions];
  };

  router.canDeactivate = (name, canDeactivateHandler): Router<Dependencies> => {
    const factory = toFunction(
      canDeactivateHandler,
    ) as ActivationFnFactory<Dependencies>;

    canDeactivateFactories[name] = factory;
    canDeactivateFunctions[name] = router.executeFactory<ActivationFn>(factory);

    return router;
  };

  router.clearCanDeactivate = (name): Router<Dependencies> => {
    delete canDeactivateFactories[name];
    delete canDeactivateFunctions[name];

    return router;
  };

  router.canActivate = (name, canActivateHandler): Router<Dependencies> => {
    const factory = toFunction(
      canActivateHandler,
    ) as ActivationFnFactory<Dependencies>;

    canActivateFactories[name] = factory;
    canActivateFunctions[name] = router.executeFactory<ActivationFn>(factory);

    return router;
  };

  return router;
}
