import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import baseConfig from '@openathlete/eslint-config';
import tseslint from 'typescript-eslint';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  ...(Array.isArray(baseConfig) ? baseConfig : [baseConfig]),
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    ignores: [
      'dist/**',
      '**/dist/**',
      'node_modules/**',
      '**/*.d.ts',
    ],
  },
);

