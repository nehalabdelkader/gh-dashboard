import { useNavigate } from 'react-router-dom';
import { StarsBarChart, type ChartDatum } from '@gh/charts';
import { formatCompactNumber } from '@gh/ui';
import { parseRepoId, type RepoId } from '@gh/github-api';
import { useAppSelector } from '@/store/hooks.js';
import { selectStarsChartData, selectTrackedCount } from '@/store/tracked/selectors.js';
import { useChartTheme } from '@/app/useChartTheme.js';
import { repoDetailPath } from '@/app/routes.js';

/**
 * Stars across the tracked list.
 *
 * Costs no request: the bars are read out of the RTK Query cache the cards already
 * filled, so the chart follows a refresh for free — a card's refetch updates its cache
 * entry, the selector recomputes, the bar moves.
 *
 * The GitHub vocabulary stops here. `@gh/charts` is handed `{ id, label, value }` rows
 * and hands an `id` back on a click; turning that into a route is this side's job.
 */
export function StarsChart() {
  const navigate = useNavigate();
  const theme = useChartTheme();
  const data = useAppSelector(selectStarsChartData);
  const trackedCount = useAppSelector(selectTrackedCount);

  const openRepo = (datum: ChartDatum) => {
    const parsed = datum.id === undefined ? undefined : parseRepoId(datum.id as RepoId);
    if (parsed) void navigate(repoDetailPath(parsed.owner, parsed.name));
  };

  // Every card fetches on mount, so an empty `data` with repos tracked means the first
  // round of requests is still in flight — a plot of nothing would read as "no stars".
  const loading = data.length === 0 && trackedCount > 0;

  return (
    <StarsBarChart
      data={data}
      theme={theme}
      title="Stars"
      description="Across your tracked repositories. Select a bar to open its details."
      formatValue={(value) => formatCompactNumber(value)}
      onBarClick={openRepo}
      loading={loading}
      loadingMessage="Loading stars…"
      emptyMessage="No stars to plot yet."
      valueLabel="Stars"
      categoryLabel="Repository"
    />
  );
}
