import { useState, useMemo, memo } from 'react';

/**
 * Lightweight, accessible SVG performance chart for 30-day uptime and latency history.
 * Matches the updated MonitorMyHost UI with 3-way segmented toggle [ Uptime | Response | Table ].
 */
function PerformanceChart({
  daily = [],
  providerName = 'Provider',
  title = 'Daily uptime consistency',
  subtitle = '',
  summaryLegend = '',
}) {
  const [activeTab, setActiveTab] = useState('uptime'); // 'uptime' | 'response' | 'table'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const activeMetric = activeTab === 'response' ? 'responseTime' : 'uptime';
  const showTable = activeTab === 'table';

  const data = useMemo(() => {
    if (!Array.isArray(daily) || daily.length === 0) return [];
    return daily.map((d) => ({
      date: d.date,
      uptime: typeof d.uptime === 'number' ? d.uptime : null,
      avgResponseTime: typeof d.avgResponseTime === 'number' ? d.avgResponseTime : null,
      checks: d.checks || 0,
    }));
  }, [daily]);

  // Chart dimensions
  const width = 640;
  const height = 210;
  const padding = { top: 20, right: 20, bottom: 35, left: 55 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Min / Max computation
  const { minVal, maxVal, points } = useMemo(() => {
    if (data.length === 0) return { minVal: 0, maxVal: 100, points: [] };

    const values = data
      .map((d) => (activeMetric === 'uptime' ? d.uptime : d.avgResponseTime))
      .filter((v) => v !== null);

    if (values.length === 0) return { minVal: 0, maxVal: 100, points: [] };

    let rawMin = Math.min(...values);
    let rawMax = Math.max(...values);

    let min, max;
    if (activeMetric === 'uptime') {
      min = Math.max(90, Math.floor(rawMin * 10) / 10);
      max = 100;
      if (rawMin < 90) min = Math.floor(rawMin);
      if (min >= max) min = 98;
    } else {
      min = Math.max(0, Math.floor(rawMin * 0.8));
      max = Math.ceil(rawMax * 1.15) || 500;
      if (min === max) {
        min = Math.max(0, min - 50);
        max = max + 50;
      }
    }

    const pts = data.map((d, i) => {
      const val = activeMetric === 'uptime' ? d.uptime : d.avgResponseTime;
      const x = padding.left + (i / Math.max(1, data.length - 1)) * innerWidth;
      const y =
        val === null
          ? innerHeight + padding.top
          : padding.top + innerHeight - ((val - min) / Math.max(0.001, max - min)) * innerHeight;
      return { ...d, x, y, value: val };
    });

    return { minVal: min, maxVal: max, points: pts };
  }, [data, activeMetric, innerWidth, innerHeight, padding.left, padding.top]);

  // Generate SVG path for line and area fill
  const { linePath, areaPath } = useMemo(() => {
    const validPoints = points.filter((p) => p.value !== null);
    if (validPoints.length === 0) return { linePath: '', areaPath: '' };

    const line = validPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');
    const firstX = validPoints[0].x.toFixed(1);
    const lastX = validPoints[validPoints.length - 1].x.toFixed(1);
    const bottomY = (padding.top + innerHeight).toFixed(1);
    const area = `${line} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

    return { linePath: line, areaPath: area };
  }, [points, padding.top, innerHeight]);

  // Y-axis tick values (3 steps: e.g. 99%, 99.5%, 100%)
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = (maxVal - minVal) / 2;
    for (let i = 0; i <= 2; i++) {
      const val = minVal + step * i;
      const y = padding.top + innerHeight - (i / 2) * innerHeight;
      ticks.push({
        value: activeMetric === 'uptime' ? `${val.toFixed(val === 100 ? 0 : 1)}%` : `${Math.round(val)}ms`,
        y,
      });
    }
    return ticks;
  }, [minVal, maxVal, activeMetric, padding.top, innerHeight]);

  // X-axis date labels (start, middle, end)
  const xLabels = useMemo(() => {
    if (data.length === 0) return [];
    const indices = [0, Math.floor((data.length - 1) / 2), data.length - 1];
    return indices
      .filter((idx, i, arr) => arr.indexOf(idx) === i)
      .map((idx) => {
        const d = data[idx];
        const dateObj = new Date(d.date);
        const formatted = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
        const x = padding.left + (idx / Math.max(1, data.length - 1)) * innerWidth;
        return { label: formatted, x };
      });
  }, [data, innerWidth, padding.left]);

  const isUptime = activeMetric === 'uptime';
  const strokeColor = isUptime ? '#10b981' : 'var(--cyan)';
  const gradStart = isUptime ? 'rgba(16, 185, 129, 0.22)' : 'rgba(6, 182, 212, 0.22)';
  const gradEnd = isUptime ? 'rgba(16, 185, 129, 0.0)' : 'rgba(6, 182, 212, 0.0)';

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header with Title & 3-Way Segmented Control */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted-2)]">
            {subtitle || `Measured across 24/7 global synthetic edge checks (${data.length} days)`}
          </p>
        </div>

        {/* Segmented Control [ Uptime | Response | Table ] */}
        <div className="inline-flex rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('uptime')}
            className={`cursor-pointer rounded-lg px-3 py-1.5 transition ${
              activeTab === 'uptime'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-[var(--muted-2)] hover:text-[var(--text)]'
            }`}
          >
            Uptime
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('response')}
            className={`cursor-pointer rounded-lg px-3 py-1.5 transition ${
              activeTab === 'response'
                ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] font-bold shadow-xs'
                : 'text-[var(--muted-2)] hover:text-[var(--text)]'
            }`}
          >
            Response
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`cursor-pointer rounded-lg px-3 py-1.5 transition ${
              activeTab === 'table'
                ? 'bg-[var(--surface-3)] text-[var(--text)] font-bold shadow-xs'
                : 'text-[var(--muted-2)] hover:text-[var(--text)]'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* View: Chart Graphic */}
      {!showTable && (
        <div className="relative w-full overflow-hidden min-h-[200px]">
          {data.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-xs text-[var(--muted-2)]">
              No daily performance telemetry collected yet for this monitoring window.
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none"
              role="img"
              aria-label={`${providerName} ${isUptime ? 'uptime' : 'response time'} performance chart`}
            >
              <defs>
                <linearGradient id={`grad-perf-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradStart} />
                  <stop offset="100%" stopColor={gradEnd} />
                </linearGradient>
              </defs>

              {/* Grid lines & Y-axis ticks */}
              {yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={tick.y}
                    x2={width - padding.right}
                    y2={tick.y}
                    stroke="var(--border)"
                    strokeDasharray="2 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={tick.y + 3}
                    textAnchor="end"
                    className="fill-[var(--muted)] font-['JetBrains_Mono',monospace] text-[10px]"
                  >
                    {tick.value}
                  </text>
                </g>
              ))}

              {/* Area fill */}
              {areaPath && <path d={areaPath} fill={`url(#grad-perf-${activeMetric})`} />}

              {/* Line stroke */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Hover Indicators */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.date === p.date ? 5 : 3.5}
                  fill={hoveredPoint?.date === p.date ? strokeColor : 'var(--surface)'}
                  stroke={strokeColor}
                  strokeWidth={hoveredPoint?.date === p.date ? 2.5 : 2}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.date}: ${p.value != null ? (isUptime ? `${p.value}% uptime` : `${p.value}ms response`) : 'No data'}`}
                  onFocus={() => setHoveredPoint(p)}
                  onBlur={() => setHoveredPoint(null)}
                />
              ))}

              {/* X-axis tick labels */}
              {xLabels.map((xl, i) => (
                <text
                  key={i}
                  x={xl.x}
                  y={height - 8}
                  textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
                  className="fill-[var(--muted)] font-['JetBrains_Mono',monospace] text-[10px]"
                >
                  {xl.label}
                </text>
              ))}
            </svg>
          )}

          {/* Tooltip Popup */}
          {hoveredPoint && (
            <div
              className="pointer-events-none absolute z-20 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/95 p-2.5 text-xs shadow-lg backdrop-blur-md"
              style={{
                left: `${Math.min(80, Math.max(10, (hoveredPoint.x / width) * 100))}%`,
                top: '10px',
                transform: 'translateX(-50%)',
              }}
            >
              <p className="font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">
                {hoveredPoint.date}
              </p>
              <div className="mt-1 space-y-0.5 text-[11px]">
                <p className="flex justify-between gap-3 text-[var(--muted-2)]">
                  <span>Uptime:</span>
                  <strong className="text-emerald-500 font-['JetBrains_Mono',monospace]">
                    {hoveredPoint.uptime != null ? `${hoveredPoint.uptime}%` : 'N/A'}
                  </strong>
                </p>
                <p className="flex justify-between gap-3 text-[var(--muted-2)]">
                  <span>Avg Latency:</span>
                  <strong className="text-[var(--cyan)] font-['JetBrains_Mono',monospace]">
                    {hoveredPoint.avgResponseTime != null ? `${hoveredPoint.avgResponseTime}ms` : 'N/A'}
                  </strong>
                </p>
                <p className="flex justify-between gap-3 text-[var(--muted-2)]">
                  <span>Checks:</span>
                  <span className="font-['JetBrains_Mono',monospace] text-[var(--text)]">
                    {hoveredPoint.checks}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View: Table Data Log */}
      {showTable && (
        <div className="mt-2 overflow-x-auto rounded-xl border border-[var(--border)] max-h-[220px]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-[var(--border)] bg-[var(--surface-3)] font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)]">
              <tr>
                <th scope="col" className="px-3 py-2">Date (UTC)</th>
                <th scope="col" className="px-3 py-2">Uptime</th>
                <th scope="col" className="px-3 py-2">Avg Speed</th>
                <th scope="col" className="px-3 py-2">Checks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-2)] font-['JetBrains_Mono',monospace]">
              {data.map((row) => (
                <tr key={row.date} className="hover:bg-[var(--surface-2)]">
                  <td className="px-3 py-1.5 font-medium">{row.date}</td>
                  <td className="px-3 py-1.5 text-emerald-500">{row.uptime != null ? `${row.uptime}%` : '—'}</td>
                  <td className="px-3 py-1.5 text-[var(--cyan)]">{row.avgResponseTime != null ? `${row.avgResponseTime}ms` : '—'}</td>
                  <td className="px-3 py-1.5">{row.checks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Chart Legend */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5 text-[11px] text-[var(--muted)] font-['JetBrains_Mono',monospace]">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isUptime ? 'bg-emerald-500' : 'bg-[var(--cyan)]'}`} />
          <span>{isUptime ? 'Recorded uptime' : 'Avg response time'}</span>
        </div>
        <span>{summaryLegend}</span>
      </div>
    </div>
  );
}

export default memo(PerformanceChart);
