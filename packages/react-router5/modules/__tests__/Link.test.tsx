import { createTestRouter } from "./helpers";
import { Link, RouterProvider } from "..";
import { render, screen } from "@testing-library/react";
import type { Router } from "router5";

let router: Router;
const TEST_TEXT = "Test text";

describe("Link component", () => {
  beforeEach(() => {
    router = createTestRouter();

    router.add({
      name: "home",
      path: "/home",
    });
  });
  afterEach(() => {
    router.stop();
  });

  it("should render an hyperlink element", () => {
    render(
      <RouterProvider router={router}>
        <Link routeName={"home"}>{TEST_TEXT}</Link>
      </RouterProvider>,
    );

    expect(screen.queryByText(TEST_TEXT).getAttribute("href")).toBe("/home");
    expect(screen.queryByText(TEST_TEXT).getAttribute("class")).not.toContain(
      "active",
    );
  });

  it("should have active class if associated route is active", () => {
    router.setOption("defaultRoute", "home");
    router.start();

    render(
      <RouterProvider router={router}>
        <Link routeName={"home"}>{TEST_TEXT}</Link>
      </RouterProvider>,
    );

    expect(screen.queryByText(TEST_TEXT).getAttribute("class")).toContain(
      "active",
    );
  });
});
