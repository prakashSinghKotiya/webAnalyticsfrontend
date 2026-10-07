import { memo, useCallback } from 'react';
import { formatDuration, getStatusMeta, relativeTime } from '../redirects.utils';

function HistoryRow({ entry, isActive, onSelect }) {
  const handleSelect = useCallback(() => onSelect(entry), [entry, onSelect]);

  const meta = getStatusMeta(entry.finalStatus);
  const redirectCount = entry.redirectCount ?? 0;

  return (
    <li
      className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
        isActive
          ? 'border-[var(--border-bright)] bg-[var(--cyan-dim)] shadow-sm'
          : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-bright)] hover:bg-[var(--surface)]'
      }`}
    >
      <button
        type="button"
        onClick={handleSelect}
        aria-current={isActive ? 'true' : undefined}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)]">
            {entry.inputUrl || entry.url}
          </p>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${meta.color}18`,
              color: meta.color,
            }}
          >
            {entry.finalStatus} {meta.badge}
          </span>
          {entry.status && entry.status !== 'completed' && (
            <span className="rounded-full bg-[var(--orange)]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--orange)]">
              {entry.status}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--muted-2)]">
          <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--cyan)]">
            {redirectCount === 0
              ? 'Direct (0 hops)'
              : `${redirectCount} redirect${redirectCount === 1 ? '' : 's'}`}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(entry.totalTimeMs)}</span>
          <span aria-hidden="true">·</span>
          <span>{relativeTime(entry.checkedAt)}</span>
        </div>
      </button>

      {/* Mini duration badge */}
      <span className="hidden flex-none rounded bg-[var(--surface-3)] px-2.5 py-1 font-['JetBrains_Mono',monospace] text-[11px] font-semibold text-[var(--cyan)] sm:inline-block">
        {formatDuration(entry.totalTimeMs)}
      </span>
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="h-14 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60"
        />
      ))}
    </div>
  );
}

function RedirectHistorySection({
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
    <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            Redirect Trace History
          </h2>
          <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs text-[var(--muted-2)]">
            {total > 0 ? `${total} saved record${total === 1 ? '' : 's'}` : 'Database records'}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh trace history"
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
      <div className="mb-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={filter?.url || ''}
            onChange={handleSearchChange}
            placeholder="Search traces by URL…"
            className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-2 pl-9 pr-3 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-bright)]"
          />
        </div>
      </div>

      {/* Results List */}
      {isLoading && !hasHistory ? (
        <HistorySkeleton />
      ) : !hasHistory ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium text-[var(--text)]">No redirect records found</p>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            Run a URL redirect trace above or adjust your search filter.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
            {history.map((entry) => (
              <HistoryRow
                key={entry.id || entry.dbId}
                entry={entry}
                isActive={entry.id === activeId || entry.dbId === activeId}
                onSelect={onSelect}
              />
            ))}
          </ul>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <footer className="mt-3 flex items-center justify-between border-t border-[var(--border-mid)] pt-3 text-xs text-[var(--muted-2)]">
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

export default memo(RedirectHistorySection);
