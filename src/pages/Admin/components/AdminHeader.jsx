import { useSocket } from '../../../context';

export default function AdminHeader({
  currentUser,
  onRefresh,
  onExportCsv,
  refreshing,
  totalUsers,
}) {
  const { isConnected } = useSocket();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Title & Badge */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            Admin Dashboard
          </h1>
          <span className="font-['JetBrains_Mono',monospace] inline-flex items-center gap-1.5 rounded-full border border-[var(--cyan)]/35 bg-[var(--cyan-dim)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--cyan)] shadow-[0_0_12px_var(--cyan-dim)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
            Privileged
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted-2)]">
          Manage platform accounts, monitor user sessions, and inspect system telemetry.
        </p>
      </div>

      {/* Action controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Real-time gateway status */}
        <div className="hidden items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 md:flex">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: isConnected ? 'var(--green)' : 'var(--orange)',
              boxShadow: isConnected ? '0 0 8px var(--green)' : 'none',
            }}
          />
          <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)]">
            {isConnected ? 'Sync Active' : 'Offline'}
          </span>
        </div>

        {/* Export CSV button */}
        <button
          type="button"
          onClick={onExportCsv}
          disabled={totalUsers === 0}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export displayed users to CSV"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--cyan)] hover:bg-[var(--surface-2)] hover:text-[var(--cyan)] disabled:opacity-50"
          title="Refresh user accounts list"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={refreshing ? 'animate-spin text-[var(--cyan)]' : ''}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>{refreshing ? 'Syncing…' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
}

