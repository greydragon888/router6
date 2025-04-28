import $$observable from "symbol-observable";
import { events, plugins } from "../constants";
import { RouterError } from "../RouterError";
import type {
  DefaultDependencies,
  Listener,
  Plugin,
  Router,
  SubscribeFn,
  Subscription,
} from "../types/router";
import type { NavigationOptions, State, Unsubscribe } from "../types/base";
import type { EventName, EventsKeys } from "../constants";

type EventMethodMap = {
  [K in EventsKeys as (typeof events)[K]]: (typeof plugins)[K];
};
type EventListenerMap = {
  [E in keyof EventMethodMap]: Plugin[EventMethodMap[E]][];
};

/**
 * Invoke all listeners for a given event.
 *
 * @template E  Event literal type.
 * @param eventName  The event being dispatched (used only for logging).
 * @param arr        Array of callbacks (or undefined).
 * @param args       Arguments to pass to each callback.
 */
function invokeFor<E extends EventName>(
  eventName: E,
  arr: Plugin[EventMethodMap[E]][] | undefined,
  ...args: Parameters<NonNullable<Plugin[EventMethodMap[E]]>>
): void {
  if (!arr) {
    return;
  }

  // Clone the listeners array so that removals/additions
  // during iteration won't affect this loop.
  const listeners = arr.slice();

  for (const cb of listeners) {
    if (!cb) {
      continue;
    }

    try {
      // Use Reflect.apply to pass the args array directly
      Reflect.apply(cb, undefined, args);
    } catch (err) {
      console.error(`Error in listener for ${eventName}:`, err);
    }
  }
}

export default function withObservability<
  Dependencies extends DefaultDependencies,
>(router: Router<Dependencies>): Router<Dependencies> {
  const callbacks: EventListenerMap = {
    [events.ROUTER_START]: [],
    [events.TRANSITION_START]: [],
    [events.TRANSITION_SUCCESS]: [],
    [events.TRANSITION_ERROR]: [],
    [events.TRANSITION_CANCEL]: [],
    [events.TEARDOWN]: [],
    [events.ROUTER_STOP]: [],
  };

  router.invokeEventListeners = (
    eventName: (typeof events)[EventsKeys],
    toState?: State,
    fromState?: State,
    arg?: RouterError | NavigationOptions,
  ) => {
    switch (eventName) {
      case events.TRANSITION_START:
      case events.TRANSITION_CANCEL:
        if (!toState) {
          throw new TypeError(
            `Expected toState to be defined for event ${eventName}`,
          );
        }

        invokeFor(eventName, callbacks[eventName], toState, fromState);

        break;
      case events.TRANSITION_ERROR:
        if (!arg || !(arg instanceof RouterError)) {
          throw new TypeError(
            `Expected toState and error to be defined for event ${eventName}`,
          );
        }

        invokeFor(eventName, callbacks[eventName], toState, fromState, arg);

        break;
      case events.TRANSITION_SUCCESS:
        if (
          !toState ||
          !arg ||
          typeof arg !== "object" ||
          arg instanceof RouterError
        ) {
          throw new TypeError(
            `Expected toState and options to be defined for event ${eventName}`,
          );
        }

        invokeFor(eventName, callbacks[eventName], toState, fromState, arg);

        break;
      default:
        invokeFor(eventName, callbacks[eventName]);

        break;
    }
  };

  router.removeEventListener = <E extends EventName>(
    eventName: E,
    cb: Plugin[EventMethodMap[E]],
  ) => {
    const idx = callbacks[eventName].indexOf(cb);

    if (idx === -1) {
      throw new Error(
        `Passed callback for event ${eventName} was not registered`,
      );
    }

    // Remove passed event listener
    callbacks[eventName].splice(idx, 1);
  };

  router.addEventListener = <E extends EventName>(
    eventName: E,
    cb: Plugin[EventMethodMap[E]],
  ): Unsubscribe => {
    callbacks[eventName].push(cb);

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
      events.TRANSITION_SUCCESS,
      (toState: State, fromState?: State) => {
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
  router[$$observable] = observable;
  router["@@observable"] = observable;

  return router;
}
