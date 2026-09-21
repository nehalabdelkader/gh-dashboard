import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RepoDetailPage } from '../features/repo-detail/RepoDetailPage.js';
import { SearchPage } from '../features/search/SearchPage.js';
import { TrackedPage } from '../features/tracked/TrackedPage.js';
import { AppLayout } from './AppLayout.js';
import { NotFoundPage } from './NotFoundPage.js';
import { ROUTES } from './routes.js';

/**
 * Declarative routing. Anything unmatched falls through to the catch-all rather than to
 * a blank screen.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.search} element={<SearchPage />} />
          <Route path={ROUTES.tracked} element={<TrackedPage />} />
          <Route path={ROUTES.repoDetail} element={<RepoDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
