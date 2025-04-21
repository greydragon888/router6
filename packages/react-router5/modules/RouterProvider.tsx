import type { FC, ReactNode } from "react";
import { useMemo, useSyncExternalStore } from "react";
import { RouteContext, RouterContext } from "./context";
import { Router } from "router5";
import type { RouteState, UnsubscribeFn } from "./types";

export interface RouteProviderProps {
  router: Router;
  children: ReactNode;
}

export const RouterProvider: FC<RouteProviderProps> = ({
  router,
  children,
}) => {
  // Local store state to hold route information
  const store = useMemo(() => {
    let currentState: RouteState = {
      route: router.getState(),
      previousRoute: undefined,
    };

    // This will be called to return the current state snapshot
    const getSnapshot = () => currentState;

    // Subscribe to router updates and notify React when state changes
    const subscribe = (callback: () => void) => {
      return router.subscribe(({ route, previousRoute }) => {
        currentState = { route, previousRoute };
        callback(); // Notify React to trigger re-render
      }) as UnsubscribeFn;
    };

    return { getSnapshot, subscribe };
  }, [router]);

  // Using useSyncExternalStore to manage subscription and state updates
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return (
    <RouterContext.Provider value={router}>
      <RouteContext.Provider value={{ router, ...state }}>
        {children}
      </RouteContext.Provider>
    </RouterContext.Provider>
  );
};
