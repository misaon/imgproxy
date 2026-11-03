import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintConfigXo from 'eslint-config-xo';
import unicorn from 'eslint-plugin-unicorn';
import { type Config, defineConfig } from 'eslint/config';

const scripts = ['**/*.{js,mjs,cjs,ts,mts,cts}'];

const config: Config[] = defineConfig([
  { ignores: ['examples'] },
  ...eslintConfigXo({
    space: true,
    prettier: 'compat',
    gitignore: import.meta.url,
  }),
  { files: scripts, extends: [unicorn.configs.all, eslintConfigPrettier] },
  {
    files: scripts,
    rules: {
      'capitalized-comments': 'off',
      'prefer-template': 'error',
      'no-console': 'error',
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'multiline-block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
      'import-x/first': 'error',
      'import-x/no-mutable-exports': 'error',
      'import-x/newline-after-import': 'error',
      'unicorn/filename-case': 'off',
    },
  },
  {
    files: ['package.json'],
    rules: {
      // `main`, `module` and `types` keep 1.x consumers on legacy resolvers working.
      'package-json/prefer-exports': 'off',
      // A new `engines` range could block installs that work with 1.x.
      'package-json/require-engines': 'off',
      // Full Git URL is what publint and npm provenance expect.
      'package-json/prefer-shorthand': 'off',
      'package-json/dependency-version-range': [
        'error',
        { range: 'caret', exceptions: ['@misaon/imgproxy-v1'] },
      ],
    },
  },
]);

export default config;
