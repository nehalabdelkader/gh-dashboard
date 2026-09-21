import { LanguagesDonut } from '@gh/charts';
import { useGetLanguagesQuery } from '@/store/api/githubApi.js';
import { toErrorDisplay } from '@/store/api/errorCopy.js';
import { useChartTheme } from '@/app/useChartTheme.js';
import { DetailSection } from './DetailSection.js';

export interface LanguagesSectionProps {
  owner: string;
  name: string;
}

const PERCENT = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
});

/**
 * Language breakdown, as a donut.
 *
 * Plots `share` rather than `bytes`: the question is what the repo is written in, and a
 * donut already draws proportions — plotting raw bytes would make the tooltip read
 * "4,918,233" where "62.1%" is the answer.
 */
export function LanguagesSection({ owner, name }: LanguagesSectionProps) {
  const theme = useChartTheme();
  const { data, isLoading, error, refetch } = useGetLanguagesQuery({ owner, name });
  const display = toErrorDisplay(error);

  const slices = (data ?? []).map((slice) => ({
    id: slice.language,
    label: slice.language,
    value: slice.share,
  }));

  return (
    <DetailSection
      title="Languages"
      loading={isLoading}
      error={display}
      onRetry={() => void refetch()}
      empty={!isLoading && slices.length === 0}
      emptyMessage="GitHub reports no language breakdown for this repository."
    >
      <LanguagesDonut
        data={slices}
        theme={theme}
        formatValue={(value) => PERCENT.format(value)}
        valueLabel="Share"
        categoryLabel="Language"
        height={240}
      />
    </DetailSection>
  );
}
