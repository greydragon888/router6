import createRouter from "router5";
import listenersPlugin from "..";
import type { Router } from "router5";
import { expect } from "vitest";

let router: Router;
const routes = [
  {
    name: "home",
    path: "/home",
  },
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
    name: "orders",
    path: "/orders",
    children: [
      { name: "view", path: "/view/:id" },
      { name: "pending", path: "/pending" },
      { name: "completed", path: "/completed" },
    ],
  },
];

const noop = () => undefined;

describe("listenersPlugin", () => {
  beforeEach(() => {
    router = createRouter(routes);
    router.usePlugin(listenersPlugin());
  });

  afterEach(() => {
    router.stop();
  });

  it("should call root node listener on first transition", () => {
    router.setOption("defaultRoute", "home");

    const nodeListener = vi.fn();

    router.addNodeListener("", nodeListener);

    router.start((_err, state) => {
      expect(state).toMatchObject({
        meta: {
          id: 1,
          options: { replace: true },
          params: { home: {} },
        },
        name: "home",
        path: "/home",
        params: {},
      });

      expect(nodeListener).toHaveBeenCalled();
    });
  });

  it("should invoke listeners on navigation", () => {
    router.start(() => {
      router.navigate("home", {}, {}, () => {
        const previousState = router.getState();
        const listener = vi.fn();

        router.addListener("*", listener);

        router.navigate("orders.pending", {}, {}, () => {
          expect(listener).toHaveBeenCalledWith(
            router.getState(),
            previousState,
          );
        });
      });
    });
  });

  it("should not invoke listeners if trying to navigate to the current route", () => {
    router.start(() => {
      router.navigate("orders.view", { id: 123 }, {}, () => {
        const listener = vi.fn();

        router.addListener("*", listener);

        router.navigate("orders.view", { id: 123 }, {}, () => {
          expect(listener).not.toHaveBeenCalled();
        });
      });
    });
  });

  it("should invoke node listeners", () => {
    router.start(() => {
      router.navigate("users.list", {}, {}, () => {
        const nodeListener = vi.fn();

        router.addNodeListener("users", nodeListener);

        router.navigate("users.view", { id: 1 }, {}, () => {
          expect(nodeListener).toHaveBeenCalled();

          router.navigate("users.view", { id: 1 }, {}, () => {
            router.navigate("users.view", { id: 2 }, {}, () => {
              expect(nodeListener).toHaveBeenCalledTimes(2);
            });
          });
        });
      });
    });
  });

  it("should invoke node listeners on root", () => {
    router.start(() => {
      router.navigate("orders", {}, {}, () => {
        const nodeListener = vi.fn();

        router.addNodeListener("", nodeListener);

        router.navigate("users", {}, {}, () => {
          expect(nodeListener).toHaveBeenCalled();
        });
      });
    });
  });

  it("should invoke route listeners", () => {
    router.start(() => {
      router.navigate("users.list", {}, {}, () => {
        const nodeListener = vi.fn();

        router.addRouteListener("users", nodeListener);

        router.navigate("users", {}, {}, () => {
          expect(nodeListener).toHaveBeenCalled();
        });
      });
    });
  });

  it("should automatically remove node listeners if autoCleanUp", async () => {
    await new Promise((done) => {
      router.start(() => {
        router.navigate("orders.completed", {}, {}, () => {
          router.addNodeListener("orders", noop);

          router.navigate("users", {}, {}, () => {
            setTimeout(() => {
              expect(router.getListeners()["^orders"]).toStrictEqual([]);

              done(null);
            });
          });
        });
      });
    });
  });

  it("should warn if trying to register a listener on an unknown route", () => {
    vi.spyOn(console, "warn").mockImplementation(noop);

    router.addRouteListener("fake.route", noop);

    expect(console.warn).toHaveBeenCalled();

    vi.resetAllMocks();
  });

  it("should not invoke listeners removed by previously called listeners", () => {
    router.start(() => {
      router.navigate("home", {}, {}, () => {
        const listener2 = vi.fn();
        const listener1 = vi.fn(() => {
          router.removeListener("*", listener2);
        });

        router.addListener("*", listener1);
        router.addListener("*", listener2);

        router.navigate("orders.pending", {}, {}, () => {
          expect(listener1).toHaveBeenCalled();
          expect(listener2).not.toHaveBeenCalled();
        });
      });
    });
  });
});
