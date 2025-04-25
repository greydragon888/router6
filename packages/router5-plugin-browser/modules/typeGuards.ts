import type { Params, State } from "router5";
import type { HistoryState } from "./types";

export function isState<P extends Params, MP extends Params>(
  state: unknown,
): state is State<P, MP> {
  return (
    typeof state === "object" &&
    state !== null &&
    "name" in state &&
    "params" in state &&
    "path" in state &&
    state.name !== undefined &&
    state.params !== undefined &&
    state.path !== undefined
  );
}

export function isHistoryState(state: unknown): state is HistoryState {
  return (
    typeof state === "object" &&
    state !== null &&
    "params" in state &&
    "name" in state &&
    "path" in state &&
    state.name !== undefined &&
    state.params !== undefined &&
    state.path !== undefined
  );
}
