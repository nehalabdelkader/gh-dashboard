# GitHub Repo Dashboard

Search GitHub repositories, track favourites, and monitor their stars, open issues and last
commit date with per-repo refresh.

## Workspace

```
apps/web              Vite + React 19 SPA — the only deployable
packages/config       @gh/config     — shared tsconfig / eslint / prettier bases
packages/github-api   @gh/github-api — GitHub REST client + domain types (no React, no Redux)
packages/ui           @gh/ui         — MUI design system, presentational only
```

Packages arriving in later phases: `@gh/charts`.

### `@gh/ui`

Theme factory (`createAppTheme`, `AppThemeProvider`), primitives (`StatTile`, `AppShell`,
`SearchField`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `ConfirmDialog`,
`ThemeToggle`) and composites (`RepoCard`, `RepoListItem`, `RepoList`).

Every component is prop-driven and emits callbacks — no store, no fetching, no router. A
single `status: 'idle' | 'loading' | 'refreshing' | 'error'` prop drives the per-card
visuals, which is what lets a grid of cards each hold an independent loading and error
state. Prop shapes (`RepoCardRepo`, `UiError`) are declared locally rather than imported
from `@gh/github-api`: packages never depend on each other, and the domain types happen to
satisfy them structurally.

Storybook is deliberately not installed — the components are verified through `apps/web`
from Phase 4 onward.

### Dependency direction (one-way)

```
apps/web ──▶ @gh/ui        ──▶ MUI
         ──▶ @gh/charts    ──▶ Recharts
         ──▶ @gh/github-api ──▶ (fetch only)
```

Packages never import each other, and never import from `apps/web`. pnpm's strict
`node_modules` makes an _undeclared_ cross-package import fail at build time; the
`forbidImports()` helper in `@gh/config/eslint` catches the case where the dependency was
declared to make such an import work.

## Commands

```bash
pnpm install
pnpm turbo run lint typecheck test build   # everything, cached
pnpm --filter web dev                      # app on http://localhost:5173
```

## Deploy

Vercel project **Root Directory is `apps/web`**, where `apps/web/vercel.json` lives. It
steps up to the workspace root so Turborepo can run the filtered build
(`turbo run build --filter=web...`), then serves `dist` with an SPA rewrite to
`/index.html`. pnpm installs from the workspace root automatically, so `@gh/config` and the
later packages resolve.
