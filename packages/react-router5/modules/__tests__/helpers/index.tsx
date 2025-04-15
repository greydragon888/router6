import { RouterProvider } from "../..";
import { render } from "@testing-library/react";
import createRouter from "router5";
import browserPlugin from "router5-plugin-browser";
import type { FC } from "react";
import type { Router } from "router5";

export const FnChild: FC<Record<string, any>> = () => <div />;

export const createTestRouter = (): Router => {
  const router = createRouter([]);

  router.usePlugin(browserPlugin());

  return router;
};

export const createTestRouterWithADefaultRoute = (): Router => {
  const router = createRouter(
    [
      {
        name: "test",
        path: "/",
      },
    ],
    { defaultRoute: "test" },
  );
  router.usePlugin(
    browserPlugin({
      useHash: true,
    }),
  );
  return router;
};

export const renderWithRouter = (router: Router) => (BaseComponent) =>
  render(
    <RouterProvider router={router}>
      <BaseComponent />
    </RouterProvider>,
  );
