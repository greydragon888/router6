import { createTestRouter } from "./helpers";
import createRouter from "..";
import type { Router, PluginFactory, Plugin } from "..";

let router: Router;
let myPlugin: PluginFactory, myPluginMethods: Plugin;

describe("core/plugins", () => {
  beforeEach(() => {
    router = createTestRouter().start();
    myPluginMethods = {
      onTransitionStart: vi.fn(),
      onTransitionSuccess: vi.fn(),
      onTransitionError: () => {},
    };
    myPlugin = (router: Router) => {
      // @ts-ignore
      router.myCustomMethod = () => undefined;

      return myPluginMethods;
    };
  });
  afterEach(() => {
    router.stop();
  });

  it("should register plugins", () =>
    new Promise((done) => {
      router.stop();
      router.usePlugin(myPlugin);
      router.start("", () => {
        // @ts-ignore
        expect(router.myCustomMethod).not.toBe(undefined);

        router.navigate("orders", () => {
          expect(myPluginMethods.onTransitionStart).toHaveBeenCalled();
          expect(myPluginMethods.onTransitionSuccess).toHaveBeenCalled();
          done(null);
        });
      });
    }));

  it("should return an deregister function and call teardown", () => {
    const router = createRouter();
    const teardown = vi.fn();
    const unsubscribe = router.usePlugin(() => ({
      teardown,
    }));

    expect(router.getPlugins().length).toBe(1);

    unsubscribe();

    expect(router.getPlugins().length).toBe(0);
    expect(teardown).toHaveBeenCalled();
  });
});
