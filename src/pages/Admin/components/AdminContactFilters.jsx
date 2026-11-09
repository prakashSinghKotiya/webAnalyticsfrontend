import { ENQUIRY_TOPICS } from '../../../api';

export default function AdminContactFilters({
  searchQuery,
  onSearchChange,
  topicFilter,
  onTopicFilterChange,
  limit,
  onLimitChange,
  totalMessages,
  displayedCount,
  onRefresh,
  refreshing = false,
  onExportCsv,
}) {
  const topics = [
    { id: 'all', label: 'All Topics' },
    ...ENQUIRY_TOPICS.map((t) => ({ id: t.value, label: t.shortLabel })),
  ];

  const hasActiveFilters = Boolean(searchQuery || (topicFilter && topicFilter !== 'all'));

  const handleReset = () => {
    onSearchChange('');
    onTopicFilterChange('all');
  };

  return (
    <div className="mb-4 space-y-3 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      {/* Top row: Search input + Limit selector + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--muted)]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search inquiries by name or email…"
            className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-2 pl-9 pr-9 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-[var(--muted)] hover:text-[var(--text)] border-none bg-transparent"
              title="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* Per page selector */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
            <label htmlFor="contact-limit-select" className="text-[11px]">Show:</label>
            <select
              id="contact-limit-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] outline-none transition focus:border-[var(--cyan)] cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Quick Refresh */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh contact inquiries"
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)] active:scale-95 disabled:opacity-50"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={refreshing ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Export CSV */}
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              title="Export displayed messages to CSV"
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)] active:scale-95"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Topic Filter Chips & summary count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
        {/* Topic filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-['JetBrains_Mono',monospace] mr-1 text-[11px] text-[var(--muted)]">Topic:</span>
          {topics.map((t) => {
            const active = topicFilter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTopicFilterChange(t.id)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition border ${
                  active
                    ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)] font-semibold'
                    : 'border-[var(--border-mid)] bg-transparent text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Showing counter & Clear button */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer text-xs font-semibold text-[var(--cyan)] hover:underline"
            >
              Reset Filters
            </button>
          )}
          <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">
            Showing <strong className="text-[var(--text)]">{displayedCount}</strong> of{' '}
            <strong className="text-[var(--text)]">{totalMessages}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
