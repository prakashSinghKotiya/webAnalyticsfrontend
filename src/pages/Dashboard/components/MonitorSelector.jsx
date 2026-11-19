import { memo } from 'react';

/**
 * MonitorSelector
 * Dropdown selector allowing users to switch between their uptime monitors.
 */
function MonitorSelector({
  monitors = [],
  selectedMonitorId,
  onSelectMonitor,
  disabled = false,
}) {
  if (!monitors || monitors.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="monitor-select" className="sr-only">
        Select Monitor
      </label>
      <div className="relative min-w-[190px] sm:min-w-[240px]">
        <select
          id="monitor-select"
          value={selectedMonitorId || ''}
          onChange={(e) => onSelectMonitor(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-2 pl-3.5 pr-9 text-xs sm:text-sm font-medium text-[var(--text)] transition hover:border-[var(--border-bright)] focus:border-[var(--cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--cyan)] disabled:opacity-60 cursor-pointer shadow-xs"
        >
          {monitors.map((m) => {
            const id = m._id || m.id;
            let host;
            try {
              host = new URL(m.url).hostname;
            } catch {
              host = m.url;
            }
            const statusLabel = m.status === 'paused' ? ' [Paused]' : '';
            return (
              <option key={id} value={id} className="bg-[var(--surface-2)] text-[var(--text)]">
                {host} {statusLabel}
              </option>
            );
          })}
        </select>

        {/* Down Chevron Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted-2)]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default memo(MonitorSelector);
