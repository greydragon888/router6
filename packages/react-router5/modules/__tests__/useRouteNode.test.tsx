import {
  createTestRouter,
  createTestRouterWithADefaultRoute,
  FnChild,
  renderWithRouter,
} from "./helpers";
import { useRouteNode } from "react-router5";
import type { Router } from "router5";

let router: Router;

describe("useRouteNode hook", () => {
  let routerWithADefaultRoute: Router;

  beforeEach(() => {
    router = createTestRouter();
    routerWithADefaultRoute = createTestRouterWithADefaultRoute();
  });

  afterEach(() => {
    router.stop();
  });

  it("should return the router", () => {
    const ChildSpy = vi.fn(FnChild);

    renderWithRouter(router)(() => ChildSpy(useRouteNode("")));

    expect(ChildSpy).toHaveBeenCalledWith({
      router,
      route: undefined,
      previousRoute: undefined,
    });
  });

  it("should not return a null route with a default route and the router started", () => {
    const ChildSpy = vi.fn(FnChild);

    const BaseComponent = () => ChildSpy(useRouteNode(""));

    routerWithADefaultRoute.start(() => {
      renderWithRouter(routerWithADefaultRoute)(BaseComponent);

      /* first call, first argument */
      expect(ChildSpy.mock.calls[0][0].route.name).toStrictEqual("test");
    });
  });
});
