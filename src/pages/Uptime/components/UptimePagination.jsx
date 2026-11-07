import { memo } from 'react';
import { getPaginationRange } from '../uptime.utils';

/**
 * UptimePagination — Modern numbered pagination component with ellipses,
 * direct page jumps, active page highlighting, and clean desktop/mobile responsiveness.
 */
function UptimePagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  loading = false,
  label = null,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const safePage = Math.max(1, Math.min(Number(page) || 1, totalPages));
  const pages = getPaginationRange(safePage, totalPages);

  const handlePageClick = (p) => {
    if (loading || p === safePage || typeof p !== 'number') return;
    onPageChange(p);
  };

  return (
    <nav
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[var(--muted-2)] ${className}`}
      aria-label="Pagination"
    >
      {/* Page indicator or custom label */}
      <div className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
        {label || (
          <span>
            Page <strong className="text-[var(--text)]">{safePage}</strong> of{' '}
            <strong className="text-[var(--text)]">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          disabled={safePage <= 1 || loading}
          onClick={() => handlePageClick(safePage - 1)}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 sm:px-3 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous Page"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="hidden xs:inline">Previous</span>
        </button>

        {/* Page Numbers and Ellipses */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-8 min-w-[28px] items-center justify-center px-1 text-xs font-semibold text-[var(--muted-2)] select-none"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isCurrent = p === safePage;

            return (
              <button
                key={p}
                type="button"
                disabled={loading}
                onClick={() => handlePageClick(p)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={`flex h-8 min-w-[32px] cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-bold transition ${
                  isCurrent
                    ? 'bg-[var(--cyan)] text-[var(--bg-deep)] shadow-md'
                    : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={safePage >= totalPages || loading}
          onClick={() => handlePageClick(safePage + 1)}
          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 sm:px-3 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next Page"
        >
          <span className="hidden xs:inline">Next</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </nav>
  );
}

export default memo(UptimePagination);
