import { memo, useMemo } from 'react';
import {
  formatCheckedInterval,
  formatMs,
  getCheckCategory,
  relativeTime,
} from '../uptime.utils';

/**
 * Single Check History Row matching the exact design in Image 2:
 * [Time relative]  [● Status · HTTP Code]  [Latency]
 */
function HistoryRowItem({ item }) {
  const check = (item && typeof item === 'object' && item.result ? item.result : item) || {};
  const category = getCheckCategory(check);
  const totalMs = check.TotalresponseTime ?? check.responseTime ?? check.totalResponseTime;
  const httpStatus = check.httpStatus;
  const checkTime = item.checkedAt || check.timestamp || item.timestamp;

  const dotColor =
    category === 'DOWN' ? '#ef4444' : category === 'SLOW' ? '#f59e0b' : '#10b981';

  const categoryColor =
    category === 'DOWN'
      ? 'text-red-600 dark:text-red-400'
      : category === 'SLOW'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  const categoryLabel =
    category === 'DOWN' ? 'Down' : category === 'SLOW' ? 'Slow' : 'Up';

  return (
    <div className="grid grid-cols-[85px_1fr_auto] sm:grid-cols-[140px_1fr_auto] items-center gap-3 sm:gap-4 py-3.5 sm:py-4 border-b border-[var(--border)]/60 last:border-b-0 px-1 sm:px-2 rounded-lg transition hover:bg-[var(--surface-2)]/50">
      {/* 1. Time relative */}
      <span className="text-xs sm:text-sm font-normal text-[var(--muted-2)] truncate">
        {relativeTime(checkTime)}
      </span>

      {/* 2. Status Dot + Label + HTTP status */}
      <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
        <span
          className="h-2 w-2 flex-none rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        <strong className={`font-semibold ${categoryColor}`}>
          {categoryLabel}
        </strong>
        {httpStatus ? (
          <>
            <span className="text-[var(--muted-2)]">·</span>
            <span className="font-normal font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
              HTTP {httpStatus}
            </span>
          </>
        ) : null}
      </div>

      {/* 3. Latency on the right */}
      <span className="text-right text-xs sm:text-sm font-medium font-['JetBrains_Mono',monospace] text-[var(--text)]">
        {category === 'DOWN' || totalMs == null ? '—' : formatMs(totalMs)}
      </span>
    </div>
  );
}

/**
 * UptimeMonitorResultsSection — Check History Section matching Image 2.
 *
 * Implements:
 *  - Header with "Check history" and domain + interval subtitle
 *  - Filter pills: All checks, Up, Slow, Down (with exact active dark green styling)
 *  - High fidelity history row layout
 *  - Theme alignment with CSS tokens
 *  - Zero hardcoded mock checks (real history only)
 */
function UptimeMonitorResultsSection({
  monitor,
  results,
  loading,
  error,
  pagination,
  statusFilter,
  onPageChange,
  onStatusFilterChange,
  onRefresh,
}) {
  const displayResults = useMemo(
    () => (Array.isArray(results) ? results : []),
    [results],
  );

  let targetHost = 'Target Domain';
  if (monitor?.url) {
    try {
      targetHost = new URL(monitor.url).hostname;
    } catch {
      targetHost = monitor.url;
    }
  }

  const intervalText = formatCheckedInterval(monitor?.interval || '15m');

  const filteredList = useMemo(() => {
    if (!statusFilter || statusFilter === 'ALL') return displayResults;
    return displayResults.filter((item) => {
      const c = item.result || item;
      return getCheckCategory(c) === statusFilter;
    });
  }, [displayResults, statusFilter]);

  const { page = 1, totalPages = 1 } = pagination || {};

  return (
    <section className="fade-up rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 sm:p-10 shadow-[var(--shadow-card)] transition">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
            Check history
          </h2>
          <p className="mt-1 text-xs text-[var(--muted-2)] sm:text-sm">
            {targetHost} · {intervalText}
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="self-start sm:self-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--text)] hover:border-[var(--border-bright)] hover:text-[var(--cyan)] transition disabled:opacity-50"
            title="Refresh check results"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? 'animate-spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* ── Filter Pills: All checks, Up, Slow, Down ───────────────────── */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-[var(--border)]/60 pb-5">
        {[
          { key: 'ALL', label: 'All checks' },
          { key: 'UP', label: 'Up' },
          { key: 'SLOW', label: 'Slow' },
          { key: 'DOWN', label: 'Down' },
        ].map((tab) => {
          const isActive = (statusFilter || 'ALL') === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusFilterChange(tab.key)}
              className={`cursor-pointer rounded-full px-4 py-1 text-xs font-semibold transition ${
                isActive
                  ? 'bg-[#064e3b] dark:bg-[#065f46] text-white shadow-xs'
                  : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-2)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="my-4 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 p-4 text-xs sm:text-sm text-[var(--red)]">
          {error}
        </div>
      )}

      {/* ── Results Rows List ───────────────────────────────────────────── */}
      <div className="mt-3 divide-y-0">
        {loading && displayResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--cyan)] border-t-transparent" />
            <p className="mt-2 text-xs text-[var(--muted-2)]">Loading check records…</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-xs sm:text-sm text-[var(--muted-2)]">
            {displayResults.length === 0
              ? 'No check history recorded yet for this monitor. New checks will appear here automatically.'
              : `No checks match the "${statusFilter}" filter.`}
          </div>
        ) : (
          filteredList.map((item, idx) => (
            <HistoryRowItem key={item._id || item.id || idx} item={item} />
          ))
        )}
      </div>

      {/* ── Pagination Footer ───────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-[var(--border)]/60 pt-4 text-xs text-[var(--muted-2)]">
          <span>
            Page <strong className="text-[var(--text)]">{page}</strong> of{' '}
            <strong className="text-[var(--text)]">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-medium text-[var(--text)] transition hover:border-[var(--border-bright)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-medium text-[var(--text)] transition hover:border-[var(--border-bright)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(UptimeMonitorResultsSection);
