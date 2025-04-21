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
      name: `${toState.name}modified`,
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
      router.navigate("users", (err, state) => {
        expect(listeners.transition).toHaveBeenCalled();
        expect((state as State & { hitMware: boolean }).hitMware).toStrictEqual(
          true,
        );
        expect(err).toStrictEqual(null);
      });
    });
  });

  it("should log a warning if state is changed during transition", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    router.stop();
    router.useMiddleware(() => listeners.transitionMutate);
    router.start("", () => {
      router.navigate("orders", (err) => {
        expect(console.error).toHaveBeenCalled();
        expect(err).toStrictEqual(null);

        router.clearMiddleware();
      });
    });
  });

  it("should fail transition if middleware returns an error", () => {
    vi.spyOn(listeners, "transitionErr");
    router.stop();
    router.useMiddleware(() => listeners.transitionErr);
    router.start("", () => {
      router.navigate("users", (err) => {
        expect(listeners.transitionErr).toHaveBeenCalled();
        expect((err as { code: string; reason: string }).code).toStrictEqual(
          errorCodes.TRANSITION_ERR,
        );
        expect((err as { code: string; reason: string }).reason).toStrictEqual(
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
      router.navigate("users", () => {
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
      done(null, {
        ...toState,
        m3: (toState as State & { m2: boolean }).m2,
      } as State & { m2: boolean; m3: boolean });
    };
    router.clearMiddleware();
    router.useMiddleware(m1, m2, m3);

    router.start("", () => {
      router.navigate("users", (_err, state) => {
        expect((state as State & Record<string, boolean>).m1).toStrictEqual(
          true,
        );
        expect((state as State & Record<string, boolean>).m2).toStrictEqual(
          true,
        );
        expect((state as State & Record<string, boolean>).m3).toStrictEqual(
          true,
        );
      });
    });
  });
});
