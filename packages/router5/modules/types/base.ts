export type Unsubscribe = () => void;

export type DoneFnError =
  | {
      code?: string;
      error?: State | Error;
      segment?: string;
      reason?: string;
      redirect?: State;
      [key: string]: unknown;
    } // Errors with a code and additional properties
  | { promiseError: Error; redirect?: State; [key: string]: unknown } // Errors from promises
  | Error // Standard errors
  | string // String errors
  | null;

export type DoneFn = (err?: DoneFnError, state?: State) => void;

export type CancelFn = () => void;

export interface SimpleState {
  name: string;
  params: Params;
}

export interface State {
  name: string;
  params: Params;
  path: string;
  meta?: StateMeta | undefined;
}

export interface StateMeta {
  id: number;
  params: Params;
  options: NavigationOptions;
  redirected: boolean;
  source?: string | undefined;
}

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

export type Params = {
  [key: string]:
    | string
    | number
    | boolean
    | Params
    | {
        [key: string]: string;
      }
    | undefined;
};
