import { base, react, forbidImports } from '@gh/config/eslint';

export default [
  ...base,
  ...react,
  // apps/web is the composition root: it may import every package, but nothing may
  // reach back into it, and it must never bypass @gh/charts to touch Recharts directly.
  ...forbidImports(['recharts', 'recharts/*']),
];
