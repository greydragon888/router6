import type { State } from "./types/base";
import { errorCodes } from "./constants";

interface RouterErrorInterface extends Error {
  code: string;
  segment?: string | undefined;
  redirect?: State | undefined;
  [key: string]: unknown;
  setCode: (code: string) => void;
  setErrorInstance: (err: Error) => void;
  setAdditionalFields: (fields: Record<string, unknown>) => void;
}

export class RouterError extends Error implements RouterErrorInterface {
  get code() {
    return this.#code;
  }
  get segment(): string | undefined {
    return this.#segment;
  }
  get redirect(): State | undefined {
    return this.#redirect;
  }

  #code: string;
  readonly #segment: string | undefined;
  readonly #redirect: State | undefined;

  [key: string]: unknown;

  constructor(
    code: string,
    {
      message,
      segment,
      redirect,
      ...rest
    }: {
      message?: string | undefined;
      segment?: string | undefined;
      path?: string | undefined;
      redirect?: State | undefined;
      [key: string]: unknown;
    } = {},
  ) {
    super(message ?? code);

    this.#code = code;
    this.#segment = segment;
    this.#redirect = redirect;

    Object.assign(this, rest);
  }

  setCode(code: string): void {
    this.#code = code;

    if (Object.values(errorCodes).includes(this.message)) {
      this.message = code;
    }
  }

  setErrorInstance(err: Error) {
    this.message = err.message;
    this.cause = err.cause;
    this.stack = err.stack ?? "";
  }

  setAdditionalFields(fields: Record<string, unknown>): void {
    Object.assign(this, fields);
  }
}
