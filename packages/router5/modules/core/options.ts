import type { DefaultDependencies, Options, Router } from "../types/router";

const defaultOptions: Options = {
  trailingSlashMode: "default",
  queryParamsMode: "default",
  strictTrailingSlash: false,
  autoCleanUp: true,
  allowNotFound: false,
  strongMatching: true,
  rewritePathOnMatch: true,
  caseSensitive: false,
  urlParamsEncoding: "default",
};

export default function withOptions<Dependencies extends DefaultDependencies>(
  options: Partial<Options>,
): (router: Router<Dependencies>) => Router<Dependencies> {
  return (router: Router<Dependencies>): Router<Dependencies> => {
    const routerOptions: Options = {
      ...defaultOptions,
      ...options,
    };

    router.getOptions = () => routerOptions;

    router.setOption = <K extends keyof Options>(
      option: K,
      value: Options[K],
    ): Router<Dependencies> => {
      routerOptions[option] = value;

      return router;
    };

    return router;
  };
}
