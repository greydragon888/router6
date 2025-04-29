import { createTestRouterWithADefaultRouter } from "../../__tests__/helpers";
import { act, renderHook } from "@testing-library/react";
import { RouterProvider, useRouteNode } from "react-router5";
import type { Router } from "router5";
import type { ReactNode } from "react";

const wrapper =
  (router: Router) =>
  ({ children }: { children: ReactNode }) => (
    <RouterProvider router={router}>{children}</RouterProvider>
  );

describe("useRouteNode hook", () => {
  let router: Router;

  beforeEach(() => {
    router = createTestRouterWithADefaultRouter();
  });

  afterEach(() => {
    router.stop();
  });

  it("should return the router", () => {
    const { result } = renderHook(() => useRouteNode(""), {
      wrapper: wrapper(router),
    });

    expect(result.current.router).toStrictEqual(router);
    expect(result.current.route).toStrictEqual(undefined);
    expect(result.current.previousRoute).toStrictEqual(undefined);
  });

  // add test for the state packages/router5-plugin-browser/modules/browser.ts:87
  it("should not return a null route with a default route and the router started", () => {
    const { result } = renderHook(() => useRouteNode(""), {
      wrapper: wrapper(router),
    });

    act(() => {
      router.start();
    });

    expect(result.current.route?.name).toStrictEqual("test");
  });

  it("should change route if hook was subscribed to root node", () => {
    const { result } = renderHook(() => useRouteNode(""), {
      wrapper: wrapper(router),
    });

    act(() => {
      router.start();
    });

    expect(result.current.route?.name).toStrictEqual("test");

    act(() => {
      router.navigate("one-more-test");
    });

    expect(result.current.route?.name).toStrictEqual("one-more-test");
  });

  it("should change route if hook was subscribed to changed node", () => {
    const { result } = renderHook(() => useRouteNode("items"), {
      wrapper: wrapper(router),
    });

    act(() => {
      router.start();
    });

    expect(result.current.route?.name).toStrictEqual(undefined);

    act(() => {
      router.navigate("items");
    });

    expect(result.current.route?.name).toStrictEqual(undefined);

    act(() => {
      router.navigate("items.item", { id: 6 });
    });

    expect(result.current.route?.name).toStrictEqual("items.item");
    expect(result.current.route?.params).toStrictEqual({ id: 6 });

    act(() => {
      router.navigate("items");
    });

    expect(result.current.route?.name).toStrictEqual("items");
    expect(result.current.route?.params).toStrictEqual({});
  });

  it("should not change route if hook was not subscribed to changed node", () => {
    const { result } = renderHook(() => useRouteNode("items"), {
      wrapper: wrapper(router),
    });

    act(() => {
      router.start();
    });

    expect(result.current.route).toStrictEqual(undefined);

    act(() => {
      router.navigate("one-more-test");
    });

    expect(result.current.route).toStrictEqual(undefined);

    act(() => {
      router.navigate("test");
    });

    expect(result.current.route).toStrictEqual(undefined);
  });

  it("should throw error if router instance was not passed to provider", () => {
    expect(() => renderHook(() => useRouteNode(""))).toThrow();
  });
});
