import { memo, useState } from 'react';
import { getRelativeTime } from '../admin.utils';

/**
 * AdminIncidentsBanner — Real-time Alert Drawer for System Outages & Degraded Monitors.
 */
function AdminIncidentsBanner({ incidents, onInspectMonitor, onFilterDown }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!incidents || incidents.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4 text-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-red-300">
                Active System Incidents:
              </span>
              <span className="font-['JetBrains_Mono',monospace] rounded-md bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-300 border border-red-500/30">
                {incidents.length} {incidents.length === 1 ? 'Host Down' : 'Hosts Down'}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-red-400/80">
              One or more monitored endpoints failed availability probes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onFilterDown && (
            <button
              type="button"
              onClick={onFilterDown}
              className="cursor-pointer rounded-xl border border-red-500/40 bg-red-500/20 px-3 py-1.5 font-medium text-red-200 transition hover:bg-red-500/30"
            >
              Filter Down Monitors
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex cursor-pointer items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] text-[var(--text-2)] transition hover:bg-[var(--surface-2)]"
          >
            <span>{isExpanded ? 'Hide Details' : 'View Outages'}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded list of failing monitors */}
      {isExpanded && (
        <div className="mt-4 border-t border-red-500/20 pt-3 space-y-2">
          {incidents.slice(0, 5).map((inc) => {
            const err = inc.lastResult?.error || inc.lastResult?.reason || 'Probe unreachable';
            return (
              <div
                key={inc._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-black/20 p-2.5 border border-red-500/20 hover:border-red-500/40 transition"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 animate-ping" />
                  <span className="font-['JetBrains_Mono',monospace] truncate font-semibold text-white">
                    {inc.url}
                  </span>
                  <span className="rounded bg-red-950/80 px-1.5 py-0.5 text-[10px] text-red-300 shrink-0">
                    {err}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-red-300/70 shrink-0">
                  <span>{getRelativeTime(inc.lastCheckedAt)}</span>
                  {inc.userId && (
                    <span className="text-[var(--muted-2)]">
                      • {inc.userId.email || inc.userId.name}
                    </span>
                  )}
                  {onInspectMonitor && (
                    <button
                      type="button"
                      onClick={() => onInspectMonitor(inc)}
                      className="cursor-pointer underline hover:text-white ml-1 font-semibold"
                    >
                      Inspect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(AdminIncidentsBanner);

