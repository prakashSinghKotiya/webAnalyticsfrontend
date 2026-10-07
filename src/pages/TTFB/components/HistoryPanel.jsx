import { memo, useCallback } from 'react';
import { TTFB_REGIONS } from '../../../api/ttfb';
import { formatMs, rateLatency, regionLabel, relativeTime } from '../ttfb.utils';

const CARD = 'rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8';

const REGION_FILTER_OPTIONS = [
  { value: '', label: 'All regions' },
  ...TTFB_REGIONS.map((r) => ({ value: r.value, label: r.label })),
];

/** Single saved measurement item row. */
const HistoryRow = memo(function HistoryRow({ entry, isActive, onSelect }) {
  const handleClick = useCallback(() => onSelect(entry), [entry, onSelect]);
  const count = entry.readings?.length ?? 1;
  const isFailed = entry.status === 'failed';
  const rating = entry.avg != null ? rateLatency(entry.avg) : null;

  return (
    <li
      className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
        isActive
          ? 'border-[var(--border-bright)] bg-[var(--cyan-dim)]'
          : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-bright)] hover:bg-[var(--surface)]'
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-current={isActive ? 'true' : undefined}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-left"
      >
        <p className="truncate text-sm font-medium text-[var(--text)]">{entry.url}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--muted-2)]">
          <span className="font-medium text-[var(--cyan)]">{regionLabel(entry.region)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {count} {count === 1 ? 'probe' : 'probes'}
          </span>
          {entry.statusCode ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-['JetBrains_Mono',monospace]">HTTP {entry.statusCode}</span>
            </>
          ) : null}
          {isFailed ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[var(--red)]">Failed</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{relativeTime(entry.createdAt)}</span>
        </div>
      </button>

      <div className="flex flex-none items-center gap-3">
        {entry.avg != null ? (
          <span
            className="font-['JetBrains_Mono',monospace] text-sm font-semibold tabular-nums"
            style={{ color: rating?.token }}
          >
            {formatMs(entry.avg)}
          </span>
        ) : (
          <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">—</span>
        )}
      </div>
    </li>
  );
});

/** Skeleton loader for smooth data fetching. */
function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="h-16 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60"
        />
      ))}
    </div>
  );
}

/**
 * HistoryPanel — displays past TTFB measurements from the MongoDB backend.
 */
function HistoryPanel({
  history,
  isLoading,
  pagination,
  activeId,
  filter,
  onSelect,
  onFilterChange,
  onPageChange,
  onRefresh,
}) {
  const handleSearchChange = useCallback(
    (e) => {
      onFilterChange?.({ url: e.target.value });
    },
    [onFilterChange],
  );

  const handleRegionChange = useCallback(
    (e) => {
      onFilterChange?.({ region: e.target.value });
    },
    [onFilterChange],
  );

  const handlePrevPage = useCallback(() => {
    if (pagination?.page > 1) {
      onPageChange?.(pagination.page - 1);
    }
  }, [onPageChange, pagination]);

  const handleNextPage = useCallback(() => {
    if (pagination?.page < pagination?.totalPages) {
      onPageChange?.(pagination.page + 1);
    }
  }, [onPageChange, pagination]);

  const hasHistory = Array.isArray(history) && history.length > 0;
  const total = pagination?.total ?? history?.length ?? 0;

  return (
    <section className={`${CARD} fade-up-delay-2`}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-['Outfit',sans-serif] text-lg font-semibold text-[var(--text)]">
            Measurement History
          </h2>
          <p className="text-xs text-[var(--muted-2)]">
            {total > 0 ? `${total} saved measurement${total === 1 ? '' : 's'}` : 'Stored results from database'}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh history"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--border-bright)] hover:bg-[var(--surface)] disabled:opacity-50"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isLoading ? 'animate-spin' : ''}
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Refresh
        </button>
      </header>

      {/* Filter and Search Bar */}
      <div className="mb-4 grid gap-2.5 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={filter?.url || ''}
            onChange={handleSearchChange}
            placeholder="Filter by URL…"
            className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-2 pl-9 pr-3 text-xs text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-bright)]"
          />
        </div>

        <select
          value={filter?.region || ''}
          onChange={handleRegionChange}
          className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--border-bright)]"
        >
          {REGION_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results List */}
      {isLoading && !hasHistory ? (
        <HistorySkeleton />
      ) : !hasHistory ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium text-[var(--text)]">No records found</p>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            Run a TTFB scan or adjust your filter to view saved measurements.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
            {history.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                isActive={entry.id === activeId || entry.dbId === activeId}
                onSelect={onSelect}
              />
            ))}
          </ul>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <footer className="mt-2 flex items-center justify-between border-t border-[var(--border-mid)] pt-3 text-xs text-[var(--muted-2)]">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={pagination.page <= 1 || isLoading}
                  className="cursor-pointer rounded-lg border border-[var(--border-mid)] px-2.5 py-1 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  className="cursor-pointer rounded-lg border border-[var(--border-mid)] px-2.5 py-1 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </footer>
          )}
        </div>
      )}
    </section>
  );
}

export default memo(HistoryPanel);
