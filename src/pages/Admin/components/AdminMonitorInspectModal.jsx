import { useState, useEffect, memo } from 'react';
import { getAdminMonitorDetails } from '../../../api';
import {
  getMonitorStatusBadgeConfig,
  getMonitorHealthBadgeConfig,
  formatLatency,
  formatDateTime,
  getRelativeTime,
} from '../admin.utils';

/**
 * AdminMonitorInspectModal — Deep Diagnostic Inspector with Live Probe & History Log.
 */
function AdminMonitorInspectModal({
  monitor,
  onClose,
  onTriggerCheck,
  onClearResults,
  isChecking = false,
}) {
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [liveResult, setLiveResult] = useState(null);
  const [error, setError] = useState(null);

  const monitorId = monitor?._id || monitor?.id;

  const loadDetails = async () => {
    if (!monitorId) return;
    try {
      setLoadingDetails(true);
      setError(null);
      const res = await getAdminMonitorDetails(monitorId);
      if (res?.data) {
        setDetails(res.data);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch monitor details and probe log');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [monitorId]);

  if (!monitor) return null;

  const handleRunProbe = async () => {
    if (!onTriggerCheck || !monitorId) return;
    try {
      setError(null);
      const res = await onTriggerCheck(monitorId);
      if (res?.result) {
        setLiveResult(res.result);
        loadDetails();
      }
    } catch (err) {
      setError(err?.message || 'Ad-hoc probe ping failed');
    }
  };

  const currentMonitor = details?.monitor || monitor;
  const statusCfg = getMonitorStatusBadgeConfig(currentMonitor.status);
  const healthCfg = getMonitorHealthBadgeConfig(liveResult || currentMonitor.lastResult);
  const recentResults = details?.recentResults || [];

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
                Tenant: {currentMonitor.userId?.name || 'User'} ({currentMonitor.userId?.email || '—'}) • Interval: {currentMonitor.interval || '5m'}
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
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400">
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
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] px-3.5 py-1.5 font-semibold text-[var(--cyan)] shadow-[0_0_12px_var(--cyan-dim)] hover:brightness-110 disabled:opacity-50 transition"
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

              return (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 border-t border-[var(--border)] pt-3">
                  <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-2.5">
                    <span className="text-[10px] text-[var(--muted)]">Health Status</span>
                    <p className={`font-['JetBrains_Mono',monospace] font-bold ${isUp ? 'text-[var(--green)]' : 'text-red-400'}`}>
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
              );
            })()}
          </div>

          {/* Historical Checks Feed */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text)]">
                Recent Probe Logs ({recentResults.length})
              </h3>
              {onClearResults && (
                <button
                  type="button"
                  onClick={() => onClearResults(currentMonitor)}
                  className="cursor-pointer text-[11px] text-amber-400 hover:underline"
                >
                  Purge History
                </button>
              )}
            </div>

            {loadingDetails ? (
              <div className="p-4 text-center text-[var(--muted-2)]">
                Loading probe history...
              </div>
            ) : recentResults.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-[var(--muted-2)]">
                No probe records available yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 text-[10px] font-semibold text-[var(--muted-2)] uppercase">
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Checked At</th>
                      <th className="px-3 py-2">Latency</th>
                      <th className="px-3 py-2">Code / Diagnostic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {recentResults.slice(0, 15).map((rec, i) => {
                      const res = rec.result || {};
                      const isUp = (res.status || '').toUpperCase() === 'UP';
                      return (
                        <tr key={rec._id || i} className="hover:bg-[var(--surface-2)]/40">
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isUp
                                  ? 'bg-[var(--green-dim)] text-[var(--green)]'
                                  : 'bg-red-500/20 text-red-400'
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
                          <td className="px-3 py-2 text-[11px] text-[var(--muted-2)] truncate max-w-[150px]">
                            {res.httpStatus || res.error || res.reason || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

