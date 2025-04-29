import { createTestRouter } from "../../__tests__/helpers";
import { renderHook } from "@testing-library/react";
import { RouterProvider, useRouter } from "react-router5";
import type { Router } from "router5";
import type { ReactNode } from "react";

const wrapper =
  (router: Router) =>
  ({ children }: { children: ReactNode }) => (
    <RouterProvider router={router}>{children}</RouterProvider>
  );

describe("useRouter hook", () => {
  let router: Router;

  beforeEach(() => {
    router = createTestRouter();
  });

  afterEach(() => {
    router.stop();
  });

  it("should return router", () => {
    const { result } = renderHook(() => useRouter(), {
      wrapper: wrapper(router),
    });

    expect(result.current).toStrictEqual(router);
  });

  it("should throw error if router instance was not passed to provider", () => {
    expect(() => renderHook(() => useRouter())).toThrow();
  });
});
