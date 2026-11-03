import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
  test: {
    unstubGlobals: true,
    coverage: {
      include: ['src'],
      thresholds: { 100: true },
    },
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['test/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['test/e2e/*.test.ts'],
          globalSetup: ['test/e2e/setup.ts'],
          testTimeout: 30_000,
        },
      },
    ],
  },
});

export default config;
