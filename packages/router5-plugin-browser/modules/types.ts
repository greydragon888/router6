import type { State } from "router5";

export interface BrowserPluginOptions {
  forceDeactivate?: boolean;
  useHash?: boolean;
  hashPrefix?: string;
  base?: string;
  mergeState?: boolean;
  preserveHash?: boolean;
}

export interface Browser {
  getBase: () => string;
  pushState: (state: HistoryState, title: string | null, path: string) => void;
  replaceState: (
    state: HistoryState,
    title: string | null,
    path: string,
  ) => void;

  addPopstateListener: ((
    fn: (evt: PopStateEvent) => void,
    opts: BrowserPluginOptions,
  ) => () => void) &
    ((
      fn: (evt: HashChangeEvent) => void,
      opts: BrowserPluginOptions,
    ) => () => void);
  getLocation: (opts: BrowserPluginOptions) => string;
  getState: () => HistoryState | undefined;
  getHash: () => string;
}

export type HistoryState = State & Record<string, any>;
