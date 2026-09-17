import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

/** Ignored everywhere. */
export const ignores = {
  ignores: ['dist/**', 'coverage/**', '.turbo/**', 'storybook-static/**', '**/*.d.ts'],
};

/**
 * Base config for every package: JS + TS recommended, unused-var hygiene, prettier last.
 */
export const base = tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  prettier,
);

/**
 * Extra rules for packages that render React.
 */
export const react = tseslint.config({
  files: ['**/*.{ts,tsx}'],
  plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
});

/**
 * Dependency-direction guard.
 *
 * The monorepo's rule is one-way: `apps/web` may import every package, and no package may
 * import the app or another sibling package. pnpm's strict node_modules already makes an
 * *undeclared* import fail at build time; this rule catches the case where someone declares
 * the dependency to make the import work. Pass the specifier patterns this package must
 * never import.
 *
 * @param {string[]} patterns bare-specifier globs, e.g. ['@gh/ui', '@gh/ui/*', 'react-redux']
 */
export function forbidImports(patterns) {
  return tseslint.config({
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: patterns.map((group) => ({
            group: [group],
            message: `Dependency-direction violation: this package must not import "${group}". See README §Architecture.`,
          })),
        },
      ],
    },
  });
}

export default base;
