import { memo } from 'react';

/**
 * AdminMonitorFilters — Filter, Search, and Bulk Action Controls for Monitors.
 */
function AdminMonitorFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  intervalFilter,
  onIntervalFilterChange,
  limit,
  onLimitChange,
  totalMonitors,
  displayedCount,
  selectedIds = [],
  onClearSelection,
  onOpenCreateModal,
  onOpenBulkAction,
  onExportCsv,
}) {
  const hasSelection = selectedIds.length > 0;

  return (
    <div className="mb-4 space-y-3">
      {/* Primary Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search input & Status/Interval dropdowns */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* URL Search bar */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by URL host..."
              className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-1.5 pl-8.5 pr-8 text-xs text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--text)]"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text-2)] outline-none transition focus:border-[var(--cyan)]"
          >
            <option value="all">All States</option>
            <option value="active">Active Only</option>
            <option value="paused">Paused Only</option>
            <option value="UP">Operational (UP)</option>
            <option value="DOWN">Failing (DOWN)</option>
          </select>

          {/* Interval Filter */}
          <select
            value={intervalFilter}
            onChange={(e) => onIntervalFilterChange(e.target.value)}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text-2)] outline-none transition focus:border-[var(--cyan)]"
          >
            <option value="all">All Frequencies</option>
            <option value="1m">1 Min Frequency</option>
            <option value="5m">5 Min Frequency</option>
            <option value="10m">10 Min Frequency</option>
            <option value="30m">30 Min Frequency</option>
            <option value="1h">1 Hour Frequency</option>
          </select>

          {/* Limit selector */}
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text-2)] outline-none transition focus:border-[var(--cyan)]"
            title="Rows per page"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV button */}
          <button
            type="button"
            onClick={onExportCsv}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--text)]"
            title="Export monitors dataset to CSV"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>

          {/* Provision Monitor Button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] px-3.5 py-1.5 text-xs font-semibold text-[var(--cyan)] shadow-[0_0_12px_var(--cyan-dim)] transition hover:brightness-110 active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Provision Monitor
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar when items are selected */}
      {hasSelection && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--cyan)]/30 bg-[var(--surface-2)] p-3 text-xs shadow-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <span className="font-['JetBrains_Mono',monospace] rounded-md bg-[var(--cyan-dim)] px-2 py-0.5 font-bold text-[var(--cyan)]">
              {selectedIds.length}
            </span>
            <span className="font-medium text-[var(--text)]">
              {selectedIds.length === 1 ? 'monitor selected' : 'monitors selected'}
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="cursor-pointer text-[11px] text-[var(--muted-2)] underline hover:text-[var(--text)]"
            >
              Clear selection
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenBulkAction('pause')}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1 font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)] transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Bulk Pause
            </button>

            <button
              type="button"
              onClick={() => onOpenBulkAction('resume')}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1 font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)] transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Bulk Resume
            </button>

            <button
              type="button"
              onClick={() => onOpenBulkAction('interval')}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1 font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)] transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Change Interval
            </button>

            <button
              type="button"
              onClick={() => onOpenBulkAction('delete')}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-medium text-red-400 hover:bg-red-500/20 transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Bulk Delete
            </button>
          </div>
        </div>
      )}

      {/* Counter summary bar */}
      <div className="flex items-center justify-between text-[11px] text-[var(--muted)] px-1">
        <span>
          Showing <span className="font-medium text-[var(--text)]">{displayedCount}</span> of{' '}
          <span className="font-medium text-[var(--text)]">{totalMonitors}</span> monitors
        </span>
      </div>
    </div>
  );
}

export default memo(AdminMonitorFilters);

