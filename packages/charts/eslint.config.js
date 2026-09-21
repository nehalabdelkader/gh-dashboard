import { base, react, forbidImports } from '@gh/config/eslint';

export default [
  ...base,
  ...react,
  // Charts are theme-agnostic by contract: the consumer passes a `ChartTheme` object, so
  // the package renders under the MUI theme without ever importing MUI. No store, no
  // data fetching, no sibling packages.
  ...forbidImports([
    '@mui/*',
    '@emotion/*',
    'redux',
    '@reduxjs/*',
    'react-redux',
    'react-router',
    'react-router-dom',
    '@gh/ui',
    '@gh/ui/*',
    '@gh/github-api',
    '@gh/github-api/*',
    'web',
    'web/*',
  ]),
];
