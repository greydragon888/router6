import { errorCodes } from "..";
import { createTestRouter, omitMeta } from "./helpers";
import type { Router, State } from "..";
import { expect } from "vitest";

let router: Router;
const homeState: State = {
  name: "home",
  params: {},
  path: "/home",
  meta: { id: 5, params: { home: {} }, redirected: false, options: {} },
};

describe("core/router-lifecycle", () => {
  beforeEach(() => {
    router = createTestRouter();
  });

  afterEach(() => {
    router.stop();
  });

  it("should start with the default route", () => {
    expect(router.getState()).toStrictEqual(null);
    expect(router.isActive("home")).toStrictEqual(false);

    router.start("/not-existing", () => {
      expect(router.isStarted()).toStrictEqual(true);
      expect(omitMeta(router.getState()!)).toStrictEqual({
        name: "home",
        params: {},
        path: "/home",
      });
    });
  });

  it("should throw an error when starting with no start path or state", () => {
    router.setOption("defaultRoute", null);
    router.start((err) => {
      expect((err as { code: string }).code).toStrictEqual(
        errorCodes.NO_START_PATH_OR_STATE,
      );

      router.setOption("defaultRoute", "home");
    });
  });

  it("should not throw an error when starting with no callback", () => {
    expect(() => router.start("")).not.toThrow();
  });

  it("should give an error if trying to start when already started", () => {
    router.start("", () => {
      router.start("", (err) => {
        expect((err as { code: string }).code).toStrictEqual(
          errorCodes.ROUTER_ALREADY_STARTED,
        );
      });
    });
  });

  it("should start with the start route if matched", () => {
    router.start("/section123/query?param1=1__1&param1=2__2", (_err, state) => {
      expect(omitMeta(state!)).toStrictEqual({
        name: "section.query",
        params: { section: "section123", param1: ["1__1", "2__2"] },
        path: "/section123/query?param1=1__1&param1=2__2",
      });
    });
  });

  it("should start with the default route if start route is not matched", () => {
    router.start("/about", () => {
      expect(omitMeta(router.getState()!)).toStrictEqual({
        name: "home",
        params: {},
        path: "/home",
      });
    });
  });

  it("should start with the default route if navigation to start route is not allowed", () => {
    router.start("/admin", () => {
      expect(omitMeta(router.getState()!)).toStrictEqual({
        name: "home",
        params: {},
        path: "/home",
      });
    });
  });

  it("should start with the provided path", () => {
    router.start("/users", (_err, state) => {
      expect(omitMeta(state!)).toStrictEqual({
        name: "users",
        params: {},
        path: "/users",
      });
    });
  });

  it("should start with an error if navigation to start route is not allowed and no default route is specified", () => {
    router.setOption("defaultRoute", null);
    router.start("/admin", (err) => {
      expect((err as { code: string; segment: string }).code).toStrictEqual(
        errorCodes.CANNOT_ACTIVATE,
      );
      expect((err as { code: string; segment: string }).segment).toStrictEqual(
        "admin",
      );
    });
  });

  it("should start with a not found error if no matched start state and no default route", () => {
    router.setOption("defaultRoute", null);

    router.start("/not-existing", (err) => {
      expect((err as { code: string }).code).toStrictEqual(
        errorCodes.ROUTE_NOT_FOUND,
      );
    });
  });

  it("should not match an URL with extra trailing slashes", () => {
    // ToDo: WHY?
    router.setOption("defaultRoute", null);
    router.setOption("strictTrailingSlash", true);

    router.start("/users/list/", (err, state) => {
      expect((err as { code: string }).code).toStrictEqual(
        errorCodes.ROUTE_NOT_FOUND,
      );
      expect(state).toStrictEqual(undefined);
    });
  });

  it("should match an URL with extra trailing slashes", () => {
    router.start("/users/list/", (_err, state) => {
      expect(omitMeta(state!)).toStrictEqual({
        name: "users.list",
        params: {},
        path: "/users/list",
      });
    });
  });

  it("should start with the provided state", () => {
    router.start(homeState, (_err, state) => {
      expect(state).toStrictEqual(homeState);
      expect(router.getState()).toStrictEqual(homeState);
    });
  });

  it("should not reuse id when starting with provided state", () => {
    router.start(homeState, (_err, state) => {
      expect(state?.meta?.id).toStrictEqual(homeState.meta?.id);

      router.navigate("users", (_err, state) => {
        expect(state?.meta?.id).toStrictEqual(1);

        router.navigate("profile", (_err, state) => {
          expect(state?.meta?.id).not.toStrictEqual(1);
          expect(state?.meta?.id).not.toStrictEqual(homeState.meta?.id);
        });
      });
    });
  });

  it("should return an error if default route access is not found", () => {
    router.setOption("defaultRoute", "fake.route");

    router.start("/not-existing", (err) => {
      expect((err as { code: string }).code).toStrictEqual(
        errorCodes.ROUTE_NOT_FOUND,
      );
    });
  });

  it("should be able to stop routing", () => {
    router.start();

    router.navigate("users", () => {
      router.stop();

      expect(router.isStarted()).toStrictEqual(false);

      router.navigate("users.list", (err) => {
        expect((err as { code: string }).code).toStrictEqual(
          errorCodes.ROUTER_NOT_STARTED,
        );

        // Stopping again shouldn't throw an error
        router.stop();

        expect(() => router.start("", () => undefined)).not.throw();
      });
    });
  });
});
