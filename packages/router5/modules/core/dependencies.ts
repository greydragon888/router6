import type { DefaultDependencies, Router } from "../types/router";

export default function withDependencies<
  Dependencies extends DefaultDependencies = DefaultDependencies,
>(dependencies: Dependencies) {
  return (router: Router<Dependencies>): Router<Dependencies> => {
    const routerDependencies: Dependencies = dependencies;

    router.setDependency = (
      dependencyName: keyof Dependencies,
      dependency: Dependencies[keyof Dependencies],
    ): Router<Dependencies> => {
      routerDependencies[dependencyName] = dependency;
      return router;
    };

    router.setDependencies = (
      deps: Partial<Dependencies>,
    ): Router<Dependencies> => {
      (Object.keys(deps) as (keyof Dependencies)[]).forEach((name) => {
        if (deps[name]) {
          router.setDependency(name, deps[name]);
        }
      });
      return router;
    };

    router.getDependencies = (): Dependencies => routerDependencies;

    router.getInjectables = (): [Router<Dependencies>, Dependencies] => [
      router,
      router.getDependencies(),
    ];

    router.executeFactory = <Return>(
      factoryFunction: (
        router: Router<Dependencies>,
        dependencies: Dependencies,
      ) => Return,
    ): Return => factoryFunction(...router.getInjectables());

    return router;
  };
}
