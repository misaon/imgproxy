import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
  test: {
    unstubGlobals: true,
    coverage: {
      include: ['src'],
      thresholds: { 100: true },
    },
  },
});

export default config;
