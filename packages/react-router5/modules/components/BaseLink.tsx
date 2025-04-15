import { useCallback, useEffect, useState, useMemo } from "react";
import type { FC, MouseEvent } from "react";
import type { BaseLinkProps } from "./interfaces";
import type { State } from "router5";

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
  const getActiveState = () =>
    router.isActive(routeName, routeParams, activeStrict, ignoreQueryParams);

  // State to track if the link is active or not
  const [active, setActive] = useState<boolean>(getActiveState());

  // Callback to handle successful or erroneous navigation
  const callback: (err?: any, state?: State) => void = useCallback(
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
    if (router.buildUrl) {
      return router.buildUrl(routeName, routeParams);
    }

    return router.buildPath(routeName, routeParams);
  }, [routeName, routeParams]);

  // Update the active state based on the isActive result
  useEffect(() => {
    setActive(getActiveState());
  }, [routeName, routeParams, activeStrict, ignoreQueryParams]);

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
    [onClick, routeName, routeParams, routeOptions, callback, target],
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
