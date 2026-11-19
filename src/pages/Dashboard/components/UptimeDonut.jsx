import { memo, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

/**
 * Custom Tooltip for Donut Chart
 */
function DonutTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const { name, count = 0, percent = '0%', color } = data;

  return (
    <div className="z-50 min-w-[140px] rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-2.5 text-xs shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 font-medium">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[var(--text)]">{name} Status</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 text-[var(--muted-2)]">
        <span>Checks:</span>
        <strong className="font-['JetBrains_Mono',monospace] text-[var(--text)]">
          {count} ({percent})
        </strong>
      </div>
    </div>
  );
}

/**
 * UptimeDonut
 * Donut chart displaying share of Up vs Slow vs Down checks, with uptime % in the center.
 */
function UptimeDonut({ data, uptimePercent = '100.0', totalChecks = 0 }) {
  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Check if all data is zero
  const hasData = totalChecks > 0;

  return (
    <div
      className="flex flex-col rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]"
      role="region"
      aria-label="Uptime Share Donut Chart"
    >
      {/* Header */}
      <div className="mb-2">
        <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] sm:text-lg">
          Status Distribution
        </h3>
        <p className="text-xs text-[var(--muted-2)]">
          Overall availability share for the selected timeframe.
        </p>
      </div>

      {/* Donut Container with Center Text */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="h-52 w-full max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<DonutTooltip />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={84}
                paddingAngle={hasData ? 3 : 0}
                stroke="var(--surface)"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={hasData ? entry.color : 'var(--border-mid)'}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center Label inside Donut Hole */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
            {uptimePercent}%
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-2)]">
            Uptime
          </span>
        </div>
      </div>

      {/* Legend Rows */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-center">
        {chartData.map((item) => (
          <div key={item.name} className="flex flex-col items-center">
            <span className="flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)] mt-0.5">
              {item.count}
            </span>
            <span className="text-[10px] text-[var(--muted-2)]">
              {item.percent}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(UptimeDonut);
