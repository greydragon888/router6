import { events } from "../constants";
import { isObjKey } from "../typeGuards";
import type {
  Router,
  Plugin,
  PluginFactory,
  DefaultDependencies,
} from "../types/router";
import type { Unsubscribe } from "../types/base";

const eventsMap = {
  onStart: events.ROUTER_START,
  onStop: events.ROUTER_STOP,
  onTransitionSuccess: events.TRANSITION_SUCCESS,
  onTransitionStart: events.TRANSITION_START,
  onTransitionError: events.TRANSITION_ERROR,
  onTransitionCancel: events.TRANSITION_CANCEL,
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

    const removeEventListeners = Object.keys(eventsMap)
      .filter((eventName): eventName is keyof typeof eventsMap =>
        isObjKey<typeof eventsMap>(eventName, eventsMap),
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
      .filter((listener): listener is Unsubscribe => Boolean(listener));

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
