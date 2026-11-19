import { memo, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  MONTH_NAMES,
  calculateMonthDelta,
  formatMs,
  formatNumber,
  getUptimeColor,
} from '../dashboard.utils';

/**
 * DeltaBadge
 * Renders month-over-month delta with correct polarity
 * type: 'rate' (higher is better e.g. uptime)
 * type: 'inverse' (lower is better e.g. latency, incidents)
 */
function DeltaBadge({ value, type = 'rate', unit = '' }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-[var(--muted-2)]">—</span>;
  }

  const num = Number(value);
  const isZero = num === 0;
  const isPositive = num > 0;

  let isGood = false;
  let isBad = false;

  if (type === 'rate') {
    if (isPositive) isGood = true;
    else if (!isZero) isBad = true;
  } else if (type === 'inverse') {
    if (num < 0) isGood = true; // decrease in latency or outages is GOOD
    else if (isPositive) isBad = true; // increase is BAD
  }

  const colorClass = isGood
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    : isBad
    ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    : 'text-[var(--muted-2)] bg-[var(--surface-2)] border-[var(--border)]';

  const arrow = isPositive ? '↑' : num < 0 ? '↓' : '→';
  const sign = isPositive ? '+' : '';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      <span>{arrow}</span>
      <span>
        {sign}
        {num}
        {unit}
      </span>
    </span>
  );
}

/**
 * Custom Tooltip for Monthly Bar Chart
 */
function MonthlyBarTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0].payload;
  const uptimeColor = getUptimeColor(d.uptimePercent);

  return (
    <div className="z-50 min-w-[200px] rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-3 text-xs shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between border-b border-[var(--border)] pb-1.5 font-semibold text-[var(--text)]">
        <span>{d.monthLabel}</span>
        {d.isFinal ? (
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-500">
            Finalized
          </span>
        ) : (
          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500">
            In Progress
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted-2)]">Uptime:</span>
          <span className="font-['JetBrains_Mono',monospace] font-bold" style={{ color: uptimeColor }}>
            {d.uptimePercent != null ? `${d.uptimePercent}%` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted-2)]">Avg Response:</span>
          <span className="font-['JetBrains_Mono',monospace] text-[var(--text)]">
            {formatMs(d.avgResponseTime)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted-2)]">Total Checks:</span>
          <span className="font-['JetBrains_Mono',monospace] text-[var(--text)]">
            {formatNumber(d.totalChecks)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted-2)]">Incidents:</span>
          <span
            className="font-['JetBrains_Mono',monospace] font-semibold"
            style={{ color: d.incidentCount > 0 ? '#ef4444' : 'var(--text)' }}
          >
            {d.incidentCount}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * MonthlyStatsSection
 * Renders persistent monthly rollup, month-over-month comparison, and trend bar chart.
 */
function MonthlyStatsSection({
  monthlyData,
  fallbackMonth = null,
  loading = false,
  refreshing = false,
  error = null,
  onRefresh,
}) {
  const stats = useMemo(() => {
    if (Array.isArray(monthlyData?.stats) && monthlyData.stats.length > 0) {
      return monthlyData.stats;
    }
    if (fallbackMonth) {
      return [fallbackMonth];
    }
    return [];
  }, [monthlyData, fallbackMonth]);

  const current = monthlyData?.current || stats[0] || null;
  const previous = monthlyData?.previous || stats[1] || null;

  const delta = useMemo(() => {
    const rawDelta = monthlyData?.delta;
    if (rawDelta) {
      return {
        uptimeDiff: rawDelta.uptimePercent ?? rawDelta.uptimeDiff ?? null,
        latencyDiff: rawDelta.avgResponseTime ?? rawDelta.latencyDiff ?? null,
        incidentsDiff: rawDelta.incidentCount ?? rawDelta.incidentsDiff ?? null,
      };
    }
    return calculateMonthDelta(current, previous);
  }, [monthlyData?.delta, current, previous]);

  // Chronological order for chart X-Axis (oldest to newest)
  const chartData = useMemo(() => {
    return [...stats].reverse().map((s) => ({
      ...s,
      monthLabel: `${MONTH_NAMES[s.month - 1]} ${s.year}`,
    }));
  }, [stats]);

  if (loading && !stats.length) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted-2)]">
        <svg className="mb-2 h-6 w-6 animate-spin text-[var(--cyan)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p>Loading monthly statistics…</p>
      </div>
    );
  }

  if (error && !stats.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-400">
        <p>Failed to load monthly statistics: {error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-3 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted-2)]">
        <p className="font-semibold text-[var(--text)]">No monthly rollup data recorded yet for this monitor.</p>
        <p className="mt-1 text-xs text-[var(--muted)] max-w-md">
          Monthly statistics accumulate permanently on the backend PostgreSQL database. You can trigger an on-demand rollup calculation right now.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] px-4 py-2 text-xs font-bold text-[var(--cyan)] hover:brightness-110 transition cursor-pointer"
        >
          <svg
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{refreshing ? 'Calculating Rollup…' : 'Sync Monthly Rollup Now'}</span>
        </button>
      </div>
    );
  }

  const currentUptimeColor = getUptimeColor(current?.uptimePercent);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Section Header & Sync Button ──────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)] sm:text-2xl">
              Monthly Availability & Comparison
            </h2>
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-400">
              Persistent Rollup
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted-2)]">
            Compare performance month-over-month. Preserved permanently even after 30-day raw check purges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || loading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--border-bright)] hover:text-[var(--cyan)] transition disabled:opacity-50 shadow-xs"
            title="Trigger on-demand incremental rollup"
          >
            <svg
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{refreshing ? 'Syncing Rollup…' : 'Sync Latest'}</span>
          </button>
        </div>
      </div>

      {/* ── Month-over-Month Comparison Cards (4 Cards) ────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Monthly Uptime % */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Current Month Uptime
            </span>
            {delta?.uptimeDiff != null && (
              <DeltaBadge value={delta.uptimeDiff} type="rate" unit="%" />
            )}
          </div>
          <div className="mt-3">
            <div
              className="font-['Outfit',sans-serif] text-3xl font-bold tracking-tight"
              style={{ color: currentUptimeColor }}
            >
              {current?.uptimePercent != null ? `${current.uptimePercent}%` : '—'}
            </div>
            <p className="mt-1 text-xs text-[var(--muted-2)]">
              {previous?.uptimePercent != null
                ? `vs ${previous.uptimePercent}% last month (${MONTH_NAMES[previous.month - 1]})`
                : 'First tracked month'}
            </p>
          </div>
        </div>

        {/* Card 2: Average Latency */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Avg Response Time
            </span>
            {delta?.latencyDiff != null && (
              <DeltaBadge value={delta.latencyDiff} type="inverse" unit="ms" />
            )}
          </div>
          <div className="mt-3">
            <div className="font-['Outfit',sans-serif] text-3xl font-bold tracking-tight text-[var(--text)]">
              {formatMs(current?.avgResponseTime)}
            </div>
            <p className="mt-1 text-xs text-[var(--muted-2)]">
              {previous?.avgResponseTime != null
                ? `vs ${formatMs(previous.avgResponseTime)} last month`
                : 'Latency benchmark'}
            </p>
          </div>
        </div>

        {/* Card 3: Outage Incidents */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Outage Incidents
            </span>
            {delta?.incidentsDiff != null && (
              <DeltaBadge value={delta.incidentsDiff} type="inverse" />
            )}
          </div>
          <div className="mt-3">
            <div
              className="font-['Outfit',sans-serif] text-3xl font-bold tracking-tight"
              style={{ color: current?.incidentCount > 0 ? '#ef4444' : 'var(--text)' }}
            >
              {current?.incidentCount ?? 0}
            </div>
            <p className="mt-1 text-xs text-[var(--muted-2)]">
              {previous?.incidentCount != null
                ? `vs ${previous.incidentCount} outage${previous.incidentCount === 1 ? '' : 's'} prior`
                : 'Transitions into DOWN'}
            </p>
          </div>
        </div>

        {/* Card 4: Total Sample Checks */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Checks Evaluated
            </span>
            {!current?.isFinal && (
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                In Progress
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="font-['Outfit',sans-serif] text-3xl font-bold tracking-tight text-[var(--text)]">
              {formatNumber(current?.totalChecks)}
            </div>
            <p className="mt-1 text-xs text-[var(--muted-2)]">
              {current?.upChecks != null
                ? `${formatNumber(current.upChecks + (current.degradedChecks || 0))} operational checks`
                : 'Monthly checks'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Monthly Bar Chart + Historical Comparison Table ────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Uptime % Bar Chart (1 col on large screens) */}
        <div className="flex flex-col rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)] lg:col-span-1">
          <div className="mb-4">
            <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
              Uptime % Across Months
            </h3>
            <p className="text-xs text-[var(--muted-2)]">
              Historical availability percentage by calendar month.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  stroke="var(--muted)"
                  tickLine={false}
                  tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
                />
                <YAxis
                  stroke="var(--muted)"
                  tickLine={false}
                  tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
                  domain={[90, 100]}
                  unit="%"
                />
                <Tooltip content={<MonthlyBarTooltip />} />
                <Bar dataKey="uptimePercent" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={getUptimeColor(entry.uptimePercent)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Historical Comparison Table (2 cols on large screens) */}
        <div className="flex flex-col rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
              Month-by-Month Performance History
            </h3>
            <p className="text-xs text-[var(--muted-2)]">
              Full breakdown of uptime, latency, TTFB, DNS, and downtime incident counts.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted-2)]">
                  <th className="pb-3 font-semibold">Month</th>
                  <th className="pb-3 font-semibold">Uptime %</th>
                  <th className="pb-3 font-semibold">Checks</th>
                  <th className="pb-3 font-semibold">Avg Latency</th>
                  <th className="pb-3 font-semibold">TTFB</th>
                  <th className="pb-3 font-semibold">DNS</th>
                  <th className="pb-3 font-semibold">Incidents</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {stats.map((s, idx) => {
                  const label = `${MONTH_NAMES[s.month - 1]} ${s.year}`;
                  const color = getUptimeColor(s.uptimePercent);

                  return (
                    <tr key={`${s.year}-${s.month}`} className="hover:bg-[var(--surface-2)]/50 transition">
                      <td className="py-3 font-medium">
                        <span>{label}</span>
                        {idx === 0 && (
                          <span className="ml-1.5 rounded-sm bg-purple-500/20 px-1 py-0.5 text-[9px] font-semibold text-purple-400">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-['JetBrains_Mono',monospace] font-bold" style={{ color }}>
                        {s.uptimePercent != null ? `${s.uptimePercent}%` : '—'}
                      </td>
                      <td className="py-3 font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">
                        {formatNumber(s.totalChecks)}
                      </td>
                      <td className="py-3 font-['JetBrains_Mono',monospace]">
                        {formatMs(s.avgResponseTime)}
                      </td>
                      <td className="py-3 font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">
                        {s.avgTtfb != null ? `${s.avgTtfb} ms` : '—'}
                      </td>
                      <td className="py-3 font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">
                        {s.avgDns != null ? `${s.avgDns} ms` : '—'}
                      </td>
                      <td className="py-3 font-['JetBrains_Mono',monospace]">
                        <span
                          className={`inline-flex rounded px-1.5 py-0.5 font-semibold ${
                            s.incidentCount > 0
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          {s.incidentCount}
                        </span>
                      </td>
                      <td className="py-3">
                        {s.isFinal ? (
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                            Finalized
                          </span>
                        ) : (
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MonthlyStatsSection);