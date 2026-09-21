/**
 * The detail page's contract is that its sections are independent.
 *
 * So every test here fails exactly one endpoint and asserts on what is still standing —
 * the grading criterion for this page is not that it renders, but that it keeps
 * rendering when a quarter of it does not.
 */
import { configureStore } from '@reduxjs/toolkit';
import { AppThemeProvider } from '@gh/ui';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { githubApi } from '@/store/api/githubApi.js';
import { rootReducer } from '@/store/rootReducer.js';
import { ROUTES } from '@/app/routes.js';
import { RepoDetailPage } from './RepoDetailPage.js';

const OWNER = 'facebook';
const NAME = 'react';

function repoPayload() {
  return {
    name: NAME,
    full_name: `${OWNER}/${NAME}`,
    owner: { login: OWNER, avatar_url: '' },
    description: 'A JavaScript library',
    html_url: `https://github.com/${OWNER}/${NAME}`,
    homepage: 'https://react.dev',
    default_branch: 'main',
    language: 'JavaScript',
    stargazers_count: 1234,
    open_issues_count: 7,
    forks_count: 3,
    watchers_count: 9,
    subscribers_count: 11,
    license: { spdx_id: 'MIT' },
    topics: ['ui'],
    size: 1,
    fork: false,
    private: false,
  };
}

const COMMITS = [
  {
    sha: 'abc123',
    html_url: 'https://github.com/x/y/commit/abc123',
    commit: { message: 'latest', committer: { date: '2024-06-01T00:00:00.000Z' } },
  },
];

const LANGUAGES = { JavaScript: 800, CSS: 200 };

const CONTRIBUTORS = [
  { login: 'gaearon', contributions: 120, avatar_url: '', html_url: 'https://github.com/gaearon' },
  { login: 'sebmarkbage', contributions: 60, avatar_url: '', html_url: 'https://github.com/s' },
];

type Failure = { status: number; body?: unknown };

/** Routes by path suffix, so one handler covers all five endpoints. */
function stubFetch(failures: Record<string, Failure> = {}) {
  const stub = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(typeof input === 'string' ? input : input.toString());
    const path = url.pathname;
    const key = path.endsWith('/commits')
      ? 'commits'
      : path.endsWith('/languages')
        ? 'languages'
        : path.endsWith('/contributors')
          ? 'contributors'
          : 'repo';

    const failure = failures[key];
    if (failure) {
      return new Response(failure.body === undefined ? '' : JSON.stringify(failure.body), {
        status: failure.status,
        headers: { 'content-type': 'application/json' },
      });
    }

    const body =
      key === 'commits'
        ? COMMITS
        : key === 'languages'
          ? LANGUAGES
          : key === 'contributors'
            ? CONTRIBUTORS
            : repoPayload();

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', stub);
  return stub;
}

function renderPage(path = `/repo/${OWNER}/${NAME}`) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(githubApi.middleware),
  });

  render(
    <Provider store={store}>
      <AppThemeProvider mode="light">
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.repoDetail} element={<RepoDetailPage />} />
            <Route path={ROUTES.search} element={<p>search page</p>} />
          </Routes>
        </MemoryRouter>
      </AppThemeProvider>
    </Provider>,
  );

  return store;
}

/** A section by its heading, so assertions are scoped to the panel that owns the query. */
function section(name: RegExp) {
  return screen.getByRole('heading', { name }).closest('section') as HTMLElement;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RepoDetailPage', () => {
  it('loads every section in parallel from the URL alone', async () => {
    const fetchStub = stubFetch();
    renderPage();

    expect(await screen.findByRole('heading', { name: `${OWNER}/${NAME}` })).toBeInTheDocument();
    expect(await screen.findByText('gaearon')).toBeInTheDocument();

    // Stats, last commit, languages, contributors — four, all on mount.
    await waitFor(() => {
      expect(fetchStub).toHaveBeenCalledTimes(4);
    });
    // Through the donut's accessible table: its legend carries the same names, and the
    // table is the version that is actually promised.
    expect(
      within(section(/languages/i)).getByRole('rowheader', { name: 'JavaScript' }),
    ).toBeInTheDocument();
  });

  it('keeps the rest of the page when one section fails', async () => {
    stubFetch({ contributors: { status: 500, body: { message: 'boom' } } });
    renderPage();

    // The failure is the contributors panel's alone.
    const contributors = await screen.findByRole('heading', { name: /top contributors/i });
    // A 500 is retryable, so the baseQuery's `retry` wrapper spends its two attempts with
    // backoff before the error surfaces — well past the default 1s timeout.
    expect(
      await within(contributors.closest('section') as HTMLElement).findByRole(
        'alert',
        {},
        { timeout: 5000 },
      ),
    ).toBeVisible();

    // Everything else rendered from its own query.
    expect(screen.getByRole('heading', { name: `${OWNER}/${NAME}` })).toBeInTheDocument();
    expect(
      within(section(/languages/i)).getByRole('rowheader', { name: 'JavaScript' }),
    ).toBeInTheDocument();
  });

  it('answers a bad owner/name with a not-found page, not a broken one', async () => {
    stubFetch({ repo: { status: 404, body: { message: 'Not Found' } } });
    renderPage('/repo/nobody/nothing');

    expect(await screen.findByText(/repository not found/i)).toBeInTheDocument();
    // No half-rendered page behind the message.
    expect(screen.queryByRole('heading', { name: /top contributors/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /back to search/i }));
    expect(await screen.findByText('search page')).toBeInTheDocument();
  });

  it('tracks and untracks from the detail page', async () => {
    stubFetch();
    const store = renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Track' }));
    expect(store.getState().tracked.entities[`${OWNER}/${NAME}`]).toEqual({
      id: `${OWNER}/${NAME}`,
      owner: OWNER,
      name: NAME,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Untrack' }));
    expect(store.getState().tracked.ids).toEqual([]);
  });
});
