export default function AdminPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

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

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">
        Page <span className="font-semibold text-[var(--text)]">{page}</span> of{' '}
        <span className="font-semibold text-[var(--text)]">{totalPages}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
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
                  className="px-2 text-xs font-medium text-[var(--muted)]"
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
          disabled={page >= totalPages}
          className="flex h-8 items-center gap-1 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

