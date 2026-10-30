import { useState } from 'react';
import { formatDateTime, getRelativeTime, getActionBadgeConfig, getRoleBadgeConfig } from '../admin.utils';

export default function AdminAuditLogs({
  auditLogs,
  isSuperAdminUser,
  serverAuditLogs = [],
  serverAuditPagination = { page: 1, totalPages: 1, total: 0 },
  serverAuditPage = 1,
  onPageChange,
  serverAuditLoading = false,
  serverAuditError = null,
  onRefreshServerAudit,
}) {
  const [viewMode, setViewMode] = useState(isSuperAdminUser ? 'security' : 'session'); // 'security' | 'session'

  const getStatusBadge = (status) => {
    switch (status) {
      case 'error':
        return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'info':
        return 'border-[var(--border-bright)] bg-[var(--cyan-dim)] text-[var(--cyan)]';
      default:
        return 'border-[var(--green)]/30 bg-[var(--green-dim)] text-[var(--green)]';
    }
  };

  return (
    <div className="space-y-4">
      {/* View Switcher Bar (for SuperAdmin) or Info Banner (for Admin) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-2">
          {isSuperAdminUser ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] p-1">
              <button
                type="button"
                onClick={() => setViewMode('security')}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === 'security'
                    ? 'bg-purple-500/20 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    : 'text-[var(--muted-2)] hover:text-[var(--text)]'
                }`}
              >
                Security Role Audit (Database)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('session')}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === 'session'
                    ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
                    : 'text-[var(--muted-2)] hover:text-[var(--text)]'
                }`}
              >
                Live Session Telemetry ({auditLogs.length})
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-2)]">
              <span className="h-2 w-2 rounded-full bg-[var(--cyan)] animate-pulse" />
              <span>Real-time admin session telemetry. Role change security logs are reserved for SuperAdmins.</span>
            </div>
          )}
        </div>

        {viewMode === 'security' && isSuperAdminUser && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onRefreshServerAudit}
              disabled={serverAuditLoading}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] hover:border-purple-500/40 hover:text-purple-300 disabled:opacity-50"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={serverAuditLoading ? 'animate-spin text-purple-400' : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{serverAuditLoading ? 'Syncing…' : 'Sync Logs'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── SECURITY ROLE AUDIT (SUPERADMIN DATABASE LOGS) ──────────── */}
      {viewMode === 'security' && isSuperAdminUser && (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="border-b border-[var(--border)] px-5 py-4 bg-[var(--surface-2)]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <div>
                <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
                  Immutable Role Audit Telemetry
                </h3>
                <p className="text-[11px] text-[var(--muted-2)]">
                  Persistent PostgreSQL audit trail capturing every role promotion, demotion, and provisioning event.
                </p>
              </div>
            </div>
            <span className="font-['JetBrains_Mono',monospace] text-xs text-purple-300">
              {serverAuditPagination.total || 0} recorded audits
            </span>
          </div>

          {serverAuditError && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 flex items-center justify-between">
              <span>{serverAuditError}</span>
              <button
                type="button"
                onClick={onRefreshServerAudit}
                className="underline hover:text-white cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {serverAuditLoading && serverAuditLogs.length === 0 ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-[var(--surface-2)] animate-pulse" />
              ))}
            </div>
          ) : serverAuditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--muted)]">
              No role change events have been recorded in the database yet.
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/80 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                      <th className="px-5 py-3">Action & Timestamp</th>
                      <th className="px-4 py-3">Role Transition</th>
                      <th className="px-4 py-3">Initiated By (Actor)</th>
                      <th className="px-4 py-3">Target User</th>
                      <th className="px-4 py-3 text-right">Network Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {serverAuditLogs.map((log) => {
                      const actionBadge = getActionBadgeConfig(log.action);
                      const oldBadge = getRoleBadgeConfig(log.oldRole);
                      const newBadge = getRoleBadgeConfig(log.newRole);

                      return (
                        <tr key={log.id} className="transition hover:bg-[var(--surface-2)]/40">
                          {/* Action & Date */}
                          <td className="px-5 py-3.5">
                            <div className="space-y-1">
                              <span
                                className={`font-['JetBrains_Mono',monospace] inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wider ${actionBadge.className}`}
                              >
                                <span>{actionBadge.icon}</span>
                                {actionBadge.label}
                              </span>
                              <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)]" title={log.createdAt}>
                                {formatDateTime(log.createdAt)} ({getRelativeTime(log.createdAt)})
                              </p>
                            </div>
                          </td>

                          {/* Role Transition */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-['JetBrains_Mono',monospace] rounded px-1.5 py-0.5 text-[10px] ${oldBadge.className}`}>
                                {log.oldRole}
                              </span>
                              <span className="text-[var(--muted)]">→</span>
                              <span className={`font-['JetBrains_Mono',monospace] rounded px-1.5 py-0.5 text-[10px] font-bold ${newBadge.className}`}>
                                {log.newRole}
                              </span>
                            </div>
                          </td>

                          {/* Actor */}
                          <td className="px-4 py-3.5">
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text)] truncate">
                                {log.actor?.name || 'System / CLI'}
                              </p>
                              <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)] truncate">
                                {log.actor?.email || `Actor ID: ${log.actorId}`}
                              </p>
                            </div>
                          </td>

                          {/* Target */}
                          <td className="px-4 py-3.5">
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text)] truncate">
                                {log.target?.name || 'User #' + log.targetId}
                              </p>
                              <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)] truncate">
                                {log.target?.email || `Target ID: ${log.targetId}`}
                              </p>
                            </div>
                          </td>

                          {/* Network Context */}
                          <td className="px-4 py-3.5 text-right font-['JetBrains_Mono',monospace]">
                            <span className="text-[11px] text-[var(--muted-2)] block">
                              IP: {log.ipAddress || '127.0.0.1'}
                            </span>
                            {log.userAgent && (
                              <span className="text-[10px] text-[var(--muted)] truncate max-w-[140px] inline-block" title={log.userAgent}>
                                {log.userAgent.split(' ')[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="divide-y divide-[var(--border)] md:hidden">
                {serverAuditLogs.map((log) => {
                  const actionBadge = getActionBadgeConfig(log.action);
                  const oldBadge = getRoleBadgeConfig(log.oldRole);
                  const newBadge = getRoleBadgeConfig(log.newRole);

                  return (
                    <div key={log.id} className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-['JetBrains_Mono',monospace] inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wider ${actionBadge.className}`}
                        >
                          {actionBadge.label}
                        </span>
                        <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)]">
                          {getRelativeTime(log.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--muted)]">Transition:</span>
                        <span className={`font-['JetBrains_Mono',monospace] rounded px-1.5 py-0.2 text-[9px] ${oldBadge.className}`}>
                          {log.oldRole}
                        </span>
                        <span className="text-[var(--muted)]">→</span>
                        <span className={`font-['JetBrains_Mono',monospace] rounded px-1.5 py-0.2 text-[9px] font-bold ${newBadge.className}`}>
                          {log.newRole}
                        </span>
                      </div>

                      <div className="text-xs space-y-0.5 pt-1 border-t border-[var(--border)]/50">
                        <p className="text-[var(--muted-2)]">
                          <strong className="text-[var(--text)]">Target:</strong> {log.target?.name || log.target?.email || log.targetId}
                        </p>
                        <p className="text-[var(--muted-2)]">
                          <strong className="text-[var(--text)]">Actor:</strong> {log.actor?.name || log.actor?.email || log.actorId}
                        </p>
                      </div>

                      <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)] flex justify-between">
                        <span>IP: {log.ipAddress || '—'}</span>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Server Audit Pagination */}
              {serverAuditPagination.totalPages > 1 && (
                <div className="border-t border-[var(--border)] px-5 py-3 flex items-center justify-between bg-[var(--surface-2)]/40 text-xs">
                  <span className="font-['JetBrains_Mono',monospace] text-[var(--muted)]">
                    Page {serverAuditPagination.page} of {serverAuditPagination.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPageChange && onPageChange(serverAuditPage - 1)}
                      disabled={!serverAuditPagination.hasPrevPage || serverAuditLoading}
                      className="cursor-pointer rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text-2)] hover:text-white disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => onPageChange && onPageChange(serverAuditPage + 1)}
                      disabled={!serverAuditPagination.hasNextPage || serverAuditLoading}
                      className="cursor-pointer rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text-2)] hover:text-white disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── LIVE SESSION AUDIT (IN-MEMORY TELEMETRY) ───────────────── */}
      {(viewMode === 'session' || !isSuperAdminUser) && (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="border-b border-[var(--border)] px-5 py-3.5 bg-[var(--surface-2)]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--cyan)]" />
              <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
                Session Activity Trail
              </h3>
            </div>
            <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">
              {auditLogs.length} events logged in session
            </span>
          </div>

          <div className="divide-y divide-[var(--border)] max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 transition hover:bg-[var(--surface-2)]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-['JetBrains_Mono',monospace] rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${getStatusBadge(
                        log.status
                      )}`}
                    >
                      {log.action}
                    </span>
                    <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)]">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-2)]">
                    {log.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

