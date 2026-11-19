import { memo, useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MONTH_NAMES, formatNumber, getUptimeColor } from '../dashboard.utils';

function MiniOverviewTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const color = getUptimeColor(d.fleetUptime);

  return (
    <div className="z-50 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-2.5 text-xs shadow-xl backdrop-blur-md">
      <div className="mb-1 font-semibold text-[var(--text)]">{d.label}</div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[var(--muted-2)]">Fleet Uptime:</span>
        <strong className="font-['JetBrains_Mono',monospace]" style={{ color }}>
          {d.fleetUptime != null ? `${d.fleetUptime}%` : '—'}
        </strong>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="text-[var(--muted-2)]">Total Checks:</span>
        <span className="font-['JetBrains_Mono',monospace] text-[var(--text)]">
          {formatNumber(d.totalFleetChecks)}
        </span>
      </div>
    </div>
  );
}

/**
 * MonthlyOverviewSection
 * Renders fleet-wide current month availability, 3-month trend, and lowest monitor callout.
 */
function MonthlyOverviewSection({ overviewData }) {
  const currentMonth = overviewData?.currentMonth || null;

  const chartData = useMemo(() => {
    const months = overviewData?.months;
    if (!months || !months.length) return [];
    return [...months].reverse().map((m) => ({
      ...m,
      fleetUptime: m.fleetUptime ?? m.uptimePercent,
      totalFleetChecks: m.totalFleetChecks ?? m.totalChecks,
      label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
    }));
  }, [overviewData?.months]);

  if (!overviewData || !currentMonth) return null;

  const fleetUptime = currentMonth.fleetUptime ?? currentMonth.uptimePercent;
  const totalFleetChecks = currentMonth.totalFleetChecks ?? currentMonth.totalChecks ?? 0;
  const monitorsEvaluated = currentMonth.monitorsEvaluated ?? (overviewData?.worstMonitor ? 2 : 1);
  const uptimeColor = getUptimeColor(fleetUptime);

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        {/* Left Side: Fleet Uptime % & Metrics */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Fleet Monthly Availability ({MONTH_NAMES[currentMonth.month - 1]} {currentMonth.year})
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <span
                className="font-['Outfit',sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl"
                style={{ color: uptimeColor }}
              >
                {fleetUptime != null ? `${fleetUptime}%` : '—'}
              </span>
              <span className="text-xs text-[var(--muted-2)]">
                Weighted across {monitorsEvaluated} monitor{monitorsEvaluated > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="border-l border-[var(--border)] pl-6">
            <span className="text-xs text-[var(--muted-2)]">Fleet Checks</span>
            <div className="font-['JetBrains_Mono',monospace] text-lg font-bold text-[var(--text)]">
              {formatNumber(totalFleetChecks)}
            </div>
          </div>
        </div>

        {/* Right Side: 3-Month Trend Mini Bar Chart */}
        {chartData.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--muted-2)]">3-Month Trend</span>
            <div className="h-16 w-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="var(--muted)"
                    tickLine={false}
                    tick={{ fill: 'var(--muted-2)', fontSize: 10 }}
                  />
                  <YAxis domain={[95, 100]} hide />
                  <Tooltip content={<MiniOverviewTooltip />} />
                  <Bar dataKey="fleetUptime" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={`fleet-cell-${idx}`} fill={getUptimeColor(entry.fleetUptime)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MonthlyOverviewSection);