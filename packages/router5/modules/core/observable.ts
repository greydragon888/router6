import $$observable from "symbol-observable";
import { constants } from "../constants";
import type {
  DefaultDependencies,
  Listener,
  Router,
  SubscribeFn,
  Subscription,
} from "../types/router";
import type { State, Unsubscribe } from "../types/base";

export default function withObservability<
  Dependencies extends DefaultDependencies,
>(router: Router<Dependencies>): Router<Dependencies> {
  const callbacks: Record<string, Function[]> = {};

  router.invokeEventListeners = (
    eventName: string,
    toState?: State,
    fromState?: State,
    ...args: unknown[]
  ) => {
    (eventName in callbacks ? callbacks[eventName] : []).forEach((cb) =>
      cb(toState, fromState, ...args),
    );
  };

  router.removeEventListener = (
    eventName: string,
    cb: (toState: State, fromState?: State) => void,
  ) => {
    callbacks[eventName] = callbacks[eventName].filter((_cb) => _cb !== cb);
  };

  router.addEventListener = (
    eventName: string,
    cb: (toState: State, fromState?: State) => void,
  ): Unsubscribe => {
    callbacks[eventName] = [
      ...(eventName in callbacks ? callbacks[eventName] : []),
      cb,
    ];

    return () => {
      router.removeEventListener(eventName, cb);
    };
  };

  function subscribe(
    listener: SubscribeFn | Listener,
  ): Unsubscribe | Subscription {
    const isObject = typeof listener === "object";
    const finalListener = isObject ? listener.next.bind(listener) : listener;

    // Automatically listens to the TRANSITION_SUCCESS event
    const unsubscribeHandler = router.addEventListener(
      constants.TRANSITION_SUCCESS,
      (toState, fromState) => {
        finalListener({
          route: toState,
          previousRoute: fromState,
        });
      },
    );

    return isObject ? { unsubscribe: unsubscribeHandler } : unsubscribeHandler;
  }

  function observable() {
    return {
      subscribe(observer: SubscribeFn | Listener): Unsubscribe | Subscription {
        if (typeof observer !== "object") {
          throw new TypeError("Expected the observer to be an object.");
        }
        return subscribe(observer);
      },

      [$$observable]() {
        return this;
      },
    };
  }

  router.subscribe = subscribe;
  //@ts-expect-error: TypeScript does not allow indexing with a symbol, but this is required for observable interop
  router[$$observable] = observable;
  //@ts-expect-error: TypeScript does not allow indexing with a symbol, but this is required for observable interop
  router["@@observable"] = observable;

  return router;
}
