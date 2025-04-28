type ErrorCodesKeys =
  | "ROUTER_NOT_STARTED"
  | "NO_START_PATH_OR_STATE"
  | "ROUTER_ALREADY_STARTED"
  | "ROUTE_NOT_FOUND"
  | "SAME_STATES"
  | "CANNOT_DEACTIVATE"
  | "CANNOT_ACTIVATE"
  | "TRANSITION_ERR"
  | "TRANSITION_CANCELLED";

export type ErrorCodes = Record<ErrorCodesKeys, string>;

export type ConstantsKeys = "UNKNOWN_ROUTE";

export type Constants = Record<ConstantsKeys, string>;

export const errorCodes: ErrorCodes = {
  ROUTER_NOT_STARTED: "NOT_STARTED",
  NO_START_PATH_OR_STATE: "NO_START_PATH_OR_STATE",
  ROUTER_ALREADY_STARTED: "ALREADY_STARTED",
  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",
  SAME_STATES: "SAME_STATES",
  CANNOT_DEACTIVATE: "CANNOT_DEACTIVATE",
  CANNOT_ACTIVATE: "CANNOT_ACTIVATE",
  TRANSITION_ERR: "TRANSITION_ERR",
  TRANSITION_CANCELLED: "CANCELLED",
};

export const constants: Constants = {
  UNKNOWN_ROUTE: "@@router5/UNKNOWN_ROUTE",
};

export const plugins = <const>{
  ROUTER_START: "onStart",
  ROUTER_STOP: "onStop",
  TRANSITION_START: "onTransitionStart",
  TRANSITION_CANCEL: "onTransitionCancel",
  TRANSITION_SUCCESS: "onTransitionSuccess",
  TRANSITION_ERROR: "onTransitionError",
  TEARDOWN: "teardown",
};

export const events = <const>{
  ROUTER_START: "$start",
  ROUTER_STOP: "$stop",
  TRANSITION_START: "$$start",
  TRANSITION_CANCEL: "$$cancel",
  TRANSITION_SUCCESS: "$$success",
  TRANSITION_ERROR: "$$error",
  TEARDOWN: "$$teardown",
};

export type EventsKeys = keyof typeof plugins;

export type EventName = (typeof events)[EventsKeys];
