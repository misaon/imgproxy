import { defineConfig, type UserConfig } from 'tsdown';

const config: UserConfig = defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2020',
  fixedExtension: true,
  dts: true,
  publint: { level: 'warning', strict: true },
  attw: { profile: 'strict', level: 'error' },
  failOnWarn: true,
  plugins: [
    {
      // Keeps the 1.x `types` entry working for `moduleResolution: node10` consumers.
      name: 'emit-node10-types',
      generateBundle(_options, bundle) {
        const declaration = bundle['index.d.mts'];

        if (declaration?.type === 'chunk') {
          // eslint-disable-next-line unicorn/no-this-outside-of-class -- Rolldown plugin context
          this.emitFile({
            type: 'asset',
            fileName: 'index.d.ts',
            source: declaration.code,
          });
        }
      },
    },
  ],
});

export default config;
