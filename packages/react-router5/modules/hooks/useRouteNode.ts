import { useContext, useMemo, useSyncExternalStore } from "react";
import { shouldUpdateNode } from "router5-transition-path";
import { RouterContext } from "../context";
import type { RouteContext, RouteState } from "../types";

/**
 * A hook that subscribes to a specific route node in router6
 * and provides the current and previous route when the node is affected.
 */
export const useRouteNode = (nodeName: string): RouteContext => {
  // Access the router instance from context
  const router = useContext(RouterContext);

  if (!router) {
    throw new Error("useRouteNode must be used within a RouterProvider");
  }

  // Memoize the shouldUpdate function to avoid re-creating it on every render
  const shouldUpdate = useMemo(() => shouldUpdateNode(nodeName), [nodeName]);

  // Create a store object that will track route state and provide subscription
  const store = useMemo(() => {
    // Local mutable state to keep track of the current and previous route
    let currentState: RouteState = {
      route: router.getState(),
      previousRoute: undefined,
    };

    // This function is called by React to read the current value of the store
    const getSnapshot = () => currentState;

    // Subscribe to router updates; notify React when the relevant node is updated
    const subscribe = (callback: () => void) => {
      const unsubscribe = router.subscribe(({ route, previousRoute }) => {
        // Only update state if this route node is affected
        if (shouldUpdate(route, previousRoute)) {
          currentState = { route, previousRoute };
          callback(); // Notify React to trigger re-render
        }
      });

      return () => {
        if (typeof unsubscribe !== "function") {
          throw new Error("Router unsubscribe is not a function");
        }

        unsubscribe(); // Unsubscribe from router updates
      };
    };

    return { getSnapshot, subscribe };
  }, [router, shouldUpdate]);

  // useSyncExternalStore handles subscription lifecycle and scheduling safely
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);

  // Return a memoized context object to avoid unnecessary rerenders
  return useMemo(() => ({ router, ...state }), [router, state]);
};
