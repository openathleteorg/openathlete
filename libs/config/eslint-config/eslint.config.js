import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'prettier/prettier': [
        'warn',
        {
          parser: 'typescript',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_+$',
          varsIgnorePattern: '^_+$',
        },
      ],
      'no-console': ['warn', { allow: ['error'] }],
      'no-debugger': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      complexity: 'off',
      'max-lines': 'off',
      'max-params': 'off',
      'no-extra-boolean-cast': ['warn', { enforceForLogicalOperands: true }],
      'no-case-declarations': 'warn',
      'no-prototype-builtins': 'off',
      'no-constant-condition': 'warn',
      'no-empty': 'off',
    },
  },
  {
    ignores: [
      '**/build/**/*',
      '**/dist*/**/*',
      '**/cdk.out/**/*',
      '**/public/**/*',
      '**/coverage/**/*',
      '**/node_modules/**/*',
      '**/vite.config**',
      'eslint.config.js',
    ],
  },
);

