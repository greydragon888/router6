// ToDo: fix import from router5
export interface NavigationOptions {
  replace?: boolean;
  reload?: boolean;
  skipTransition?: boolean;
  force?: boolean;
  [key: string]:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | undefined;
}

export interface Params {
  [key: string]:
    | string
    | number
    | boolean
    | Params
    | Record<string, string>
    | undefined;
}

export interface StateMeta<P extends Params = Params> {
  id: number;
  params: P;
  options: NavigationOptions;
  redirected: boolean;
  source?: string | undefined;
}

export interface State<P extends Params = Params, MP extends Params = Params> {
  name: string;
  params: P;
  path: string;
  meta?: StateMeta<MP> | undefined;
}

export type SegementParams = Record<string, string>;

export interface TransitionPath {
  intersection: string;
  toDeactivate: string[];
  toActivate: string[];
}

export const nameToIDs = (name: string): string[] =>
  name
    .split(".")
    .reduce(
      (ids: string[], name: string) =>
        ids.concat(ids.length ? `${ids[ids.length - 1]}.${name}` : name),
      [],
    );

const exists = (val: unknown): boolean => val !== undefined && val !== null;

const hasMetaParams = (state: State): boolean => !!state.meta?.params;

const extractSegmentParams = (name: string, state: State): SegementParams => {
  if (!hasMetaParams(state) || !exists(state.meta?.params[name])) {
    return {};
  }

  return Object.keys(state.meta?.params[name] ?? {}).reduce((params, param) => {
    return {
      ...params,
      [param]: state.params[param],
    };
  }, {});
};

export default function transitionPath(
  toState: State,
  fromState?: State,
): TransitionPath {
  const toStateOptions = toState.meta?.options ?? {};
  const fromStateIds = fromState ? nameToIDs(fromState.name) : [];
  const toStateIds = nameToIDs(toState.name);
  const maxI = Math.min(fromStateIds.length, toStateIds.length);

  function pointOfDifference() {
    let i;
    for (i = 0; i < maxI; i += 1) {
      const left = fromStateIds[i];
      const right = toStateIds[i];

      if (left !== right) {
        return i;
      }

      const leftParams = extractSegmentParams(left, toState);
      const rightParams = fromState
        ? extractSegmentParams(right, fromState)
        : {};

      if (Object.keys(leftParams).length !== Object.keys(rightParams).length) {
        return i;
      }
      if (Object.keys(leftParams).length === 0) {
        continue;
      }

      const different = Object.keys(leftParams).some(
        (p) => rightParams[p] !== leftParams[p],
      );
      if (different) {
        return i;
      }
    }

    return i;
  }

  let i;
  if (!fromState || toStateOptions.reload) {
    i = 0;
  } else if (!hasMetaParams(fromState) && !hasMetaParams(toState)) {
    i = 0;
  } else {
    i = pointOfDifference();
  }

  const toDeactivate = fromStateIds.slice(i).reverse();
  const toActivate = toStateIds.slice(i);

  const intersection = fromState && i > 0 ? fromStateIds[i - 1] : "";

  return {
    intersection,
    toDeactivate,
    toActivate,
  };
}
