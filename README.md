# GitHub Repo Dashboard

Search GitHub repositories, track favourites, and monitor their stars, open issues and last
commit date with per-repo refresh.

## Workspace

```
apps/web              Vite + React 19 SPA — the only deployable
packages/config       @gh/config     — shared tsconfig / eslint / prettier bases
packages/github-api   @gh/github-api — GitHub REST client + domain types (no React, no Redux)
packages/ui           @gh/ui         — MUI design system, presentational only
packages/charts       @gh/charts     — Recharts wrappers, MUI-free
```

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

`useThemeTokens()` flattens the theme to plain values (colours, font, radius). It exists
for consumers that are not MUI consumers — see `@gh/charts` below.

### `@gh/charts`

`ChartContainer` (frame, height, loading and empty states), `ChartDataTable` and
`StarsBarChart`.

No MUI, and no GitHub vocabulary: a chart takes `{ label, value, id? }` rows and a
`ChartTheme` object, so it renders under the app's theme without depending on it, and is
reusable against any data source. The two meet in exactly one file —
`apps/web/src/app/useChartTheme.ts` maps `useThemeTokens()` onto `ChartTheme`.

Sorting, formatting and what a bar click means are all the caller's: the stars chart is
sorted desc by `selectStarsChartData`, formatted with `@gh/ui`'s compact formatter, and
navigates to the repo's detail page.

Accessibility: the plot is one `role="img"` node with a generated `aria-label`, and the
same numbers are emitted as a visually-hidden table. When bars are clickable its labels
are buttons, which is the keyboard path to what a click does — an SVG rect is not
focusable. It is also what the tests assert on, since jsdom has no layout.

The stars chart costs no request: it reads the RTK Query cache the cards already fill, so
a refresh moves the bars for free.

### Data layer (`apps/web/src/store`)

Server state and client state are separated.

- **`githubApi`** (RTK Query) owns everything fetched from GitHub. Its cache is keyed
  **per argument**, so `getRepo({owner,name})` has its own `isFetching`, `error` and
  `data`. That is the "independent loading and error states per repo" requirement,
  implemented by the library instead of a hand-rolled `Record<repoId, LoadingState>`.
- **`tracked` / `settings`** are client state, persisted to `localStorage` under versioned
  keys (`gh-dash:tracked:v1`).
- **`rateLimit`** is observed state, written by the baseQuery from the `x-ratelimit-*`
  headers on every response — the quota chip costs no request of its own.

The custom `baseQuery` is the single place `@gh/github-api` meets Redux. It flattens the
client's error classes into a serializable `ApiError` (a Redux store may only hold plain
data, and `instanceof` survives neither the store nor DevTools), records quota, and bails
out of the `retry` wrapper for anything a second attempt cannot fix — retrying a 404 or a
spent quota only burns the remaining 60/hr.

Persistence is a listener middleware, not a reducer side effect: reducers stay pure. It
matches only the two persisted slices (RTK Query dispatches dozens of actions per search,
and `setItem` is synchronous) and debounces 300ms. `loadPersisted()` validates before
feeding `preloadedState`, dropping individual malformed entries rather than the whole
list — bad data that crashes boot would reload with the page and brick the app.

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
