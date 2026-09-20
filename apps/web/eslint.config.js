import { base, react, forbidImports } from '@gh/config/eslint';

export default [
  ...base,
  ...react,
  // apps/web is the composition root: it may import every package, but nothing may reach
  // back into it, and it must never reach past a package to that package's substrate —
  // no Recharts behind @gh/charts, no MUI or Emotion behind @gh/ui. Anything the app
  // needs from MUI is exported by @gh/ui under a name of ours, which is what keeps the
  // design system swappable and guarantees a single MUI instance in the bundle.
  ...forbidImports(['recharts', 'recharts/*', '@mui/*', '@emotion/*']),
];
