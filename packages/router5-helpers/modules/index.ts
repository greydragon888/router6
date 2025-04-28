import type { Params } from "router5";

const dotOrEnd = "(\\..+$|$)";
const dotOrStart = "(^.+\\.|^)";

export interface State {
  name: string;
  params?: Params;
  [key: string]: unknown;
}

const getName = (route: State | string): string => {
  return typeof route === "string" ? route : route.name || "";
};

const test = (route: State | string, regex: RegExp): boolean => {
  return regex.test(getName(route));
};

const normaliseSegment = (name: string): string => {
  return name.replace(".", "\\.");
};

const testRouteWithSegment =
  // eslint-disable-next-line sonarjs/function-return-type
  (start: string, end: string) => (route: State | string, segment?: string) => {
    if (segment) {
      return test(route, new RegExp(start + normaliseSegment(segment) + end));
    }

    return (segment: string) =>
      test(route, new RegExp(start + normaliseSegment(segment)));
  };

export type SegmentTestFunction = (
  route: State | string,
  segment?: string,
) => boolean | ((segment: string) => boolean);

export const startsWithSegment: SegmentTestFunction = testRouteWithSegment(
  "^",
  dotOrEnd,
);

export const endsWithSegment: SegmentTestFunction = testRouteWithSegment(
  dotOrStart,
  "$",
);

export const includesSegment: SegmentTestFunction = testRouteWithSegment(
  dotOrStart,
  dotOrEnd,
);
