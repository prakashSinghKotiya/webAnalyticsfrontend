import { useState, useEffect, memo } from 'react';
import { getAdminMonitorDetails } from '../../../api';
import {
  getMonitorStatusBadgeConfig,
  formatLatency,
  formatDateTime,
  getRelativeTime,
} from '../admin.utils';

const PAGE_SIZE = 5;

/**
 * AdminMonitorInspectModal — Deep Diagnostic Inspector with Live Probe, Paginated History Log (Max 5/page).
 */
function AdminMonitorInspectModal({
  monitor,
  onClose,
  onTriggerCheck,
  onClearResults,
  isChecking = false,
}) {
  const [details, setDetails] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [liveResult, setLiveResult] = useState(null);
  const [error, setError] = useState(null);

  const monitorId = monitor?._id || monitor?.id;

  const loadDetails = async (targetPage = page) => {
    if (!monitorId) return;
    try {
      setLoadingDetails(true);
      setError(null);
      const res = await getAdminMonitorDetails(monitorId, { page: targetPage, limit: PAGE_SIZE });
      if (res?.data) {
        setDetails(res.data);
      }
      if (res?.pagination) {
        setPagination(res.pagination);
      } else if (res?.data?.totalChecksCount !== undefined) {
        const total = Number(res.data.totalChecksCount) || 0;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        setPagination({
          page: targetPage,
          limit: PAGE_SIZE,
          total,
          totalPages,
          hasNextPage: targetPage < totalPages,
          hasPrevPage: targetPage > 1,
        });
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch monitor details and probe log');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setDetails(null);
    setPagination(null);
    setLiveResult(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
    loadDetails(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitorId]);

  if (!monitor) return null;

  const handlePageChange = (newPage) => {
    const totalPages = pagination?.totalPages || 1;
    if (newPage < 1 || newPage > totalPages || newPage === page || loadingDetails) return;
    setPage(newPage);
    loadDetails(newPage);
  };

  const handleRunProbe = async () => {
    if (!onTriggerCheck || !monitorId) return;
    try {
      setError(null);
      const res = await onTriggerCheck(monitorId);
      if (res?.result) {
        setLiveResult(res.result);
        setPage(1);
        loadDetails(1);
      }
    } catch (err) {
      setError(err?.message || 'Ad-hoc probe ping failed');
    }
  };

  const currentMonitor = details?.monitor || monitor;
  const statusCfg = getMonitorStatusBadgeConfig(currentMonitor.status);
  const recentResults = details?.recentResults || [];

  const totalCount = pagination?.total ?? details?.totalChecksCount ?? recentResults.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = pagination?.page ?? page;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(totalCount, (currentPage - 1) * PAGE_SIZE + recentResults.length);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="font-['JetBrains_Mono',monospace] truncate text-base font-bold text-[var(--text)]">
                  {currentMonitor.url}
                </h2>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-[var(--muted-2)]">
                Tenant: {currentMonitor.userId?.name || 'User'} ({currentMonitor.userId?.email || '—'}) • Interval: {currentMonitor.interval === '10m' ? '15m' : (currentMonitor.interval || '15m')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-1.5 text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800 font-medium dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Ad-hoc Live Probe Action Panel */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[var(--text)]">Ad-hoc Availability Probe</h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Dispatch an instant real-time HTTP ping through worker runtime right now.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunProbe}
                disabled={isChecking}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] px-3.5 py-1.5 font-semibold text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-black dark:hover:text-black disabled:opacity-50 transition shadow-sm"
              >
                {isChecking ? (
                  <>
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    </svg>
                    Pinging Endpoint...
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Run Probe Now
                  </>
                )}
              </button>
            </div>

            {/* Latest Telemetry Breakdown */}
            {(() => {
              const res = liveResult || currentMonitor.lastResult;
              if (!res) return null;
              const isUp = (res.status || '').toUpperCase() === 'UP';
              const runnerStr = res.runner || liveResult?.runner || currentMonitor.lastResult?.runner;
              const isFallback = Boolean(runnerStr && runnerStr.includes('->local-fallback'));

              return (
                <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-2.5">
                      <span className="text-[10px] text-[var(--muted)]">Health Status</span>
                      <p className={`font-['JetBrains_Mono',monospace] font-bold ${isUp ? 'text-[var(--green)]' : 'text-red-700 dark:text-red-400'}`}>
                        {res.status || 'PENDING'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-2.5">
                      <span className="text-[10px] text-[var(--muted)]">Total Response</span>
                      <p className="font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">
                        {formatLatency(res.responseTime)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-2.5">
                      <span className="text-[10px] text-[var(--muted)]">DNS / TTFB</span>
                      <p className="font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">
                        {formatLatency(res.dnsTime || res.dnstime)} / {formatLatency(res.ttfb)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-2.5">
                      <span className="text-[10px] text-[var(--muted)]">HTTP Status</span>
                      <p className="font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">
                        {res.httpStatus || (isUp ? '200 OK' : res.error || 'Failed')}
                      </p>
                    </div>
                  </div>

                  {runnerStr && (
                    <div className="flex items-center justify-between rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/50 px-3 py-2 text-xs">
                      <span className="text-[var(--muted-2)]">Execution Runner:</span>
                      <span className="inline-flex items-center gap-1.5 font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
                        <span className={`h-1.5 w-1.5 rounded-full ${isFallback ? 'bg-amber-600 dark:bg-amber-400 animate-pulse' : 'bg-[var(--cyan)]'}`} />
                        <span>{runnerStr}</span>
                        {isFallback && (
                          <span className="rounded bg-amber-100 border border-amber-300 dark:border-transparent dark:bg-amber-500/20 px-1 py-0.5 text-[9px] text-amber-900 dark:text-amber-300 font-bold">
                            Remote failed &rarr; Local fallback
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Historical Checks Feed */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--text)]">
                  Recent Probe Logs ({totalCount})
                </h3>
                {loadingDetails && details && (
                  <span className="inline-flex items-center gap-1 font-['JetBrains_Mono',monospace] text-[10px] text-[var(--cyan)]">
                    <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    </svg>
                    Updating...
                  </span>
                )}
              </div>
              {onClearResults && (
                <button
                  type="button"
                  onClick={() => onClearResults(currentMonitor)}
                  className="cursor-pointer text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Purge History
                </button>
              )}
            </div>

            {loadingDetails && !details ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-[var(--muted-2)]">
                <svg className="animate-spin text-[var(--cyan)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                </svg>
                <span>Loading probe history...</span>
              </div>
            ) : recentResults.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-[var(--muted-2)]">
                No probe records available yet.
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-opacity duration-150 ${loadingDetails ? 'opacity-50 pointer-events-none' : ''}`}>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 text-[10px] font-semibold text-[var(--muted-2)] uppercase">
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Checked At</th>
                        <th className="px-3 py-2">Latency</th>
                        <th className="px-3 py-2">Runner</th>
                        <th className="px-3 py-2">Code / Diagnostic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {recentResults.map((rec, i) => {
                        const res = rec.result || {};
                        const isUp = (res.status || '').toUpperCase() === 'UP';
                        const runnerName = res.runner || rec.runner;
                        const isFallbackRec = Boolean(runnerName && runnerName.includes('->local-fallback'));

                        return (
                          <tr key={rec.id || rec._id || `${currentPage}-${i}`} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isUp
                                    ? 'bg-[var(--green-dim)] text-[var(--green)]'
                                    : 'bg-red-100 text-red-800 border border-red-200 dark:border-transparent dark:bg-red-500/20 dark:text-red-400'
                                }`}
                              >
                                {res.status || 'DONE'}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)]">
                              {formatDateTime(rec.checkedAt)} ({getRelativeTime(rec.checkedAt)})
                            </td>
                            <td className="px-3 py-2 font-['JetBrains_Mono',monospace] text-[11px] font-medium text-[var(--text)]">
                              {formatLatency(res.responseTime)}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] ${
                                  isFallbackRec
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 font-medium'
                                    : 'bg-[var(--surface-3)] text-[var(--muted-2)]'
                                }`}
                                title={runnerName || 'local'}
                              >
                                {isFallbackRec ? '⚡ fallback' : (runnerName || 'local')}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[11px] text-[var(--muted-2)] truncate max-w-[150px]">
                              {res.httpStatus || res.error || res.reason || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-2">
                    <div className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)]">
                      Showing <span className="font-semibold text-[var(--text)]">{startItem}</span> - <span className="font-semibold text-[var(--text)]">{endItem}</span> of <span className="font-semibold text-[var(--text)]">{totalCount}</span> checks
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      {/* Previous Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || loadingDetails}
                        aria-label="Previous Page"
                        className="flex h-7 items-center gap-1 rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 text-[11px] font-semibold text-[var(--text)] transition hover:border-[var(--cyan)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span className="hidden xs:inline">Prev</span>
                      </button>

                      {/* Page Buttons */}
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((p, idx) => {
                          if (p === '…') {
                            return (
                              <span
                                key={`ellipsis-${idx}`}
                                className="px-1 text-xs font-semibold text-[var(--muted-2)]"
                              >
                                …
                              </span>
                            );
                          }

                          const isCurrent = p === currentPage;

                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handlePageChange(p)}
                              disabled={loadingDetails}
                              aria-current={isCurrent ? 'page' : undefined}
                              className={`flex h-7 min-w-[28px] cursor-pointer items-center justify-center rounded-lg px-2 text-[11px] font-bold font-['JetBrains_Mono',monospace] transition border ${
                                isCurrent
                                  ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-sm'
                                  : 'border-[var(--border-mid)] bg-[var(--surface)] text-[var(--muted-2)] hover:border-[var(--cyan)] hover:text-[var(--text)]'
                              } disabled:pointer-events-none`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Page */}
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || loadingDetails}
                        aria-label="Next Page"
                        className="flex h-7 items-center gap-1 rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 text-[11px] font-semibold text-[var(--text)] transition hover:border-[var(--cyan)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        <span className="hidden xs:inline">Next</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {totalPages <= 1 && totalCount > 0 && (
                  <div className="mt-1 text-right font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted-2)]">
                    Showing all {totalCount} {totalCount === 1 ? 'record' : 'records'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[var(--border)] p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-3)] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AdminMonitorInspectModal);

