import { isBoolean } from "../typeGuards";
import type {
  ActivationFn,
  ActivationFnFactory,
  DefaultDependencies,
  Router,
} from "../types/router";

function toFunction<T>(val: T): () => () => T {
  return () => () => val;
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
    if (isBoolean(canDeactivateHandler)) {
      canDeactivateFactories[name] = toFunction(canDeactivateHandler);
      canDeactivateFunctions[name] = router.executeFactory<ActivationFn>(
        canDeactivateFactories[name],
      );
    } else {
      canDeactivateFactories[name] = canDeactivateHandler;
      canDeactivateFunctions[name] = router.executeFactory<ActivationFn>(
        canDeactivateFactories[name],
      );
    }

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
    if (isBoolean(canActivateHandler)) {
      canActivateFactories[name] = toFunction(canActivateHandler);
      canActivateFunctions[name] = router.executeFactory<ActivationFn>(
        canActivateFactories[name],
      );
    } else {
      canActivateFactories[name] = canActivateHandler;
      canActivateFunctions[name] = router.executeFactory<ActivationFn>(
        canActivateFactories[name],
      );
    }

    return router;
  };

  return router;
}
