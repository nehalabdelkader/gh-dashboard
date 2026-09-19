import { base, forbidImports } from '@gh/config/eslint';

export default [
  ...base,
  // Transport layer: framework-agnostic by contract. No React, no Redux, no sibling
  // packages, no reaching back into the app. Pure async functions plus domain types.
  ...forbidImports([
    'react',
    'react-*',
    'redux',
    '@reduxjs/*',
    '@gh/ui',
    '@gh/ui/*',
    '@gh/charts',
    '@gh/charts/*',
    'web',
    'web/*',
  ]),
];
