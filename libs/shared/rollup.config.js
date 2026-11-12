import typescript from '@rollup/plugin-typescript';

/** @type {import('rollup').RollupOptions} */
const options = {
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist',
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].es.js',
    },
    {
      dir: 'dist',
      format: 'cjs',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].cjs',
    },
  ],
  treeshake: 'smallest',
  // Tests stay out of the published build
  plugins: [typescript({ exclude: ['**/*.spec.ts'] })],
  external: [
    'zod',
    'libphonenumber-js',
    '@openathlete/database',
    /^@openathlete\/database\/.*/,
  ],
};

export default options;
