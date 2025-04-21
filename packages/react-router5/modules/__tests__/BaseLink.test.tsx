import { BaseLink } from "..";
import { createTestRouter } from "./helpers";
import { render, screen } from "@testing-library/react";
import type { Router } from "router5";

let router: Router;
const TEST_TEXT = "Test text";

describe("BaseLink component", () => {
  beforeEach(() => {
    router = createTestRouter();
  });

  afterEach(() => {
    router.stop();
  });

  it("should render an hyperlink element", () => {
    router.addNode("home", "/home");

    render(
      <BaseLink router={router} routeName={"home"}>
        {TEST_TEXT}
      </BaseLink>,
    );

    const linkElement = screen.queryByText(TEST_TEXT)!;

    expect(linkElement.getAttribute("href")).toStrictEqual("/home");
    expect(linkElement.getAttribute("class")).not.toContain("active");
  });
});
