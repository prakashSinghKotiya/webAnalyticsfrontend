import { memo } from 'react';
import { formatNumber } from '../dashboard.utils';

/**
 * PerformanceStatCards
 *
 * Renders the 4 compact KPI stat cards matching the exact design and metrics
 * displayed in Hosting Reviews:
 *  1. Recorded uptime (big %, down checks indicator, emerald mini bar)
 *  2. Avg. response time (ms, SVG micro-sparkline, p95 percentile metric)
 *  3. Speed score (0-100 composite score, rating badge, colored progress bar)
 *  4. Total checks (check count, monitor website count, monitoring duration in days)
 */
function PerformanceStatCards({ stats, monitorsCount = 1 }) {
  const hostingStats = stats?.hostingStats || {};
  const uptime = hostingStats.uptime?.percentage ?? stats?.uptimePercentNumber ?? 100;
  const downCount = hostingStats.checks?.down ?? stats?.downCount ?? 0;
  const avgRt = hostingStats.responseTime?.avg ?? stats?.avgResponseTime ?? 0;
  const p95 = hostingStats.responseTime?.p95 ?? stats?.p95 ?? avgRt;
  const speedScore = hostingStats.performanceScore ?? stats?.speedScore ?? 85;
  const totalChecks = hostingStats.checks?.total ?? stats?.totalChecks ?? 0;
  const windowDays = hostingStats.checks?.windowDays ?? stats?.windowDays ?? 1;
  const sparklinePoints = stats?.sparklinePoints || '';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* ── Card 1: Recorded Uptime ─────────────────────────────────────── */}
      <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition hover:border-[var(--border-bright)]">
        <div className="flex items-center justify-between text-xs text-[var(--muted-2)]">
          <div className="flex items-center gap-1.5">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-500"
              aria-hidden="true"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="font-medium">Recorded uptime</span>
          </div>
          <span title="Operational availability measured across all check intervals">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--muted)] cursor-help"
              aria-label="Uptime info"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
        </div>

        <div className="my-2.5">
          <span className="font-['JetBrains_Mono',monospace] text-3xl font-black text-[var(--text)]">
            {uptime != null ? `${uptime}%` : '100%'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2 text-[11px] text-[var(--muted-2)]">
          <div
            className={`h-1.5 w-16 rounded-full ${
              downCount === 0 ? 'bg-emerald-500' : uptime >= 98 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
          />
          <span className="truncate font-['JetBrains_Mono',monospace]">
            {downCount === 0 ? 'All checks passed' : `${downCount} check${downCount > 1 ? 's' : ''} down`}
          </span>
        </div>
      </div>

      {/* ── Card 2: Avg. Response Time ───────────────────────────────────── */}
      <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition hover:border-[var(--border-bright)]">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--cyan)]"
            aria-hidden="true"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span className="font-medium">Avg. response time</span>
        </div>

        <div className="my-2.5 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-['JetBrains_Mono',monospace] text-3xl font-black text-[var(--text)]">
              {avgRt > 0 ? Math.round(avgRt) : '—'}
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">ms</span>
          </div>

          {/* Micro Trend Sparkline */}
          {sparklinePoints ? (
            <svg width="56" height="20" className="overflow-visible ml-auto" aria-hidden="true">
              <polyline
                points={sparklinePoints}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="40"
              height="18"
              viewBox="0 0 40 18"
              fill="none"
              className="ml-auto text-emerald-500"
              aria-hidden="true"
            >
              <path
                d="M2 14L15 8L25 11L38 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <div className="border-t border-[var(--border)] pt-2 text-[11px] text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
          {p95 > 0 ? `${Math.round(p95)} ms at 95th percentile` : 'Latency calibrated'}
        </div>
      </div>

      {/* ── Card 3: Speed Score ─────────────────────────────────────────── */}
      <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition hover:border-[var(--border-bright)]">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-500"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="font-medium">Speed score</span>
        </div>

        <div className="my-2.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-['JetBrains_Mono',monospace] text-3xl font-black text-[var(--text)]">
              {speedScore}
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">/ 100</span>
          </div>

          <span
            className={`font-['JetBrains_Mono',monospace] text-[10px] font-bold ${
              speedScore >= 90
                ? 'text-emerald-500'
                : speedScore >= 80
                ? 'text-[var(--cyan)]'
                : 'text-amber-500'
            }`}
          >
            {speedScore >= 90 ? 'EXCELLENT' : speedScore >= 80 ? 'GOOD' : 'AVERAGE'}
          </span>
        </div>

        <div className="border-t border-[var(--border)] pt-2">
          <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                speedScore >= 90
                  ? 'bg-emerald-500'
                  : speedScore >= 80
                  ? 'bg-[var(--cyan)]'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, speedScore))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Card 4: Total Checks ────────────────────────────────────────── */}
      <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition hover:border-[var(--border-bright)]">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--text)]"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          <span className="font-medium">Total checks</span>
        </div>

        <div className="my-2.5 flex items-baseline gap-2">
          <span className="font-['JetBrains_Mono',monospace] text-3xl font-black text-[var(--text)]">
            {formatNumber(totalChecks)}
          </span>
          <span className="text-xs text-[var(--muted-2)]">
            across {monitorsCount} website{monitorsCount > 1 ? 's' : ''}
          </span>
        </div>

        <div className="border-t border-[var(--border)] pt-2 text-[11px] text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
          • {windowDays} day{windowDays > 1 ? 's' : ''} of monitoring
        </div>
      </div>
    </div>
  );
}

export default memo(PerformanceStatCards);
