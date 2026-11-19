import { memo, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

/**
 * Custom Tooltip for Stacked Daily Bar Chart
 */
function DailyBarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const { total = 0, UP = 0, SLOW = 0, DOWN = 0, avgMs = 0, uptimePercent = '100' } = data;

  return (
    <div className="z-50 min-w-[200px] rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-3 text-xs shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between border-b border-[var(--border)] pb-1.5 font-semibold text-[var(--text)]">
        <span>{label}</span>
        <span className="text-[var(--cyan)]">{uptimePercent}% Uptime</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[var(--muted-2)]">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            Up checks:
          </span>
          <span className="font-['JetBrains_Mono',monospace] font-medium text-[var(--text)]">
            {UP} {total > 0 ? `(${Math.round((UP / total) * 100)}%)` : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[var(--muted-2)]">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            Slow checks:
          </span>
          <span className="font-['JetBrains_Mono',monospace] font-medium text-[var(--text)]">
            {SLOW} {total > 0 ? `(${Math.round((SLOW / total) * 100)}%)` : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[var(--muted-2)]">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            Down checks:
          </span>
          <span className="font-['JetBrains_Mono',monospace] font-medium text-[var(--text)]">
            {DOWN} {total > 0 ? `(${Math.round((DOWN / total) * 100)}%)` : ''}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-1 text-[var(--muted-2)]">
          <span>Total / Avg Latency:</span>
          <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
            {total} checks · {avgMs} ms
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * StatusByDayChart
 * Stacked bar chart of Up / Slow / Down checks grouped by day.
 */
function StatusByDayChart({ data }) {
  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted-2)]">
        <p>No daily check data available for this range.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]"
      role="region"
      aria-label="Daily Check Status Breakdown"
    >
      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] sm:text-lg">
            Daily Status Breakdown
          </h3>
          <p className="text-xs text-[var(--muted-2)]">
            Total checks categorized into Up, Slow, and Down per day.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--muted-2)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" />
            Up
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#f59e0b]" />
            Slow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#ef4444]" />
            Down
          </span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

            <XAxis
              dataKey="day"
              stroke="var(--muted)"
              tickLine={false}
              tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
            />

            <YAxis
              stroke="var(--muted)"
              tickLine={false}
              tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
              allowDecimals={false}
            />

            <Tooltip content={<DailyBarTooltip />} />

            <Bar dataKey="UP" name="Up" stackId="status" fill="#10b981" />
            <Bar dataKey="SLOW" name="Slow" stackId="status" fill="#f59e0b" />
            <Bar dataKey="DOWN" name="Down" stackId="status" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default memo(StatusByDayChart);
