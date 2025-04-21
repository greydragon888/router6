import browserPlugin from "..";
import browser from "../browser";
import { createRouter, constants } from "router5";
import type { Browser } from "../types";
import type { Router, State } from "router5";

let router: Router, currentHistoryState: State | undefined;
const base = window.location.pathname;
const hashPrefix = "!";
const mockedBrowser: Browser = {
  ...browser,
  getBase: () => base,
  pushState: (state) => (currentHistoryState = state),
  replaceState: (state) => (currentHistoryState = state),
  addPopstateListener: vi.fn(),
  getState: () => currentHistoryState!,
};
const routerConfig = [
  {
    name: "users",
    path: "/users",
    children: [
      {
        name: "view",
        path: "/view/:id",
      },
      {
        name: "list",
        path: "/list",
      },
    ],
  },
  {
    name: "home",
    path: "/home",
  },
];

const withoutMeta = (state: State) => {
  if (!state.meta?.id) {
    throw new Error("No state id");
  }
  return {
    name: state.name,
    params: state.params,
    path: state.path,
  };
};

describe("browserPlugin", () => {
  describe("Without hash", () => {
    const prefix = "";

    const makeUrl = (path: string) => {
      return `https://www.mysite.com:8080${path}`;
    };

    beforeEach(() => {
      router = createRouter(routerConfig, {
        defaultRoute: "home",
      });
      currentHistoryState = undefined;
      router.usePlugin(
        browserPlugin({ useHash: false, hashPrefix }, mockedBrowser),
      );

      vi.spyOn(mockedBrowser, "pushState");
      vi.spyOn(mockedBrowser, "replaceState");
    });

    afterEach(() => {
      router.stop();

      vi.clearAllMocks();
    });

    it("should update history on start", () => {
      router.start((_err, state) => {
        expect(mockedBrowser.replaceState).toHaveBeenCalledWith(
          state,
          "",
          `${prefix}/home`,
        );
      });
    });

    it("should update on route change", () => {
      router.start(() => {
        router.navigate("users", (_err, state) => {
          expect(mockedBrowser.pushState).toHaveBeenCalledWith(
            state,
            "",
            `${prefix}/users`,
          );
        });
      });
    });

    it("should match an URL", () => {
      expect(withoutMeta(router.matchUrl(makeUrl("/home"))!)).toStrictEqual({
        name: "home",
        params: {},
        path: "/home",
      });
      expect(
        withoutMeta(router.matchUrl(makeUrl("/users/view/1"))!),
      ).toStrictEqual({
        name: "users.view",
        params: { id: "1" },
        path: "/users/view/1",
      });
    });

    it("should build URLs", () => {
      expect(router.buildUrl("home", {})).toStrictEqual(`${prefix}/home`);
      expect(
        router.buildUrl(constants.UNKNOWN_ROUTE, {
          path: "/route-not-found",
        }),
      ).toStrictEqual(`${prefix}/route-not-found`);
      expect(() => router.buildUrl("undefined", {})).toThrow();
    });
  });

  describe("With hash", () => {
    const prefix = "#!";

    const makeUrl = (path: string) => {
      return `https://www.mysite.com:8080` + `#${hashPrefix}${path}`;
    };

    beforeEach(() => {
      router = createRouter(routerConfig, {
        defaultRoute: "home",
      });
      currentHistoryState = undefined;
      router.usePlugin(
        browserPlugin({ useHash: true, hashPrefix }, mockedBrowser),
      );

      vi.spyOn(mockedBrowser, "pushState");
      vi.spyOn(mockedBrowser, "replaceState");
    });

    afterEach(() => {
      router.stop();

      vi.clearAllMocks();
    });

    it("should update history on start", () => {
      router.start((_err, state) => {
        expect(mockedBrowser.replaceState).toHaveBeenCalledWith(
          state,
          "",
          `/${prefix}/home`,
        );
      });
    });

    it("should update on route change", () => {
      router.start(() => {
        router.navigate("users", (_err, state) => {
          expect(mockedBrowser.pushState).toHaveBeenCalledWith(
            state,
            "",
            `/${prefix}/users`,
          );
        });
      });
    });

    it("should match an URL", () => {
      expect(withoutMeta(router.matchUrl(makeUrl("/home"))!)).toStrictEqual({
        name: "home",
        params: {},
        path: "/home",
      });
      expect(
        withoutMeta(router.matchUrl(makeUrl("/users/view/1"))!),
      ).toStrictEqual({
        name: "users.view",
        params: { id: "1" },
        path: "/users/view/1",
      });
    });

    it("should build URLs", () => {
      expect(router.buildUrl("home", {})).toStrictEqual(`${prefix}/home`);
      expect(
        router.buildUrl(constants.UNKNOWN_ROUTE, {
          path: "/route-not-found",
        }),
      ).toStrictEqual(`${prefix}/route-not-found`);
      expect(() => router.buildUrl("undefined", {})).toThrow();
    });
  });
});
