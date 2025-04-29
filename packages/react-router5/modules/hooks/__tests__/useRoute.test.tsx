import { createTestRouterWithADefaultRouter } from "../../__tests__/helpers";
import { act, renderHook } from "@testing-library/react";
import { RouterProvider, useRoute } from "react-router5";
import type { Router } from "router5";
import type { ReactNode } from "react";

const wrapper =
  (router: Router) =>
  ({ children }: { children: ReactNode }) => (
    <RouterProvider router={router}>{children}</RouterProvider>
  );

describe("useRoute hook", () => {
  let router: Router;

  beforeEach(() => {
    router = createTestRouterWithADefaultRouter();

    router.start();
  });

  afterEach(() => {
    router.stop();
  });

  it("should return router", () => {
    const { result } = renderHook(() => useRoute(), {
      wrapper: wrapper(router),
    });

    expect(result.current.router).toStrictEqual(router);
  });

  it("should return current route", () => {
    vi.spyOn(router, "subscribe");

    const { result } = renderHook(() => useRoute(), {
      wrapper: wrapper(router),
    });

    expect(result.current.route?.name).toStrictEqual("test");

    act(() => {
      router.navigate("items");
    });

    expect(result.current.route?.name).toStrictEqual("items");
  });

  it("should throw error if router instance was not passed to provider", () => {
    expect(() => renderHook(() => useRoute())).toThrow();
  });
});
