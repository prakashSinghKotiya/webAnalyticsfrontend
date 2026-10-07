import { memo } from 'react';
import {
  formatDateTime,
  formatInterval,
  formatMs,
  formatReason,
  getStatusMeta,
  parseDnsInfo,
  relativeTime,
} from '../uptime.utils';

const CARD =
  'rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8';

/** Result Card representing a single check probe */
function ProbeResultItem({ item }) {
  // Database record schema: { _id, monitorId, userId, result: { status, reason, httpStatus, TotalresponseTime, ttfb, DNSTime, dnsAddress, checkingFor, timestamp, error }, checkedAt }
  const check = item.result || item;
  const status = check.status || 'UP';
  const meta = getStatusMeta(status);
  const totalMs = check.TotalresponseTime ?? check.responseTime;
  const dnsInfo = parseDnsInfo(check.dnsAddress);
  const checkTime = item.checkedAt || check.timestamp;

  return (
    <li className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition-all duration-200 hover:border-[var(--border-bright)]/80 hover:shadow-md sm:p-5">
      <div className="min-w-0">
        {/* Top Header: Status Badge, HTTP code, Timestamp, and Reason */}
        <div className="flex min-w-0 flex-col gap-1.5 border-b border-[var(--border)] pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className="h-2.5 w-2.5 flex-none rounded-full"
                style={{
                  backgroundColor: meta.color,
                  boxShadow: `0 0 8px ${meta.color}`,
                }}
              />
              <span
                className="flex-none rounded px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: meta.bgColor,
                  color: meta.color,
                }}
              >
                {meta.label}
              </span>

              {check.httpStatus && (
                <span className="flex-none rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[var(--text)]">
                  HTTP {check.httpStatus}
                </span>
              )}
            </div>

            <div className="flex flex-none items-center gap-2 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)]">
              <span title={checkTime ? new Date(checkTime).toISOString() : ''}>
                {relativeTime(checkTime)}
              </span>
              <span className="hidden text-[var(--muted)] sm:inline">·</span>
              <span className="hidden text-[10px] text-[var(--muted)] sm:inline">
                {formatDateTime(checkTime)}
              </span>
            </div>
          </div>

          {/* Reason diagnostic text — full width, safely truncated, never overflows container */}
          {(check.reason || check.error) && (
            <p
              className="truncate font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]"
              title={formatReason(check.reason || check.error)}
            >
              {formatReason(check.reason || check.error)}
            </p>
          )}
        </div>

        {/* Latency Decomposition Grid */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {/* Total Latency */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 p-2.5">
            <p className="font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider text-[var(--muted-2)]">
              Total Latency
            </p>
            <p
              className="mt-1 font-['JetBrains_Mono',monospace] text-base font-bold tabular-nums"
              style={{ color: meta.color }}
            >
              {formatMs(totalMs)}
            </p>
          </div>

          {/* TTFB */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 p-2.5">
            <p className="font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider text-[var(--muted-2)]">
              TTFB
            </p>
            <p className="mt-1 font-['JetBrains_Mono',monospace] text-base font-bold tabular-nums text-[var(--cyan)]">
              {formatMs(check.ttfb)}
            </p>
          </div>

          {/* DNS Lookup */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 p-2.5">
            <p className="font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider text-[var(--muted-2)]">
              DNS Lookup
            </p>
            <p className="mt-1 font-['JetBrains_Mono',monospace] text-base font-bold tabular-nums text-[var(--orange)]">
              {formatMs(check.DNSTime)}
            </p>
          </div>

          {/* Resolved IP */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 p-2.5">
            <div className="flex items-center justify-between">
              <p className="font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider text-[var(--muted-2)]">
                Resolved IP
              </p>
              {dnsInfo.family && (
                <span className="font-['JetBrains_Mono',monospace] text-[8px] font-bold text-[var(--muted)]">
                  {dnsInfo.family}
                </span>
              )}
            </div>
            <p
              className="mt-1 truncate font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)]"
              title={dnsInfo.ip}
            >
              {dnsInfo.ip}
            </p>
          </div>
        </div>

        {/* Micro Visual Latency Decomposition Bar */}
        {Number.isFinite(Number(totalMs)) && totalMs > 0 && (
          <div className="mt-3">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
              {check.DNSTime != null && (
                <div
                  className="bg-[var(--orange)]"
                  style={{ width: `${Math.min(100, (check.DNSTime / totalMs) * 100)}%` }}
                  title={`DNS: ${Math.round(check.DNSTime)}ms`}
                />
              )}
              {check.ttfb != null && (
                <div
                  className="bg-[var(--cyan)]"
                  style={{ width: `${Math.min(100, (check.ttfb / totalMs) * 100)}%` }}
                  title={`TTFB: ${Math.round(check.ttfb)}ms`}
                />
              )}
              <div className="flex-1 bg-[var(--green)]" title="Content Download" />
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * UptimeMonitorResultsSection — Section 4: Deep dive into the clicked/running monitor.
 *
 * Capabilities:
 *  - Fresh database fetch from `GET /uptime/monitor/:id/results`
 *  - Server-side pagination (latest 5-6 results per page)
 *  - Status filtering (ALL, UP, DEGRADED, DOWN)
 *  - Running monitor telemetry inspection & metadata
 *  - Real-time updates when new checks arrive via WebSockets
 *  - Strict memory-only state with ZERO extra frontend storage/caches
 */
function UptimeMonitorResultsSection({
  monitor,
  results,
  loading,
  error,
  pagination,
  statusFilter,
  onPageChange,
  onStatusFilterChange,
  onRefresh,
  onClose,
}) {
  if (!monitor) return null;

  const { page, totalPages, total, limit } = pagination;
  const isPaused = monitor.status === 'paused';
  const monitorMeta = getStatusMeta(monitor.lastResult?.status || monitor.status);

  return (
    <section
      id="running-monitor-inspection"
      className={`${CARD} fade-up border-[var(--border-bright)]/60 bg-[var(--surface)] transition`}
    >
      {/* Section Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[var(--cyan)]">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
              Running Monitor Inspection
            </span>

            <span
              className="rounded px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: monitorMeta.bgColor,
                color: monitorMeta.color,
              }}
            >
              {isPaused ? 'Paused' : monitorMeta.label}
            </span>

            <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)]">
              {formatInterval(monitor.interval)}
            </span>
          </div>

          <h2 className="mt-2 truncate font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
            {monitor.url}
          </h2>

          <p className="mt-0.5 text-xs text-[var(--muted-2)]">
            Viewing real-time check probe records directly from database. Paginated at {limit} items per page.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)] disabled:opacity-50"
            title="Refresh monitor results"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? 'animate-spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{loading ? 'Fetching…' : 'Refresh'}</span>
          </button>

          {/* Dismiss / Close View */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-[var(--border-mid)] p-1.5 text-[var(--muted-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--text)]"
              title="Close monitor inspection"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Filter Tabs Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full overflow-x-auto rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-0.5 scrollbar-none">
          {[
            { value: 'ALL', label: 'All Probes' },
            { value: 'UP', label: 'Operational (UP)' },
            { value: 'DEGRADED', label: 'Degraded' },
            { value: 'DOWN', label: 'Outages (DOWN)' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusFilterChange(tab.value)}
              className={`flex-none cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.value
                  ? 'bg-[var(--surface)] text-[var(--cyan)] shadow-sm'
                  : 'text-[var(--muted-2)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
          {total > 0 ? (
            <span>
              Showing probe {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
          ) : (
            <span>0 probes</span>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--cyan)] border-t-transparent" />
          <p className="mt-3 text-xs text-[var(--muted-2)]">Fetching latest probe results from server…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 p-6 text-center text-sm text-[var(--red)]">
          <p>{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 cursor-pointer rounded-lg bg-[var(--red)]/20 px-3 py-1 text-xs font-semibold text-[var(--red)] hover:bg-[var(--red)]/30"
          >
            Retry Fetch
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-mid)] p-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--text)]">No probe records found</p>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            {statusFilter !== 'ALL'
              ? `No check results matching "${statusFilter}" status.`
              : 'The background worker scheduler will run checks according to your configured interval.'}
          </p>
        </div>
      ) : (
        <>
          {/* List of 5-6 results */}
          <ul className="flex flex-col gap-3">
            {results.map((item) => (
              <ProbeResultItem key={item._id || item.id || `${item.checkedAt}-${item.result?.timestamp}`} item={item} />
            ))}
          </ul>

          {/* Server-Side Pagination Bar */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
              <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
                Page {page} of {totalPages}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1 || loading}
                  className="cursor-pointer rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--border-bright)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <span key={p} className="flex items-center gap-1.5">
                        {showEllipsis && (
                          <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onPageChange(p)}
                          disabled={loading}
                          className={`h-8 w-8 cursor-pointer rounded-lg text-xs font-bold transition ${
                            p === page
                              ? 'bg-[var(--cyan)] text-[var(--bg-deep)] shadow-md'
                              : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-2)] hover:text-[var(--text)]'
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="cursor-pointer rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--border-bright)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default memo(UptimeMonitorResultsSection);
