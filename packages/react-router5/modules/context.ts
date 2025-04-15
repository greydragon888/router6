import { createContext } from "react";
import type { RouteContext as RouteContextType } from "./types";
import type { Router } from "router5";

export const RouteContext = createContext<RouteContextType>(null);
export const RouterContext = createContext<Router>(null);
