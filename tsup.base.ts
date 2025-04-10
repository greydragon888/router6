import type { Format, Options } from 'tsup';

const OUT_DIR = 'dist';

const commonConfig: Partial<Options> = {
  entry: ['modules/index.ts'],
  clean: true,
  minify: true,
  sourcemap: true,
  target: 'esnext',
};

export const createConfig = (custom: Partial<Options> = {}): Options[] => (
  ['esm', 'cjs'].map((format: Format) => ({
  ...commonConfig,
    format,
    dts: format === 'esm',
    outDir: `${OUT_DIR}/${format}`,
  ...custom,
})));
