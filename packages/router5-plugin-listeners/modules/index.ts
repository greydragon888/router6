import transitionPath from "router5-transition-path";
import type { NavigationOptions, PluginFactory, Router, State } from "router5";

export type Listener = (toState: State, fromState?: State) => void;

declare module "router5" {
  interface Router {
    getListeners: () => Record<string, Listener[]>;
    addListener: (name: string, callback: Listener) => void;
    removeListener: (name: string, callback: Listener) => void;
    addNodeListener: (name: string, callback: Listener) => void;
    removeNodeListener: (name: string, callback: Listener) => void;
    addRouteListener: (name: string, callback: Listener) => void;
    removeRouteListener: (name: string, callback: Listener) => void;
  }
}
export interface ListenersPluginOptions {
  autoCleanUp?: boolean;
}

const listenersPluginFactory = (
  options: ListenersPluginOptions = {
    autoCleanUp: true,
  },
): PluginFactory => {
  return function listenersPlugin(router: Router) {
    let listeners: Record<string, Listener[]> = {};

    function removeListener(name: string, cb?: Listener) {
      if (cb) {
        if (name in listeners) {
          listeners[name] = listeners[name].filter(
            (callback) => callback !== cb,
          );
        }
      } else {
        listeners[name] = [];
      }
      return router;
    }

    function addListener(name: string, cb: Listener, replace?: boolean) {
      const normalizedName = name.replace(/^[*^=]/, "");

      if (normalizedName && !/^\$/.test(name)) {
        //@ts-expect-error: used private method
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const segments = router.rootNode.getSegmentsByName(normalizedName);
        if (!segments) {
          console.warn(
            `No route found for ${normalizedName}, listener might never be called!`,
          );
        }
      }

      if (!(name in listeners)) {
        listeners[name] = [];
      }
      listeners[name] = [...(replace ? [] : listeners[name]), cb];

      return router;
    }

    router.getListeners = () => listeners;

    router.addListener = (name, cb) => addListener(name || "*", cb);
    router.removeListener = (name, cb) => removeListener(name || "*", cb);

    router.addNodeListener = (name, cb) => addListener(`^${name}`, cb, true);
    router.removeNodeListener = (name, cb) => removeListener(`^${name}`, cb);

    router.addRouteListener = (name, cb) => addListener(`=${name}`, cb);
    router.removeRouteListener = (name, cb) => removeListener(`=${name}`, cb);

    function invokeListeners(name: string, toState: State, fromState?: State) {
      (name in listeners ? listeners[name] : []).forEach((cb) => {
        if (listeners[name].includes(cb)) {
          // Attention! Calling the listener may remove it from the list and mutate the array!!!
          cb(toState, fromState);
        }
      });
    }

    function onTransitionSuccess(
      toState: State,
      fromState?: State,
      opts?: NavigationOptions,
    ) {
      const { intersection, toDeactivate } = transitionPath(toState, fromState);
      const intersectionNode = opts?.reload ? "" : intersection;
      const { name } = toState;

      if (options.autoCleanUp) {
        toDeactivate.forEach((name) => removeListener(`^${name}`));
      }

      invokeListeners(`^${intersectionNode}`, toState, fromState);
      invokeListeners(`=${name}`, toState, fromState);
      invokeListeners("*", toState, fromState);
    }

    return {
      onTransitionSuccess,
      teardown: () => {
        listeners = {};
      },
    };
  };
};

export default listenersPluginFactory;
