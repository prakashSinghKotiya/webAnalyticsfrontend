import { memo } from 'react';
import { formatNumber } from '../dashboard.utils';

/**
 * ReliabilitySnapshotCard
 *
 * Renders the exact "Reliability snapshot" card seen in Hosting Reviews:
 *  - Header with title & green shield icon
 *  - Hero incident row with large number & pill badge ('✓ All clear' or '! X recorded')
 *  - Fastest response (ms)
 *  - Slowest response (ms)
 *  - Longest uptime streak (checks)
 *  - Probes verification disclaimer box
 */
function ReliabilitySnapshotCard({ stats }) {
  const hostingStats = stats?.hostingStats || {};
  const incidents = hostingStats.incidents?.count ?? stats?.downIncidents ?? 0;
  const minMs = hostingStats.responseTime?.min ?? stats?.minResponseTime ?? 0;
  const maxMs = hostingStats.responseTime?.max ?? stats?.maxResponseTime ?? 0;
  const longestStreak =
    hostingStats.incidents?.longestUpStreakChecks ?? stats?.longestStreak ?? stats?.totalChecks ?? 0;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs transition hover:border-[var(--border-bright)]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            Reliability snapshot
          </h3>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-500"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Hero Row: Incident Count */}
        <div className="my-5 flex items-baseline justify-between">
          <div>
            <span className="font-['JetBrains_Mono',monospace] text-4xl sm:text-5xl font-black text-[var(--text)]">
              {incidents}
            </span>
            <span className="ml-2 text-xs text-[var(--muted-2)]">
              downtime incident{incidents === 1 ? '' : 's'}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold border ${
              incidents === 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}
          >
            {incidents === 0 ? '✓ All clear' : `! ${incidents} recorded`}
          </span>
        </div>

        {/* Clean Metric Rows */}
        <div className="space-y-3 font-['JetBrains_Mono',monospace] text-xs pt-1">
          <div className="flex justify-between border-b border-[var(--border)] pb-2.5">
            <span className="text-[var(--muted-2)]">Fastest response</span>
            <strong className="text-[var(--text)]">
              {minMs > 0 ? `${minMs} ms` : '—'}
            </strong>
          </div>

          <div className="flex justify-between border-b border-[var(--border)] pb-2.5">
            <span className="text-[var(--muted-2)]">Slowest response</span>
            <strong className="text-[var(--text)]">
              {maxMs > 0 ? `${maxMs} ms` : '—'}
            </strong>
          </div>

          <div className="flex justify-between">
            <span className="text-[var(--muted-2)]">Longest uptime streak</span>
            <strong className="text-emerald-500">
              {formatNumber(longestStreak)} checks
            </strong>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-2.5 text-[11px] text-[var(--muted-2)]">
        Measured 24/7 across multiple independent global synthetic monitoring probes.
      </div>
    </div>
  );
}

export default memo(ReliabilitySnapshotCard);
