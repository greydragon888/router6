import type { HTMLAttributes, MouseEventHandler } from "react";
import type { NavigationOptions, Router, State } from "router5";

export interface BaseLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  router: Router;
  routeName: string;
  route?: State | null;
  previousRoute?: State | null;
  routeParams?: Record<string, any>;
  routeOptions?: NavigationOptions;
  className?: string;
  activeClassName?: string;
  activeStrict?: boolean;
  ignoreQueryParams?: boolean;
  target?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  onMouseOver?: MouseEventHandler<HTMLAnchorElement>;
  successCallback?: (state?: State) => void;
  errorCallback?: (error?: any) => void;
}
