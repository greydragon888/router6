import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { FC, MouseEvent } from "react";
import type { BaseLinkProps } from "./interfaces";
import type { State } from "router5";
import type { RouterError } from "router5";

export const BaseLink: FC<BaseLinkProps> = ({
  routeName,
  routeParams = {},
  routeOptions = {},
  className,
  activeClassName = "active",
  activeStrict = false,
  ignoreQueryParams = true,
  onClick,
  successCallback,
  errorCallback,
  target,
  router,
  children,
  ...linkProps
}) => {
  const getSnapshot = useCallback(
    () =>
      router.isActive(routeName, routeParams, activeStrict, ignoreQueryParams),
    [router, routeName, routeParams, activeStrict, ignoreQueryParams],
  );

  const subscribe = useCallback(
    (callback: () => void) => {
      const unsubscribe = router.subscribe(() => {
        callback();
      });

      return () => {
        /* c8 ignore next 3 */
        if (typeof unsubscribe !== "function") {
          throw new Error("Router unsubscribe is not a function");
        }

        unsubscribe(); // Unsubscribe from router updates
      };
    },
    [router],
  );

  const active = useSyncExternalStore(subscribe, getSnapshot);

  // Callback to handle successful or erroneous navigation
  const callback: (err?: RouterError, state?: State) => void = useCallback(
    (err, state) => {
      if (!err && successCallback) {
        successCallback(state);
      }

      if (err && errorCallback) {
        errorCallback(err);
      }
    },
    [successCallback, errorCallback],
  );

  // Build URL using router's buildUrl or buildPath methods
  const buildUrl = useMemo(() => {
    return router.buildUrl(routeName, routeParams);
  }, [routeName, routeParams, router]);

  // Handler for click events, handles navigation
  const clickHandler = useCallback(
    (evt: MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(evt);

        // Prevent default behavior if the callback calls preventDefault
        if (evt.defaultPrevented) {
          return;
        }
      }

      // Check if a modifier key is pressed (e.g., meta, ctrl, shift, alt)
      const comboKey = evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey;

      // Only navigate if left mouse button is clicked and no modifier keys
      if (evt.button === 0 && !comboKey && target !== "_blank") {
        evt.preventDefault(); // Prevent default link behavior
        router.navigate(routeName, routeParams, routeOptions, callback);
      }
    },
    [onClick, target, router, routeName, routeParams, routeOptions, callback],
  );

  // Build the class name string for the link
  const linkClassName = useMemo(() => {
    return [active ? activeClassName : "", className].join(" ").trim();
  }, [active, activeClassName, className]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { previousRoute, ...restProps } = linkProps;

  return (
    <a
      {...restProps}
      href={buildUrl}
      className={linkClassName}
      onClick={clickHandler}
    >
      {children}
    </a>
  );
};
