import { useState, memo } from 'react';

/**
 * AdminStatsPreviewPanel — Sticky preview panel displaying live auto-computed stats.
 * Read-only, collapsible on mobile screens, with a Refresh button in edit mode.
 */
function AdminStatsPreviewPanel({
  stats = null,
  loading = false,
  onRefresh = null,
  refreshing = false,
  isEditMode = false,
}) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const formatNumber = (val) => {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-US').format(val);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoStr));
    } catch {
      return '—';
    }
  };

  return (
    <aside
      aria-label="Auto-generated stats preview"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm lg:sticky lg:top-20"
    >
      {/* Header with Read-Only Badge */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
              Auto-Generated Stats
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-[var(--muted-2)]">
            Computed from uptime data — read only
          </p>
        </div>

        {/* Mobile toggle button */}
        <button
          type="button"
          onClick={() => setMobileExpanded((prev) => !prev)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--muted-2)] lg:hidden"
        >
          {mobileExpanded ? 'Collapse' : 'Preview'}
        </button>

        {/* Desktop Refresh button (in edit mode) */}
        {isEditMode && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || loading}
            className="hidden lg:inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)] disabled:opacity-50"
            title="Re-run stats computation and update snapshot"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Refresh
              </>
            )}
          </button>
        )}
      </div>

      {/* Panel Content (always visible on desktop, toggled on mobile) */}
      <div className={`mt-4 space-y-4 ${mobileExpanded ? 'block' : 'hidden lg:block'}`}>
        {loading ? (
          <div className="animate-pulse space-y-3 py-4">
            <div className="h-4 w-1/2 rounded bg-[var(--surface-3)]" />
            <div className="h-8 rounded-xl bg-[var(--surface-3)]" />
            <div className="h-24 rounded-xl bg-[var(--surface-3)]" />
          </div>
        ) : !stats ? (
          <div className="py-8 text-center text-xs text-[var(--muted-2)]">
            Select an eligible provider above to load live uptime telemetry.
          </div>
        ) : (
          <>
            {/* Eligibility & Data Status Pill */}
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs">
              <span className="text-[var(--muted-2)]">Minimum Data:</span>
              <span
                className={`font-['JetBrains_Mono',monospace] font-bold text-[11px] ${
                  stats.meetsMinimumData
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {stats.meetsMinimumData ? '✓ Qualified (100+ checks)' : '⚠️ Low data (<100 checks)'}
              </span>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-2.5">
                <span className="text-[10px] font-['JetBrains_Mono',monospace] uppercase text-[var(--muted)]">Uptime</span>
                <p className="font-['JetBrains_Mono',monospace] mt-0.5 text-lg font-bold text-[var(--green)]">
                  {stats.uptime?.percentage != null ? `${stats.uptime.percentage}%` : '—'}
                </p>
                {stats.uptime?.changePoints != null && (
                  <span className="text-[10px] text-[var(--muted-2)]">
                    {stats.uptime.changePoints > 0 ? `+${stats.uptime.changePoints}%` : `${stats.uptime.changePoints}%`} 7d
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-2.5">
                <span className="text-[10px] font-['JetBrains_Mono',monospace] uppercase text-[var(--muted)]">Avg Response</span>
                <p className="font-['JetBrains_Mono',monospace] mt-0.5 text-lg font-bold text-[var(--cyan)]">
                  {stats.responseTime?.avg != null ? `${Math.round(stats.responseTime.avg)}ms` : '—'}
                </p>
                {stats.responseTime?.p95 != null && (
                  <span className="text-[10px] text-[var(--muted-2)]">
                    p95: {Math.round(stats.responseTime.p95)}ms
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-2.5">
                <span className="text-[10px] font-['JetBrains_Mono',monospace] uppercase text-[var(--muted)]">Score</span>
                <p className="font-['JetBrains_Mono',monospace] mt-0.5 text-lg font-bold text-emerald-400">
                  {stats.performanceScore != null ? `${stats.performanceScore}/100` : '—'}
                </p>
                <span className="text-[10px] text-[var(--muted-2)]">Performance index</span>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-2.5">
                <span className="text-[10px] font-['JetBrains_Mono',monospace] uppercase text-[var(--muted)]">Checks</span>
                <p className="font-['JetBrains_Mono',monospace] mt-0.5 text-lg font-bold text-[var(--text)]">
                  {formatNumber(stats.checks?.total)}
                </p>
                <span className="text-[10px] text-[var(--muted-2)]">
                  {stats.checks?.windowDays || 30} days window
                </span>
              </div>
            </div>

            {/* Monitoring Fleet & Reliability details */}
            <div className="space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3 text-xs font-['JetBrains_Mono',monospace]">
              <div className="flex justify-between">
                <span className="text-[var(--muted-2)]">Monitors Fleet:</span>
                <span className="font-semibold text-[var(--text)]">
                  {stats.monitors?.total || 0} ({stats.monitors?.active || 0} active)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-2)]">Downtime Outages:</span>
                <span className={stats.incidents?.count > 0 ? 'text-amber-400 font-bold' : 'text-[var(--text)]'}>
                  {stats.incidents?.count ?? 0} incidents
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-2)]">Longest Streak:</span>
                <span className="text-[var(--green)]">
                  {formatNumber(stats.incidents?.longestUpStreakChecks ?? 0)} checks up
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-2)]">Latency Bounds:</span>
                <span className="text-[var(--muted)]">
                  {stats.responseTime?.min ?? '—'}ms - {stats.responseTime?.max ?? '—'}ms
                </span>
              </div>
            </div>

            {/* Generated At / Snapshot age */}
            <div className="border-t border-[var(--border)] pt-2 text-[10px] text-[var(--muted)] font-['JetBrains_Mono',monospace]">
              Snapshot timestamp: {formatDate(stats.generatedAt)}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default memo(AdminStatsPreviewPanel);
