export default function AdminUserFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  planFilter,
  onPlanFilterChange,
  limit,
  onLimitChange,
  totalUsers,
  displayedCount,
}) {
  const roles = [
    { id: 'all', label: 'All Roles' },
    { id: 'SuperAdmin', label: 'SuperAdmin' },
    { id: 'Admin', label: 'Admin' },
    { id: 'User', label: 'User' },
  ];

  const plans = [
    { id: 'all', label: 'All Plans' },
    { id: 'free', label: 'Free' },
    { id: 'pro', label: 'Pro' },
    { id: 'enterprise', label: 'Enterprise' },
  ];

  return (
    <div className="mb-4 space-y-3 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      {/* Top row: Search input + Limit selector */}
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
            placeholder="Search accounts by name, email, role, or ID…"
            className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-2 pl-9 pr-9 text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]"
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

        {/* Per page selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label htmlFor="limit-select" className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
            Per page:
          </label>
          <select
            id="limit-select"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] outline-none transition focus:border-[var(--cyan)] cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Bottom row: Filter chips & showing counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
        {/* Role filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-['JetBrains_Mono',monospace] mr-1 text-[11px] text-[var(--muted)]">Role:</span>
          {roles.map((r) => {
            const active = roleFilter === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onRoleFilterChange(r.id)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition border ${
                  active
                    ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)]'
                    : 'border-[var(--border-mid)] bg-transparent text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)]'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Plan filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-['JetBrains_Mono',monospace] mr-1 text-[11px] text-[var(--muted)]">Plan:</span>
          {plans.map((p) => {
            const active = planFilter === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPlanFilterChange(p.id)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition border ${
                  active
                    ? 'border-[var(--green)] bg-[var(--green-dim)] text-[var(--green)]'
                    : 'border-[var(--border-mid)] bg-transparent text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Count badge */}
        <div className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">
          Showing <span className="font-semibold text-[var(--text)]">{displayedCount}</span> of{' '}
          <span className="font-semibold text-[var(--text)]">{totalUsers}</span> accounts
        </div>
      </div>
    </div>
  );
}

