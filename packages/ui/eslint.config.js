import { base, react, forbidImports } from '@gh/config/eslint';

export default [
  ...base,
  ...react,
  // Design system: presentational only. No store, no data fetching, no sibling packages.
  // Every component takes props and emits callbacks — it must not know a store exists.
  ...forbidImports([
    'redux',
    '@reduxjs/*',
    'react-redux',
    'react-router',
    'react-router-dom',
    '@gh/github-api',
    '@gh/github-api/*',
    '@gh/charts',
    '@gh/charts/*',
    'recharts',
    'recharts/*',
    'web',
    'web/*',
  ]),
];
