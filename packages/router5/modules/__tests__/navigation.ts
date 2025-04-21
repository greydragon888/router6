import { constants, errorCodes, createRouter } from "..";
import { createTestRouter, omitMeta } from "./helpers";
import type { Router } from "..";

let router: Router;
const noop = () => undefined;

describe("core/navigation", () => {
  beforeEach(() => {
    router = createTestRouter();

    router.start();
  });

  afterEach(() => {
    router.stop();

    vi.clearAllMocks();
  });

  it("should be able to navigate to routes", () => {
    router.navigate("users.view", { id: 123 }, {}, (_err, state) => {
      expect(omitMeta(state!)).toStrictEqual({
        name: "users.view",
        params: { id: 123 },
        path: "/users/view/123",
      });
    });
  });

  it("should navigate to same state if reload is set to true", () => {
    router.navigate("orders.pending", () => {
      router.navigate("orders.pending", (err) => {
        expect((err as { code: string }).code).toStrictEqual(
          errorCodes.SAME_STATES,
        );

        router.navigate("orders.pending", {}, { reload: true }, (err) => {
          expect(err).toStrictEqual(null);
        });
      });
    });
  });

  it("should be able to cancel a transition", () => {
    router.canActivate("admin", () => () => Promise.resolve());
    const cancel = router.navigate("admin", (err) => {
      expect((err as { code: string }).code).toStrictEqual(
        errorCodes.TRANSITION_CANCELLED,
      );
    });
    cancel();
  });

  it("should be able to handle multiple cancellations", () => {
    router.useMiddleware(() => (_toState, _fromState, done) => {
      setTimeout(done, 20);
    });
    router.navigate("users", (err) => {
      expect((err as { code: string }).code).toStrictEqual(
        errorCodes.TRANSITION_CANCELLED,
      );
    });
    router.navigate("users", (err) => {
      expect((err as { code: string }).code).toStrictEqual(
        errorCodes.TRANSITION_CANCELLED,
      );
    });
    router.navigate("users", (err) => {
      expect((err as { code: string }).code).toStrictEqual(
        errorCodes.TRANSITION_CANCELLED,
      );
    });
    router.navigate("users", () => {
      router.clearMiddleware();
    });
  });

  it("should redirect if specified by transition error, and call back", () => {
    router.stop();
    router.start("/auth-protected", (_err, state) => {
      expect(omitMeta(state!)).toStrictEqual({
        name: "sign-in",
        params: {},
        path: "/sign-in",
      });

      router.navigate("auth-protected", () => {
        expect(omitMeta(state!)).toStrictEqual({
          name: "sign-in",
          params: {},
          path: "/sign-in",
        });
      });
    });
  });

  it("should pass along handled errors in promises var 1", () => {
    router.stop();

    router.canActivate(
      "admin",
      () => () => Promise.resolve(new Error("error message")),
    );

    router.start("", () => {
      router.navigate("admin", (err) => {
        expect((err as { code: string; error: Error }).code).toStrictEqual(
          errorCodes.CANNOT_ACTIVATE,
        );

        expect(
          (err as { code: string; error: Error }).error.message,
        ).toStrictEqual("error message");
      });
    });
  });

  it("should pass along handled errors in promises var 2", () => {
    vi.spyOn(console, "error").mockImplementation(noop);
    router.stop();
    router.canActivate(
      "admin",
      () => () =>
        new Promise(() => {
          throw new Error("unhandled error");
        }),
    );
    router.start("", () => {
      router.navigate("admin", (err) => {
        expect((err as { code: string }).code).toStrictEqual(
          errorCodes.CANNOT_ACTIVATE,
        );
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  it("should prioritise cancellation errors", () => {
    router.stop();
    router.canActivate(
      "admin",
      () => () =>
        new Promise((_resolve, reject) => {
          setTimeout(reject, 20);
        }),
    );
    router.start("", () => {
      const cancel = router.navigate("admin", (err) => {
        expect((err as { code: string }).code).toStrictEqual(
          errorCodes.TRANSITION_CANCELLED,
        );
      });
      setTimeout(cancel, 10);
    });
  });

  it("should let users navigate to unkown URLs if allowNotFound is set to true", () => {
    router.setOption("allowNotFound", true);
    router.setOption("defaultRoute", undefined);
    router.stop();
    router.start("/unkown-url", (_err, state) => {
      expect(state?.name).toStrictEqual(constants.UNKNOWN_ROUTE);
    });
  });

  it("should forward a route to another route", () => {
    router.forward("profile", "profile.me");

    router.navigate("profile", (_err, state) => {
      expect(state?.name).toStrictEqual("profile.me");
    });
  });

  it("should forward a route to another with default params", () => {
    const routerTest = createRouter([
      {
        name: "app",
        path: "/app",
        forwardTo: "app.version",
        defaultParams: {
          lang: "en",
        },
      },
      {
        name: "app.version",
        path: "/:version",
        defaultParams: { version: "v1" },
      },
    ]);

    routerTest.start("/app", (_err, state) => {
      expect(state?.name).toStrictEqual("app.version");
      expect(state?.params).toStrictEqual({
        version: "v1",
        lang: "en",
      });
    });
  });

  it("should encode params to path", () => {
    router.navigate(
      "withEncoder",
      { one: "un", two: "deux" },
      (_err, state) => {
        expect(state?.path).toStrictEqual("/encoded/un/deux");
      },
    );
  });

  it("should extend default params", () => {
    router.navigate("withDefaultParam", (_err, state) => {
      expect(state?.params).toStrictEqual({
        param: "hello",
      });
    });
  });

  it("should add navitation options to meta", () => {
    const options = { reload: true, replace: true, customOption: "abc" };
    router.navigate("profile", {}, options, (_err, state) => {
      expect(state?.meta?.options).toStrictEqual(options);
    });
  });
});
