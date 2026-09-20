import { Link } from 'react-router-dom';
import { Button, EmptyState } from '@gh/ui';
import { ROUTES } from './routes.js';

/** No API calls — a bad URL should never cost a request. */
export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="That URL doesn't match any page in this dashboard."
      action={
        <Button component={Link} to={ROUTES.search} variant="contained">
          Back to search
        </Button>
      }
    />
  );
}
