import { constants } from "../constants";
import type {
  Router,
  Plugin,
  PluginFactory,
  DefaultDependencies,
} from "../types/router";
import type { Unsubscribe } from "../types/base";

const eventsMap = {
  onStart: constants.ROUTER_START,
  onStop: constants.ROUTER_STOP,
  onTransitionSuccess: constants.TRANSITION_SUCCESS,
  onTransitionStart: constants.TRANSITION_START,
  onTransitionError: constants.TRANSITION_ERROR,
  onTransitionCancel: constants.TRANSITION_CANCEL,
};

export default function withPlugins<
  Dependencies extends DefaultDependencies = DefaultDependencies,
>(router: Router<Dependencies>): Router<Dependencies> {
  let routerPlugins: PluginFactory<Dependencies>[] = [];

  router.getPlugins = (): PluginFactory<Dependencies>[] => routerPlugins;

  router.usePlugin = (
    ...plugins: PluginFactory<Dependencies>[]
  ): Unsubscribe => {
    const removePluginFns = plugins.map((plugin) => {
      routerPlugins.push(plugin);
      return startPlugin(plugin);
    });

    return () => {
      routerPlugins = routerPlugins.filter(
        (plugin) => !plugins.includes(plugin),
      );

      removePluginFns.forEach((removePlugin) => {
        removePlugin();
      });
    };
  };

  function startPlugin(
    pluginFactory: PluginFactory<Dependencies>,
  ): Unsubscribe {
    const appliedPlugin = router.executeFactory<Plugin>(pluginFactory);

    const removeEventListeners = (
      Object.keys(eventsMap) as (keyof typeof eventsMap)[]
    )
      .map((methodName) => {
        if (appliedPlugin[methodName]) {
          return router.addEventListener(
            eventsMap[methodName],
            appliedPlugin[methodName],
          );
        } else {
          return;
        }
      })
      .filter(Boolean) as Unsubscribe[];

    return () => {
      removeEventListeners.forEach((removeListener) => {
        removeListener();
      });

      if (appliedPlugin.teardown) {
        appliedPlugin.teardown();
      }
    };
  }

  return router;
}
