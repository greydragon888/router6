import createTestRouter from "./helpers/testRouters";
import { errorCodes } from "..";
import type { Middleware, State, Router } from "..";
import type { MiddlewareFactory } from "../types/router";

const listeners: Record<string, Middleware> = {
  transition: (toState, _fromState, done) => {
    const newState = {
      name: toState.name,
      params: toState.params,
      path: toState.path,
      hitMware: true,
    };
    done(null, newState);
  },
  transitionMutate: (toState, _fromState, done) => {
    const newState = {
      name: toState.name + "modified",
      params: toState.params,
      path: toState.path,
      hitMware: true,
    };
    done(null, newState);
  },
  transitionErr: (_toState, _fromState, done) => {
    done({ reason: "because" });
  },
};

describe("core/middleware", () => {
  let router: Router;

  beforeEach(() => (router = createTestRouter().start()));
  afterEach(() => {
    vi.restoreAllMocks();
    router.stop();
  });

  it("should support a transition middleware", () => {
    vi.spyOn(listeners, "transition");
    router.stop();
    router.useMiddleware(() => listeners.transition);
    router.start("", () => {
      router.navigate("users", function (err, state) {
        expect(listeners.transition).toHaveBeenCalled();
        expect((state as State & { hitMware: boolean }).hitMware).toEqual(true);
        expect(err).toEqual(null);
      });
    });
  });

  it("should log a warning if state is changed during transition", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    router.stop();
    router.useMiddleware(() => listeners.transitionMutate);
    router.start("", () => {
      router.navigate("orders", function (err) {
        expect(console.error).toHaveBeenCalled();
        expect(err).toEqual(null);
        router.clearMiddleware();
      });
    });
  });

  it("should fail transition if middleware returns an error", () => {
    vi.spyOn(listeners, "transitionErr");
    router.stop();
    router.useMiddleware(() => listeners.transitionErr);
    router.start("", () => {
      router.navigate("users", function (err) {
        expect(listeners.transitionErr).toHaveBeenCalled();
        expect((err as { code: string; reason: string }).code).toEqual(
          errorCodes.TRANSITION_ERR,
        );
        expect((err as { code: string; reason: string }).reason).toEqual(
          "because",
        );
      });
    });
  });

  it("should be able to take more than one middleware", () => {
    vi.spyOn(listeners, "transition");
    vi.spyOn(listeners, "transitionErr");
    router.stop();
    router.clearMiddleware();
    router.useMiddleware(
      () => listeners.transition,
      () => listeners.transitionErr,
    );
    router.start("", () => {
      router.navigate("users", function () {
        expect(listeners.transition).toHaveBeenCalled();
        expect(listeners.transitionErr).toHaveBeenCalled();
      });
    });
  });

  it("should pass state from middleware to middleware", () => {
    const m1: MiddlewareFactory = () => (toState, _fromState, done) => {
      done(null, { ...toState, m1: true } as State & { m1: boolean });
    };
    const m2: MiddlewareFactory = () => (toState) =>
      Promise.resolve({
        ...toState,
        m2: (toState as State & { m1: boolean }).m1,
      });

    const m3: MiddlewareFactory = () => (toState, _fromState, done) => {
      // @ts-ignore
      done(null, { ...toState, m3: toState.m2 });
    };
    router.clearMiddleware();
    router.useMiddleware(m1, m2, m3);

    router.start("", () => {
      router.navigate("users", function (_err, state) {
        expect((state as State & { [key: string]: boolean })?.m1).toEqual(true);
        expect((state as State & { [key: string]: boolean })?.m2).toEqual(true);
        expect((state as State & { [key: string]: boolean })?.m3).toEqual(true);
      });
    });
  });
});
