import { BaseLink, RouterProvider } from "react-router5";
import { createTestRouterWithADefaultRouter } from "./helpers";
import { screen, render, act, fireEvent } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { RouterError } from "router5";
import type { Router } from "router5";
import type { ReactNode } from "react";

describe("BaseLink component", () => {
  let router: Router;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <RouterProvider router={router}>{children}</RouterProvider>
  );

  beforeEach(() => {
    router = createTestRouterWithADefaultRouter();

    // ToDo: не сбрасывается состояние роутера после его остановки, если не передавать startPathOrState аргумент
    router.start("/");
  });

  afterEach(() => {
    router.stop();
  });

  it("should renders component, href and children correctly", () => {
    render(
      <BaseLink router={router} routeName="one-more-test" data-testid="link">
        Test
      </BaseLink>,
      { wrapper },
    );

    expect(screen.getByTestId("link")).toBeInTheDocument();
    expect(screen.getByTestId("link")).toHaveTextContent("Test");
    expect(screen.getByTestId("link")).toHaveAttribute("href", "/test");
  });

  it("should renders component with passed class name", () => {
    const testClass = "test-class";

    render(
      <BaseLink
        router={router}
        className={testClass}
        routeName="one-more-test"
        data-testid="link"
      >
        Test
      </BaseLink>,
      { wrapper },
    );

    expect(screen.getByTestId("link")).toBeInTheDocument();
    expect(screen.getByTestId("link")).toHaveClass(testClass);
  });

  describe("activeClassName", () => {
    it("should set active class if name current router state is same with link's route name and params is not specified", async () => {
      const baseLinkRouteName = "one-more-test";

      render(
        <BaseLink
          router={router}
          routeName={baseLinkRouteName}
          activeClassName="active"
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      expect(router.getState()?.name).not.toStrictEqual(baseLinkRouteName);
      expect(screen.getByTestId("link")).not.toHaveClass("active");

      await userEvent.click(screen.getByTestId("link"));

      expect(router.getState()?.name).toStrictEqual(baseLinkRouteName);
      expect(screen.getByTestId("link")).toHaveClass("active");
    });

    it("should set active class if name and params current router state is same with link's route name and route params", async () => {
      const baseLinkRouteName = "items.item";
      const baseLinkRouteParams = { id: 6 };

      const { rerender } = render(
        <BaseLink
          router={router}
          routeName={baseLinkRouteName}
          routeParams={baseLinkRouteParams}
          activeClassName="active"
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      expect(router.getState()?.name).not.toStrictEqual(baseLinkRouteName);
      expect(screen.getByTestId("link")).not.toHaveClass("active");

      await userEvent.click(screen.getByTestId("link"));

      expect(router.getState()?.name).toStrictEqual(baseLinkRouteName);
      expect(router.getState()?.params).toStrictEqual(baseLinkRouteParams);
      expect(screen.getByTestId("link")).toHaveClass("active");

      const newBaseLinkRouteParams = {
        ...baseLinkRouteParams,
        a: "b",
        c: "d",
      };

      rerender(
        <BaseLink
          router={router}
          routeName={baseLinkRouteName}
          routeParams={newBaseLinkRouteParams}
          activeClassName="active"
          data-testid="link"
        >
          Test
        </BaseLink>,
      );

      expect(router.getState()?.name).toStrictEqual(baseLinkRouteName);
      expect(router.getState()?.params).toStrictEqual(baseLinkRouteParams);
      expect(screen.getByTestId("link")).toHaveClass("active");
    });

    it("should toggle active class based on ignoreQueryParams and route parameters", () => {
      const baseLinkRouteName = "items.item";
      const baseLinkRouteParams = { id: 6 };

      const { rerender } = render(
        <BaseLink
          router={router}
          routeName={baseLinkRouteName}
          routeParams={baseLinkRouteParams}
          ignoreQueryParams={true}
          activeClassName="active"
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      expect(router.getState()?.name).not.toStrictEqual(baseLinkRouteName);
      expect(screen.getByTestId("link")).not.toHaveClass("active");

      act(() => {
        router.navigate(baseLinkRouteName, {
          ...baseLinkRouteParams,
          a: "b",
          c: "d",
        });
      });

      expect(router.getState()?.name).toStrictEqual(baseLinkRouteName);
      expect(router.getState()?.params).not.toStrictEqual(baseLinkRouteParams);
      expect(screen.getByTestId("link")).toHaveClass("active");

      rerender(
        <BaseLink
          router={router}
          routeName={baseLinkRouteName}
          routeParams={baseLinkRouteParams}
          ignoreQueryParams={false}
          activeClassName="active"
          data-testid="link"
        >
          Test
        </BaseLink>,
      );

      act(() => {
        router.navigate(baseLinkRouteName, {
          ...baseLinkRouteParams,
          e: "f",
          g: "h",
        });
      });

      expect(router.getState()?.name).toStrictEqual(baseLinkRouteName);
      expect(router.getState()?.params).not.toStrictEqual(baseLinkRouteParams);
      expect(screen.getByTestId("link")).not.toHaveClass("active");
    });

    it("should add active class if route matches exactly when activeStrict is true", async () => {
      const activeClassName = "active";

      const parentRouteName = "items";
      const childRouteName = "items.item";
      const childRouteParams = { id: 6 };

      act(() => {
        router.navigate(childRouteName, childRouteParams);
      });

      const { rerender } = render(
        <BaseLink
          router={router}
          routeName={parentRouteName}
          activeStrict={false}
          activeClassName={activeClassName}
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      expect(screen.getByTestId("link")).toHaveClass(activeClassName);

      await userEvent.click(screen.getByTestId("link"));

      expect(router.getState()?.name).toStrictEqual(parentRouteName);
      expect(screen.getByTestId("link")).toHaveClass(activeClassName);

      act(() => {
        router.navigate(parentRouteName);
      });

      expect(router.getState()?.name).toStrictEqual(parentRouteName);
      expect(screen.getByTestId("link")).toHaveClass(activeClassName);

      rerender(
        <BaseLink
          router={router}
          routeName={parentRouteName}
          activeStrict={true}
          activeClassName={activeClassName}
          data-testid="link"
        >
          Test
        </BaseLink>,
      );

      expect(screen.getByTestId("link")).toHaveClass(activeClassName);

      act(() => {
        router.navigate(childRouteName, childRouteParams);
      });

      expect(screen.getByTestId("link")).not.toHaveClass(activeClassName);
    });
  });

  describe("clickHandler", () => {
    it("should call callback onClick when the user presses the link if onClick was passed", async () => {
      const onClickMock = vi.fn();

      render(
        <BaseLink
          router={router}
          routeName="test"
          onClick={onClickMock}
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      const link = screen.getByTestId("link");

      await userEvent.click(link);

      expect(onClickMock).toHaveBeenCalled();
    });

    it("should call `onClick` callback but prevent `router.navigate` on non-left mouse button click or click with combo btn on link with target=_blank", async () => {
      const user = userEvent.setup();

      vi.spyOn(router, "navigate");

      const onClickMock = vi.fn();

      const currentRouteName = router.getState()?.name;
      const newRouteName = "one-more-test";

      const { rerender } = render(
        <BaseLink
          router={router}
          routeName={newRouteName}
          onClick={onClickMock}
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      // ToDo: change to userEvent
      fireEvent.click(screen.getByTestId("link"), { button: 1 });

      expect(onClickMock).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(router.getState()?.name).toStrictEqual(currentRouteName);

      vi.clearAllMocks();

      await user.keyboard("{Meta>}");
      await user.click(screen.getByTestId("link"));
      await user.keyboard("{/Meta}");

      expect(onClickMock).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(router.getState()?.name).toStrictEqual(currentRouteName);

      vi.clearAllMocks();

      await user.keyboard("{Alt>}");
      await user.click(screen.getByTestId("link"));
      await user.keyboard("{/Alt}");

      expect(onClickMock).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(router.getState()?.name).toStrictEqual(currentRouteName);

      vi.clearAllMocks();

      await user.keyboard("{Control>}");
      await user.click(screen.getByTestId("link"));
      await user.keyboard("{/Control}");

      expect(onClickMock).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(router.getState()?.name).toStrictEqual(currentRouteName);

      vi.clearAllMocks();
      await user.keyboard("{Shift>}");
      await user.click(screen.getByTestId("link"));
      await user.keyboard("{/Shift}");

      expect(onClickMock).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(router.getState()?.name).toStrictEqual(currentRouteName);

      rerender(
        <BaseLink
          router={router}
          routeName={newRouteName}
          onClick={onClickMock}
          data-testid="link"
        >
          Test
        </BaseLink>,
      );

      expect(onClickMock).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(router.getState()?.name).toStrictEqual(currentRouteName);
    });

    it("should call `onClick` callback when onClick prevents default", async () => {
      vi.spyOn(router, "navigate");

      const onClickMock = vi.fn((e) => e.preventDefault());

      const currentRouteName = router.getState()?.name;
      const newRouteName = "one-more-test";

      render(
        <BaseLink
          router={router}
          routeName={newRouteName}
          onClick={onClickMock}
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      await userEvent.click(screen.getByTestId("link"));

      expect(onClickMock).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(router.getState()?.name).toStrictEqual(currentRouteName);
    });
  });

  describe("successCallback & errorCallback", () => {
    it("should invoke successCallback if navigate was passed", async () => {
      vi.spyOn(router, "navigate");

      const successCallbackMock = vi.fn();

      const newRouteName = "one-more-test";

      render(
        <BaseLink
          router={router}
          routeName={newRouteName}
          successCallback={successCallbackMock}
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      await userEvent.click(screen.getByTestId("link"));

      expect(router.navigate).toHaveBeenCalled();
      expect(router.getState()?.name).toStrictEqual(newRouteName);
      expect(successCallbackMock).toHaveBeenCalled();
    });

    it("should invoke errorCallback if navigate was passed", async () => {
      const error = new RouterError("Test error");

      vi.spyOn(router, "navigate").mockImplementation((_, __, ___, cb): any => {
        cb(error);
      });

      const errorCallbackMock = vi.fn();

      const defRouteName = router.getState()?.name;

      render(
        <BaseLink
          router={router}
          routeName={"one-more-test"}
          errorCallback={errorCallbackMock}
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      await userEvent.click(screen.getByTestId("link"));

      expect(router.getState()?.name).toStrictEqual(defRouteName);
      expect(router.navigate).toHaveBeenCalled();
      expect(errorCallbackMock).toHaveBeenCalledWith(error);
    });

    it("should invoke errorCallback and not successCallback when both callbacks provided and navigate failed", async () => {
      const error = new RouterError("Another error");
      const successCallbackMock = vi.fn();
      const errorCallbackMock = vi.fn();

      vi.spyOn(router, "navigate").mockImplementation((_, __, ___, cb): any => {
        cb(error);
      });

      render(
        <BaseLink
          router={router}
          routeName="one-more-test"
          successCallback={successCallbackMock}
          errorCallback={errorCallbackMock}
          data-testid="link"
        >
          Test
        </BaseLink>,
        { wrapper },
      );

      await userEvent.click(screen.getByTestId("link"));

      expect(errorCallbackMock).toHaveBeenCalledWith(error);
      expect(router.navigate).toHaveBeenCalled();
      expect(successCallbackMock).not.toHaveBeenCalled();
    });
  });
});
