export default function AdminPagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  total,
  limit,
  onLimitChange,
  limitOptions = [10, 25, 50],
  itemName = 'items',
  loading = false,
  className = '',
}) {
  const hasMultiplePages = totalPages > 1;
  const showControls = hasMultiplePages || (total != null && total > 0 && onLimitChange);

  if (!showControls && totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('…');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers();

  const startItem = total != null && total > 0 ? (page - 1) * (limit || 10) + 1 : 0;
  const endItem = total != null ? Math.min(page * (limit || 10), total) : 0;

  return (
    <div
      className={`mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row ${className}`}
      aria-label="Pagination"
    >
      {/* Left: Item range / Page count */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
          {total != null ? (
            <span>
              Showing <span className="font-semibold text-[var(--text)]">{startItem}</span>
              –<span className="font-semibold text-[var(--text)]">{endItem}</span> of{' '}
              <span className="font-semibold text-[var(--text)]">{total}</span> {itemName}
            </span>
          ) : (
            <span>
              Page <span className="font-semibold text-[var(--text)]">{page}</span> of{' '}
              <span className="font-semibold text-[var(--text)]">{totalPages}</span>
            </span>
          )}
        </div>

        {/* Optional Page Size Selector */}
        {onLimitChange && limit != null && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
            <span className="text-[11px]">Show:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              disabled={loading}
              className="rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none transition disabled:opacity-40"
              aria-label="Items per page"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation buttons */}
      {hasMultiplePages && (
        <div className="flex items-center gap-1.5">
          {/* Previous */}
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            aria-label="Previous page"
            className="flex h-8 items-center gap-1 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === '…') {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="px-2 text-xs font-medium text-[var(--muted)] select-none"
                    aria-hidden="true"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = p === page;

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  disabled={loading}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                  className={`flex h-8 min-w-[32px] cursor-pointer items-center justify-center rounded-xl px-2 text-xs font-semibold transition border ${
                    isCurrent
                      ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)]'
                      : 'border-[var(--border-mid)] bg-[var(--surface)] text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)]'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            aria-label="Next page"
            className="flex h-8 items-center gap-1 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

