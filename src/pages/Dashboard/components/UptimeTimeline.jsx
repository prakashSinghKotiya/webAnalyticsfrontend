import { memo, useState } from 'react';

/**
 * UptimeTimeline
 *
 * Compact status-page style timeline strip:
 * Each discrete bar represents an operational interval (green = up, amber = slow, red = down).
 * Hovering on any block shows rich timestamp, latency, and status details.
 */
function UptimeTimeline({ blocks = [], rangeKey = '24h', uptimePercent = '100.0' }) {
  const [hoveredBlock, setHoveredBlock] = useState(null);

  const startLabel =
    rangeKey === '24h' ? '24 hours ago' : rangeKey === '7d' ? '7 days ago' : '30 days ago';

  return (
    <div
      className="flex flex-col rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]"
      role="region"
      aria-label="Uptime Status Timeline"
    >
      {/* Top Header */}
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] sm:text-lg">
            Availability Timeline
          </h3>
          <p className="text-xs text-[var(--muted-2)]">
            Continuous health telemetry blocks across the active window.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-[var(--text)]">
            {uptimePercent}% Operational
          </span>
        </div>
      </div>

      {/* Relative Tooltip Floating Area */}
      <div className="relative mb-2 min-h-[22px] text-xs">
        {hoveredBlock ? (
          <div className="flex items-center gap-2 font-medium text-[var(--text)] transition-all animate-fadeIn">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  hoveredBlock.status === 'DOWN'
                    ? '#ef4444'
                    : hoveredBlock.status === 'SLOW'
                    ? '#f59e0b'
                    : '#10b981',
              }}
            />
            <span className="text-[var(--text)] font-semibold">{hoveredBlock.timeLabel}</span>
            <span className="text-[var(--muted-2)]">·</span>
            <span className="text-[var(--muted-2)]">{hoveredBlock.tooltip}</span>
          </div>
        ) : (
          <span className="text-xs text-[var(--muted-2)] italic">
            Hover over any block to inspect period details.
          </span>
        )}
      </div>

      {/* Discrete Horizontal Blocks Strip */}
      <div
        className="flex h-8 sm:h-9 w-full items-stretch gap-1 overflow-hidden rounded-lg bg-[var(--surface-2)] p-1 border border-[var(--border)]"
        onMouseLeave={() => setHoveredBlock(null)}
      >
        {blocks.map((block) => (
          <div
            key={block.id}
            onMouseEnter={() => setHoveredBlock(block)}
            className="flex-1 cursor-pointer rounded-xs transition-all duration-150 hover:scale-y-110 hover:brightness-125 focus:outline-none"
            style={{
              backgroundColor: block.hasData ? block.color : 'var(--border-mid)',
              opacity: block.hasData ? 1 : 0.35,
            }}
            title={block.tooltip}
            tabIndex={0}
            role="button"
            aria-label={block.tooltip}
          />
        ))}
      </div>

      {/* Footer Axis Labels */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-[var(--muted-2)]">
        <span>{startLabel}</span>
        <span className="hidden sm:inline">100% Uptime Guarantee Target</span>
        <span>Today / Live</span>
      </div>
    </div>
  );
}

export default memo(UptimeTimeline);
