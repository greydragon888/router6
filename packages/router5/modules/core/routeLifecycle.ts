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
  let canDeactivateFactories: Record<
    string,
    ActivationFnFactory<Dependencies>
  > = {};
  const canActivateFactories: Record<
    string,
    ActivationFnFactory<Dependencies>
  > = {};
  let canDeactivateFunctions: Record<string, ActivationFn> = {};
  const canActivateFunctions: Record<string, ActivationFn> = {};

  router.getLifecycleFactories = (): [
    Record<string, ActivationFnFactory<Dependencies>>,
    Record<string, ActivationFnFactory<Dependencies>>,
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
    canDeactivateFactories = Object.keys(canDeactivateFactories).reduce(
      (record, key) => {
        return key === name
          ? record
          : { ...record, [key]: canDeactivateFactories[key] };
      },
      {},
    );
    canDeactivateFunctions = Object.keys(canDeactivateFunctions).reduce(
      (record, key) => {
        return key === name
          ? record
          : { ...record, [key]: canDeactivateFunctions[key] };
      },
      {},
    );

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
