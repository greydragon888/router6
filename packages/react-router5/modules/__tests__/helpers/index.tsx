import { RouterProvider } from "../..";
import { render } from "@testing-library/react";
import createRouter from "router5";
import browserPlugin from "router5-plugin-browser";
import type { FC, ComponentType } from "react";
import type { Router } from "router5";

export const FnChild: FC = () => <div />;

export const createTestRouter = (): Router => {
  const router = createRouter([]);

  router.usePlugin(browserPlugin());

  return router;
};

export const createTestRouterWithADefaultRouter = (): Router => {
  const router = createRouter(
    [
      {
        name: "test",
        path: "/",
      },
      {
        name: "one-more-test",
        path: "/test",
      },
      {
        name: "items",
        path: "/items",
        children: [
          {
            name: "item",
            path: "/items/:id",
          },
        ],
      },
    ],
    { defaultRoute: "test" },
  );

  router.usePlugin(
    browserPlugin({
      useHash: false,
    }),
  );

  return router;
};

export const renderWithRouter =
  (router: Router) => (BaseComponent: ComponentType) =>
    render(
      <RouterProvider router={router}>
        <BaseComponent />
      </RouterProvider>,
    );
