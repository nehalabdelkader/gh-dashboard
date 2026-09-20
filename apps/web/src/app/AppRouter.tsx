import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SearchPage } from '../features/search/SearchPage.js';
import { AppLayout } from './AppLayout.js';
import { NotFoundPage } from './NotFoundPage.js';
import { ROUTES } from './routes.js';

/**
 * Declarative routing. Only the search route exists so far; `/tracked` and
 * `/repo/:owner/:name` slot in beside it as their phases land, and anything else falls
 * through to the catch-all rather than to a blank screen.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.search} element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
