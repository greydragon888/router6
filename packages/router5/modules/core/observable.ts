// ToDo: remove eslint-disable
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import $$observable from "symbol-observable";
import { events } from "../constants";
import type { EventsKeys } from "../constants";
import type {
  DefaultDependencies,
  Listener,
  Plugin,
  Router,
  SubscribeFn,
  Subscription,
} from "../types/router";
import type { NavigationOptions, State, Unsubscribe } from "../types/base";
import { RouterError } from "../RouterError";

export default function withObservability<
  Dependencies extends DefaultDependencies,
>(router: Router<Dependencies>): Router<Dependencies> {
  const callbacks: Partial<
    Record<(typeof events)[EventsKeys], Plugin[keyof Plugin][]>
  > = {};

  router.invokeEventListeners = (
    eventName: (typeof events)[EventsKeys],
    toState?: State,
    fromState?: State,
    arg?: RouterError | NavigationOptions,
  ) => {
    const pluginsArr = callbacks[eventName];

    if (!pluginsArr) {
      return;
    }

    switch (eventName) {
      case events.TRANSITION_START:
      case events.TRANSITION_CANCEL:
        if (!toState) {
          throw new TypeError(
            `Expected toState to be defined for event ${eventName}`,
          );
        }

        (pluginsArr as Plugin["onTransitionCancel"][]).forEach((cb) => {
          if (!cb) {
            return;
          }

          cb(toState, fromState);
        });
        break;
      case events.TRANSITION_ERROR:
        if (!toState || !arg || !(arg instanceof RouterError)) {
          throw new TypeError(
            `Expected toState and error to be defined for event ${eventName}`,
          );
        }
        (pluginsArr as Plugin["onTransitionError"][]).forEach((cb) => {
          if (!cb) {
            return;
          }

          cb(toState, fromState, arg);
        });
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
        (pluginsArr as Plugin["onTransitionSuccess"][]).forEach((cb) => {
          if (!cb) {
            return;
          }

          cb(toState, fromState, arg);
        });
        break;
      default:
        (pluginsArr as Plugin["teardown"][]).forEach((cb) => {
          if (!cb) {
            return;
          }

          cb();
        });
        break;
    }
  };

  router.removeEventListener = (
    eventName: (typeof events)[EventsKeys],
    cb: Plugin[keyof Plugin],
  ) => {
    const pluginsArr = callbacks[eventName];

    if (!pluginsArr) {
      return;
    }

    callbacks[eventName] = pluginsArr.filter((_cb) => _cb !== cb);
  };

  router.addEventListener = (
    eventName: (typeof events)[EventsKeys],
    cb: Plugin[keyof Plugin],
  ): Unsubscribe => {
    const pluginsArr = eventName in callbacks ? callbacks[eventName] : [];

    callbacks[eventName] = pluginsArr?.concat(cb) ?? [cb];

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
