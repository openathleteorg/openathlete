import baseConfig from '@openathlete/eslint-config';

export default [
  ...(Array.isArray(baseConfig) ? baseConfig : [baseConfig]),
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/*.d.ts',
      'node_modules/**',
    ],
  },
];

