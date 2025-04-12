import { mergeConfig, defineProject } from 'vitest/config'
import sharedConfig from '../../vitest.config';

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      environment: 'happy-dom',
      exclude: ['**/__tests__/helpers/**'],
      setupFiles: './modules/setup.ts',
    },
  })
)
