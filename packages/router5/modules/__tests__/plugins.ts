import createRouter from "..";
import { createTestRouter } from "./helpers";
import type { Router, PluginFactory, Plugin } from "..";

let router: Router;
let myPlugin: PluginFactory;
let myPluginMethods: Plugin;

describe("core/plugins", () => {
  beforeEach(() => {
    router = createTestRouter().start();
    myPluginMethods = {
      onTransitionStart: vi.fn(),
      onTransitionSuccess: vi.fn(),
      onTransitionError: () => undefined,
    };
    myPlugin = (router?: Router & { myCustomMethod?: Function }) => {
      router!.myCustomMethod = () => undefined;

      return myPluginMethods;
    };
  });

  afterEach(() => {
    router.stop();
  });

  it("should register plugins", () => {
    router.stop();
    router.usePlugin(myPlugin);
    router.start("", () => {
      expect(
        (router as Router & { myCustomMethod?: Function }).myCustomMethod,
      ).not.toStrictEqual(undefined);

      router.navigate("orders", () => {
        expect(myPluginMethods.onTransitionStart).toHaveBeenCalled();
        expect(myPluginMethods.onTransitionSuccess).toHaveBeenCalled();
      });
    });
  });

  it("should return an deregister function and call teardown", () => {
    const router = createRouter();
    const teardown = vi.fn();
    const unsubscribe = router.usePlugin(() => ({
      teardown,
    }));

    expect(router.getPlugins()).toHaveLength(1);

    unsubscribe();

    expect(router.getPlugins()).toHaveLength(0);
    expect(teardown).toHaveBeenCalled();
  });
});
