import type { Browser, HistoryState } from "./types";
import type { State } from "router5";

const value =
  <T>(arg: T) =>
  (): T =>
    arg;
const noop = () => {};

const isBrowser = typeof window !== "undefined" && window.history;

const getBase = () => window.location.pathname;

const supportsPopStateOnHashChange = () =>
  window.navigator.userAgent.indexOf("Trident") === -1;

const pushState = (state: State, title: string, path: string | URL | null) =>
  window.history.pushState(state, title, path);

const replaceState = (state: State, title: string, path: string | URL | null) =>
  window.history.replaceState(state, title, path);

const addPopstateListener: Browser["addPopstateListener"] = (
  fn,
  opts,
): (() => void) => {
  const shouldAddHashChangeListener =
    opts.useHash && !supportsPopStateOnHashChange();

  window.addEventListener("popstate", fn as (evt: PopStateEvent) => void);

  if (shouldAddHashChangeListener) {
    window.addEventListener("hashchange", fn as (evt: HashChangeEvent) => void);
  }

  return () => {
    window.removeEventListener("popstate", fn as (evt: PopStateEvent) => void);

    if (shouldAddHashChangeListener) {
      window.removeEventListener(
        "hashchange",
        fn as (evt: HashChangeEvent) => void,
      );
    }
  };
};

const getLocation = (opts: {
  useHash: boolean;
  hashPrefix: string;
  base: string;
}) => {
  const path = opts.useHash
    ? window.location.hash.replace(new RegExp("^#" + opts.hashPrefix), "")
    : window.location.pathname.replace(new RegExp("^" + opts.base), "");

  // Fix issue with browsers that don't URL encode characters (Edge)
  const correctedPath = safelyEncodePath(path);

  return (correctedPath || "/") + window.location.search;
};

const safelyEncodePath = (path: string) => {
  try {
    return encodeURI(decodeURI(path));
  } catch (_) {
    return path;
  }
};

const getState = () => window.history.state;

const getHash = () => window.location.hash;

const browser: Browser = isBrowser
  ? {
      getBase,
      pushState,
      replaceState,
      addPopstateListener,
      getLocation,
      getState,
      getHash,
    }
  : {
      getBase: value<string>("") as Browser["getBase"],
      pushState: noop as Browser["pushState"],
      replaceState: noop as Browser["replaceState"],
      addPopstateListener: () => () => undefined,
      getLocation: value<string>("") as Browser["getLocation"],
      getState: value<HistoryState>({
        name: "",
        params: {},
        path: "",
      }) as Browser["getState"],
      getHash: value<string>("") as Browser["getHash"],
    };

export default browser as Browser;
