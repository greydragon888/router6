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
    const routerOptions = {
      ...defaultOptions,
      ...options,
    } as Options;

    router.getOptions = () => routerOptions;

    router.setOption = (
      option: keyof Options,
      value: Options[keyof Options],
    ): Router<Dependencies> => {
      (routerOptions as Record<keyof Options, Options[keyof Options]>)[option] =
        value;

      return router;
    };

    return router;
  };
}
