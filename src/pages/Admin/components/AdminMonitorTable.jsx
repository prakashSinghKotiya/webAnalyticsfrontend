import { memo } from 'react';
import {
  getMonitorStatusBadgeConfig,
  getMonitorHealthBadgeConfig,
  formatIntervalLabel,
  formatLatency,
  getRelativeTime,
  formatDateTime,
  getUserInitials,
} from '../admin.utils';

/**
 * AdminMonitorTable — High-Density Responsive Table + Card View for Monitors.
 */
function AdminMonitorTable({
  monitors = [],
  loading = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onInspect,
  onEdit,
  onTriggerCheck,
  onTogglePause,
  onClearResults,
  onDelete,
  actionInProgress = {},
  onResetFilters,
}) {
  const allSelected =
    monitors.length > 0 && monitors.every((m) => selectedIds.includes(m._id || m.id));

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-4 rounded bg-[var(--surface-3)]" />
              <div className="h-4 w-40 rounded bg-[var(--surface-3)]" />
              <div className="h-4 w-28 rounded bg-[var(--surface-3)]" />
              <div className="h-4 w-16 rounded bg-[var(--surface-3)]" />
              <div className="h-4 w-20 rounded bg-[var(--surface-3)]" />
              <div className="h-4 w-24 rounded bg-[var(--surface-3)]" />
              <div className="ml-auto h-4 w-24 rounded bg-[var(--surface-3)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (monitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-3)] text-[var(--muted)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="mt-4 text-sm font-semibold text-[var(--text)]">No uptime monitors found</h3>
        <p className="mt-1 text-xs text-[var(--muted-2)] max-w-sm">
          No monitors match your current search and filter parameters. Try adjusting filters or create a new monitor.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 text-[11px] font-semibold text-[var(--muted-2)] uppercase tracking-wider">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  className="cursor-pointer rounded border-[var(--border-mid)] text-[var(--cyan)] focus:ring-[var(--cyan)]"
                />
              </th>
              <th className="px-4 py-3">Target Endpoint / Host</th>
              <th className="px-4 py-3">Tenant Owner</th>
              <th className="px-4 py-3">Interval</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Health & Latency</th>
              <th className="px-4 py-3">Last Checked</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {monitors.map((mon) => {
              const id = mon._id || mon.id;
              const isSelected = selectedIds.includes(id);
              const busyAction = actionInProgress[id];
              const statusCfg = getMonitorStatusBadgeConfig(mon.status);
              const healthCfg = getMonitorHealthBadgeConfig(mon.lastResult);
              const rt = mon.lastResult?.responseTime;
              const owner = mon.userId || {};
              const ownerName = owner.name || 'Unknown User';
              const ownerEmail = owner.email || '—';
              const isDown = healthCfg.status === 'DOWN';

              return (
                <tr
                  key={id}
                  className={`transition-colors hover:bg-[var(--surface-2)]/50 ${
                    isSelected ? 'bg-[var(--cyan-dim)]/30' : ''
                  } ${isDown ? 'bg-red-500/[0.03]' : ''}`}
                >
                  {/* Select Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(id)}
                      className="cursor-pointer rounded border-[var(--border-mid)] text-[var(--cyan)] focus:ring-[var(--cyan)]"
                    />
                  </td>

                  {/* Target Endpoint */}
                  <td className="px-4 py-3 max-w-[260px]">
                    <div className="flex items-center gap-2">
                      <a
                        href={mon.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-['JetBrains_Mono',monospace] truncate font-medium text-[var(--text)] hover:text-[var(--cyan)] transition"
                        title={mon.url}
                      >
                        {mon.url}
                      </a>
                      <a
                        href={mon.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--muted)] hover:text-[var(--text)] shrink-0"
                        title="Open target URL in new tab"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  </td>

                  {/* Owner Column */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {owner.picture ? (
                        <img
                          src={owner.picture}
                          alt={ownerName}
                          className="h-6 w-6 rounded-full object-cover border border-[var(--border-mid)] shrink-0"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-3)] text-[10px] font-bold text-[var(--muted-2)] shrink-0">
                          {getUserInitials(ownerName)}
                        </div>
                      )}
                      <div className="truncate max-w-[140px]">
                        <p className="truncate text-xs font-medium text-[var(--text)]">
                          {ownerName}
                        </p>
                        <p className="truncate text-[10px] text-[var(--muted)]" title={ownerEmail}>
                          {ownerEmail}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Interval Chip */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-['JetBrains_Mono',monospace] rounded-md border border-[var(--border-mid)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-2)]">
                      {mon.interval || '5m'}
                    </span>
                  </td>

                  {/* State (Active / Paused) */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusCfg.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Health & Latency */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${healthCfg.badgeClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${healthCfg.dotClass}`} />
                        {healthCfg.label}
                      </span>
                      {rt !== undefined && rt !== null && (
                        <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)]">
                          {formatLatency(rt)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Last Checked */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="text-[11px] text-[var(--muted-2)]"
                      title={formatDateTime(mon.lastCheckedAt)}
                    >
                      {getRelativeTime(mon.lastCheckedAt)}
                    </span>
                  </td>

                  {/* Row Actions */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Ad-hoc Force Ping */}
                      <button
                        type="button"
                        onClick={() => onTriggerCheck(id)}
                        disabled={Boolean(busyAction)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--muted-2)] hover:bg-[var(--surface-3)] hover:text-[var(--cyan)] transition disabled:opacity-50"
                        title="Force instant health check"
                      >
                        {busyAction === 'check' ? (
                          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="2" x2="12" y2="6" />
                            <line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>

                      {/* Pause / Resume Toggle */}
                      <button
                        type="button"
                        onClick={() => onTogglePause(mon)}
                        disabled={Boolean(busyAction)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--muted-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition disabled:opacity-50"
                        title={statusCfg.isPaused ? 'Resume monitor' : 'Pause monitor'}
                      >
                        {statusCfg.isPaused ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        )}
                      </button>

                      {/* Inspect Details & Logs */}
                      <button
                        type="button"
                        onClick={() => onInspect(mon)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--muted-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition"
                        title="Inspect probe telemetry & logs"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Edit Monitor */}
                      <button
                        type="button"
                        onClick={() => onEdit(mon)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--muted-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition"
                        title="Edit configuration"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>

                      {/* Clear Results History */}
                      <button
                        type="button"
                        onClick={() => onClearResults(mon)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--muted-2)] hover:bg-[var(--surface-3)] hover:text-amber-400 transition"
                        title="Purge check results history"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>

                      {/* Delete Monitor */}
                      <button
                        type="button"
                        onClick={() => onDelete(mon)}
                        className="cursor-pointer rounded-lg p-1.5 text-[var(--muted-2)] hover:bg-red-500/20 hover:text-red-400 transition"
                        title="Delete monitor"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Responsive Cards View */}
      <div className="divide-y divide-[var(--border)] lg:hidden">
        {monitors.map((mon) => {
          const id = mon._id || mon.id;
          const isSelected = selectedIds.includes(id);
          const statusCfg = getMonitorStatusBadgeConfig(mon.status);
          const healthCfg = getMonitorHealthBadgeConfig(mon.lastResult);
          const rt = mon.lastResult?.responseTime;
          const owner = mon.userId || {};

          return (
            <div
              key={id}
              className={`p-4 transition ${isSelected ? 'bg-[var(--cyan-dim)]/20' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(id)}
                    className="cursor-pointer rounded border-[var(--border-mid)] text-[var(--cyan)]"
                  />
                  <div>
                    <a
                      href={mon.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)] hover:text-[var(--cyan)]"
                    >
                      {mon.url}
                    </a>
                    <p className="text-[11px] text-[var(--muted)]">
                      {owner.name || 'Unknown User'} ({owner.email || '—'})
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${healthCfg.badgeClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${healthCfg.dotClass}`} />
                  {healthCfg.label}
                </span>
                {rt !== undefined && rt !== null && (
                  <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)]">
                    {formatLatency(rt)}
                  </span>
                )}
                <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)] border border-[var(--border)] rounded px-1.5 py-0.5">
                  {mon.interval || '5m'}
                </span>
                <span className="text-[10px] text-[var(--muted)] ml-auto">
                  {getRelativeTime(mon.lastCheckedAt)}
                </span>
              </div>

              {/* Action buttons bar for mobile */}
              <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-[var(--border)] pt-2.5">
                <button
                  type="button"
                  onClick={() => onTriggerCheck(id)}
                  className="rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-2)] hover:text-[var(--cyan)]"
                >
                  Test Probe
                </button>
                <button
                  type="button"
                  onClick={() => onTogglePause(mon)}
                  className="rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-2)]"
                >
                  {statusCfg.isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={() => onInspect(mon)}
                  className="rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-2)]"
                >
                  Inspect
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(mon)}
                  className="rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-2)]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(mon)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(AdminMonitorTable);

