import safeBrowser from "./browser";
import { errorCodes, constants } from "router5";
import type { Params } from "router5";
import type { BrowserPluginOptions, HistoryState } from "./types";
import type {
  PluginFactory,
  Router,
  State,
  NavigationOptions,
  DoneFn,
} from "router5";

declare module "router5" {
  interface Router {
    buildUrl: (name: string, params?: Params) => string;
    matchUrl: (url: string) => State | undefined;
    replaceHistoryState: (
      name: string,
      params?: Params,
      title?: string,
    ) => void;
    lastKnownState: State;
  }
}

type StartRouterArguments =
  | []
  | [done: DoneFn]
  | [startPathOrState: string | State]
  | [startPathOrState: string | State, done: DoneFn];

const defaultOptions: BrowserPluginOptions = {
  forceDeactivate: true,
  useHash: false,
  hashPrefix: "",
  base: "",
  mergeState: false,
  preserveHash: true,
};

const source = "popstate";

const noop = () => undefined;

function browserPluginFactory(
  opts?: BrowserPluginOptions,
  browser = safeBrowser,
): PluginFactory {
  const options: BrowserPluginOptions = { ...defaultOptions, ...opts };
  const transitionOptions = {
    forceDeactivate: options.forceDeactivate,
    source,
  };
  let removePopStateListener: (() => void) | undefined;

  return function browserPlugin(router: Router) {
    const routerOptions = router.getOptions();
    const routerStart = router.start;

    router.buildUrl = (route, params) => {
      const base = options.base ?? "";
      const prefix = options.useHash ? `#${options.hashPrefix ?? ""}` : "";
      const path = router.buildPath(route, params);

      return base + prefix + path;
    };

    const urlToPath = (url: string) => {
      const match = /^(?:http|https):\/\/[0-9a-z_\-.:]+?(?=\/)(.*)$/.exec(url);
      const path = match ? match[1] : url;

      const pathParts = /^([^#?]+)(#[^?]*)?(\?.*)?$/.exec(path);

      if (!pathParts) {
        throw new Error(`[router5] Could not parse url ${url}`);
      }

      const pathname = pathParts[1];
      const hash = pathParts[2] || "";
      const search = pathParts[3] || "";

      if (options.useHash) {
        return (
          hash.replace(new RegExp(`^#${options.hashPrefix ?? ""}`), "") + search
        );
      } else if (options.base) {
        return pathname.replace(new RegExp(`^${options.base}`), "") + search;
      }

      return pathname + search;
    };

    router.matchUrl = (url) => router.matchPath(urlToPath(url));

    const getStartRouterArguments = (
      args: StartRouterArguments,
    ): [startPathOrState: string | State, done: DoneFn] => {
      switch (args.length) {
        case 0:
          return [browser.getLocation(options), noop];
        case 1:
          if (typeof args[0] === "function") {
            return [browser.getLocation(options), args[0]];
          }
          return [args[0], noop];
        case 2:
          return [args[0], args[1]];
        default:
          throw new Error("Invalid number of arguments");
      }
    };

    router.start = function (...args: StartRouterArguments) {
      const [startPath, done] = getStartRouterArguments(args);

      routerStart(startPath, done);

      return router;
    };

    router.replaceHistoryState = function (name, params = {}, title = "") {
      const route = router.buildState(name, params);

      if (!route) {
        throw new Error(
          `[router5] Cannot replace state for route ${name} with params ${JSON.stringify(
            params,
          )}`,
        );
      }

      const state = router.makeState(
        route.name,
        route.params,
        router.buildPath(route.name, route.params),
        {
          params: route.meta,
          id: 1,
          options: {},
          redirected: false,
        },
      );
      const url = router.buildUrl(name, params);
      router.lastKnownState = state;
      browser.replaceState(<HistoryState>state, title, url);
    };

    function updateBrowserState(
      state: State | null,
      url: string,
      replace?: boolean,
    ) {
      const trimmedState = state
        ? {
            meta: state.meta,
            name: state.name,
            params: state.params,
            path: state.path,
          }
        : state!;
      const finalState: HistoryState =
        options.mergeState === true
          ? { ...(browser.getState() ?? {}), ...(<HistoryState>trimmedState) }
          : <HistoryState>trimmedState;

      if (replace) {
        browser.replaceState(finalState, "", url);
      } else {
        browser.pushState(finalState, "", url);
      }
    }

    function onPopState(evt: PopStateEvent) {
      const routerState = router.getState();
      // Do nothing if no state or if last know state is poped state (it should never happen)
      const newState = !evt.state?.name;
      const state = newState
        ? router.matchPath(browser.getLocation(options), source)
        : router.makeState(
            evt.state.name,
            evt.state.params,
            evt.state.path,
            { ...evt.state.meta, source },
            evt.state.meta.id,
          );
      const { defaultRoute, defaultParams } = routerOptions;

      if (!state || defaultRoute) {
        // If current state is already the default route, we will have a double entry
        // Navigating back and forth will emit SAME_STATES error

        router.navigateToDefault({
          ...transitionOptions,
          reload: true,
          replace: true,
        });
        return;
      }
      if (routerState && router.areStatesEqual(state, routerState, false)) {
        return;
      }

      router.transitionToState(
        state,
        routerState,
        transitionOptions,
        (err, toState) => {
          if (err?.redirect) {
            const { name, params } = err.redirect;

            router.navigate(name, params, {
              ...transitionOptions,
              replace: true,
              force: true,
              redirected: true,
            });
          } else if (
            err?.code === errorCodes.CANNOT_DEACTIVATE &&
            routerState
          ) {
            const url = router.buildUrl(routerState.name, routerState.params);
            if (!newState) {
              // Keep history state unchanged but use current URL
              updateBrowserState(state, url, true);
            }
            // else do nothing or history will be messed up
            // TODO: history.back()?
          } else if (defaultRoute) {
            // Force navigation to default state
            router.navigate(defaultRoute, defaultParams ?? {}, {
              ...transitionOptions,
              reload: true,
              replace: true,
            });
          } else {
            router.invokeEventListeners(
              constants.TRANSITION_SUCCESS,
              toState,
              routerState,
              { replace: true },
            );
          }
        },
      );
    }

    function onStart() {
      if (options.useHash && !options.base) {
        // Guess base
        options.base = browser.getBase();
      }

      removePopStateListener = browser.addPopstateListener(onPopState, options);
    }

    function teardown() {
      if (removePopStateListener) {
        removePopStateListener();
        removePopStateListener = undefined;
      }
    }

    function onTransitionSuccess(
      toState: State,
      fromState?: State,
      opts?: NavigationOptions,
    ) {
      const historyState = browser.getState();
      const hasState =
        historyState &&
        historyState.meta &&
        historyState.name &&
        historyState.params;
      const statesAreEqual =
        fromState && router.areStatesEqual(fromState, toState, false);
      const replace = Boolean((opts?.replace ?? !hasState) || statesAreEqual);
      let url = router.buildUrl(toState.name, toState.params);
      if (
        fromState === undefined &&
        options.useHash === false &&
        options.preserveHash === true
      ) {
        url += browser.getHash();
      }
      updateBrowserState(toState, url, replace);
    }

    return {
      onStart,
      onStop: teardown,
      teardown,
      onTransitionSuccess,
      onPopState,
    };
  };
}

export default browserPluginFactory;
