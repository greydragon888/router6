import { createTestRouter } from "./helpers";
import { ConnectedLink, RouterProvider } from "..";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { Router } from "router5";

let router: Router;
const TEST_TEXT = "Test text";

describe("ConnectedLink component", () => {
  beforeEach(() => {
    router = createTestRouter();
    router.add({
      name: "home",
      path: "/home",
    });
    router.start();
  });
  afterEach(() => {
    router.stop();
  });

  it('should not call router’s navigate method when used with target="_blank"', async () => {
    render(
      <RouterProvider router={router}>
        <ConnectedLink routeName="home" title="Hello" target="_blank">
          {TEST_TEXT}
        </ConnectedLink>
      </RouterProvider>,
    );
    const a = screen.queryByText(TEST_TEXT);
    const navSpy = vi.spyOn(router, "navigate");

    await userEvent.click(a);

    expect(a.getAttribute("target")).toBeDefined();
    expect(navSpy).not.toHaveBeenCalled();
  });

  it("should spread other props to its link", async () => {
    render(
      <RouterProvider router={router}>
        <ConnectedLink routeName="home" title="Hello" data-testid="Link">
          {TEST_TEXT}
        </ConnectedLink>
      </RouterProvider>,
    );

    const a = screen.queryByText(TEST_TEXT);

    expect(a.getAttribute("title")).toBe("Hello");
    expect(a.getAttribute("data-testid")).toBe("Link");
    expect(a.getAttribute("href")).toBe("/home");

    await userEvent.click(a);

    expect(a.getAttribute("class")).toContain("active");
  });
});
