import { memo, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

/**
 * Custom Tooltip for Response Time Chart
 */
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const { fullDate, responseTime, status, httpCode, error } = data;

  const statusColor =
    status === 'DOWN' ? '#ef4444' : status === 'SLOW' ? '#f59e0b' : '#10b981';
  const statusLabel = status === 'DOWN' ? 'Down' : status === 'SLOW' ? 'Slow' : 'Up';

  return (
    <div className="z-50 min-w-[180px] rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-3 text-xs shadow-xl backdrop-blur-md">
      <div className="mb-1.5 font-medium text-[var(--muted-2)]">{fullDate}</div>
      <div className="flex items-center justify-between gap-3 py-0.5">
        <span className="text-[var(--muted-2)]">Response Time:</span>
        <strong className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
          {status === 'DOWN' ? '—' : `${responseTime} ms`}
        </strong>
      </div>
      <div className="flex items-center justify-between gap-3 py-0.5">
        <span className="text-[var(--muted-2)]">Status:</span>
        <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: statusColor }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
          {statusLabel}
          {httpCode && (
            <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted-2)]">
              (HTTP {httpCode})
            </span>
          )}
        </span>
      </div>
      {data.ttfb != null && (
        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-[var(--muted-2)]">TTFB:</span>
          <span className="font-['JetBrains_Mono',monospace] text-[var(--text)]">
            {data.ttfb} ms
          </span>
        </div>
      )}
      {data.dnsTime != null && (
        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-[var(--muted-2)]">DNS:</span>
          <span className="font-['JetBrains_Mono',monospace] text-[var(--text)]">
            {data.dnsTime} ms
          </span>
        </div>
      )}
      {error && (
        <div className="mt-1.5 border-t border-[var(--border)] pt-1 text-[11px] text-[var(--red)]">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Custom Dot Renderer
 * Emphasizes Slow and Down points with amber and red indicators
 */
function RenderCustomDot(props) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;

  if (payload.status === 'DOWN') {
    return (
      <g key={`dot-down-${payload.id}`}>
        <circle cx={cx} cy={cy} r={6} fill="#ef4444" fillOpacity={0.25} />
        <circle cx={cx} cy={cy} r={3.5} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
      </g>
    );
  }

  if (payload.status === 'SLOW') {
    return (
      <circle
        key={`dot-slow-${payload.id}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill="#f59e0b"
        stroke="#ffffff"
        strokeWidth={1}
      />
    );
  }

  // Normal UP point: only render if points are relatively few for cleaner display
  return null;
}

/**
 * ResponseTimeChart
 * Area chart visualizing response time over time with slow/down markers.
 */
function ResponseTimeChart({ data, avgResponseTime = 0, socketConnected = false }) {
  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Compute max response time for dynamic Y-axis domain
  const maxMs = useMemo(() => {
    if (chartData.length === 0) return 500;
    const max = Math.max(...chartData.map((d) => d.responseTime || 0));
    return Math.max(200, Math.ceil((max * 1.2) / 100) * 100);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted-2)]">
        <p>No response time telemetry available for this period.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]"
      role="region"
      aria-label="Response Time Trend Chart"
    >
      {/* Header & Legend */}
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] sm:text-lg">
              Response Time Trend
            </h3>
            {socketConnected && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-2)]">
            Latency across checks in milliseconds. Highlights slow responses and outages.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-2)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            Up (&lt; 1s)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            Slow (&ge; 1s)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
            Down
          </span>
          {avgResponseTime > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 border-t-2 border-dashed border-[var(--cyan)]" />
              Avg ({avgResponseTime} ms)
            </span>
          )}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

            <XAxis
              dataKey="label"
              stroke="var(--muted)"
              tickLine={false}
              tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={30}
            />

            <YAxis
              stroke="var(--muted)"
              tickLine={false}
              tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
              unit="ms"
              domain={[0, maxMs]}
            />

            <Tooltip content={<CustomTooltip />} />

            {avgResponseTime > 0 && (
              <ReferenceLine
                y={avgResponseTime}
                stroke="var(--cyan)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `avg: ${avgResponseTime}ms`,
                  fill: 'var(--cyan)',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="responseTime"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#areaGradient)"
              dot={<RenderCustomDot />}
              activeDot={{
                r: 5,
                fill: '#10b981',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default memo(ResponseTimeChart);
