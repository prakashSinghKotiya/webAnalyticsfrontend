import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';

/**
 * DashboardEmptyState
 * Shown when no monitors exist, or when a monitor has no check history yet.
 */
function DashboardEmptyState({
  hasMonitors = false,
  monitorUrl = '',
  onRefresh,
}) {
  if (!hasMonitors) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--cyan)]">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h2 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
          No Uptime Monitors Found
        </h2>
        <p className="mt-2 max-w-md text-sm text-[var(--muted-2)]">
          Create your first uptime monitor to automatically track availability, response times, and incident downtime in real-time.
        </p>
        <Link
          to={ROUTES.UPTIME}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--cyan)] px-5 py-2.5 text-sm font-semibold text-black shadow-md transition hover:brightness-110"
        >
          <span>Create Monitor</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-amber-500">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--text)]">
        No Checks Recorded Yet
      </h2>
      <p className="mt-2 max-w-md text-sm text-[var(--muted-2)]">
        Telemetry probes for <strong className="text-[var(--text)]">{monitorUrl || 'this host'}</strong> are queued.
        The automated runner checks every few minutes.
      </p>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--border-bright)] transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Check Again
        </button>
      )}
    </div>
  );
}

export default memo(DashboardEmptyState);
