import { useState, memo, useMemo } from 'react';
import AdminRunnerModal from './AdminRunnerModal';
import AdminRunnerTestModal from './AdminRunnerTestModal';
import AdminRunnerMoveModal from './AdminRunnerMoveModal';

/**
 * AdminRunnersManager — Complete Control Plane for Uptime Batched Execution Runners.
 *
 * Implements:
 *  - System Default Runner Hero Status Card with Unassigned Monitor Pool counter
 *  - Architecture & Fault-Tolerance Infographic
 *  - Unassigned Monitor Pool card with batch migration support
 *  - Runners Table / Cards with live status, monitor counts, and default star
 *  - Set as Default Runner with atomic transition & confirmation
 *  - Enable / Disable (toggle) runner with default-protection safeguard
 *  - Move Batch Monitors modal with optional interval, limit, and userId filters
 *  - Live Probe Testing
 *  - Runner Registration Modal (Local, AWS Lambda, Remote HTTP)
 *  - Runner Deletion with default-protection and automatic NULL reassignment notice
 */
function AdminRunnersManager({
  runners = [],
  defaultRunner = null,
  defaultMonitorCount = 0,
  loading = false,
  refreshing = false,
  error = null,
  onRefresh,
  onActivateRunner,
  onSetDefaultRunner,
  onToggleRunner,
  onMoveMonitors,
  onTestRunner,
  onCreateRunner,
  onDeleteRunner,
  actionInProgress = {},
}) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [testModalState, setTestModalState] = useState({ open: false, runner: null });
  const [setDefaultState, setSetDefaultState] = useState({ open: false, runner: null });
  const [moveModalState, setMoveModalState] = useState({ open: false, runner: null });
  const [confirmDeleteState, setConfirmDeleteState] = useState({ open: false, runner: null });

  // Resolve current system default runner
  const resolvedDefaultRunner = useMemo(
    () => defaultRunner || runners.find((r) => r.isDefault) || runners.find((r) => r.isActive) || runners[0] || null,
    [defaultRunner, runners]
  );

  const getRunnerTypeBadge = (type) => {
    switch (type) {
      case 'lambda':
        return {
          label: 'AWS Lambda',
          className: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 font-semibold',
          dot: 'bg-amber-600 dark:bg-amber-400',
        };
      case 'http':
        return {
          label: 'Remote HTTP',
          className: 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30 font-semibold',
          dot: 'bg-purple-600 dark:bg-purple-400',
        };
      case 'local':
      default:
        return {
          label: 'Local Process',
          className: 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan)]/30 font-semibold',
          dot: 'bg-[var(--cyan)]',
        };
    }
  };

  const handleSetDefaultSubmit = async () => {
    if (!setDefaultState.runner) return;
    const runnerId = setDefaultState.runner.id;
    setSetDefaultState({ open: false, runner: null });
    if (onSetDefaultRunner) {
      await onSetDefaultRunner(runnerId);
    } else if (onActivateRunner) {
      await onActivateRunner(runnerId);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!confirmDeleteState.runner) return;
    const runnerId = confirmDeleteState.runner.id;
    setConfirmDeleteState({ open: false, runner: null });
    await onDeleteRunner(runnerId);
  };

  const handleCreateSubmit = async (payload) => {
    await onCreateRunner(payload);
    setCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Error alert if any */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── System Default Runner Hero Card ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300">
                ⭐ System Default Runner
              </span>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-['JetBrains_Mono',monospace] text-xs font-semibold ${getRunnerTypeBadge(resolvedDefaultRunner?.type || 'local').className}`}>
                {getRunnerTypeBadge(resolvedDefaultRunner?.type || 'local').label}
              </span>
              {resolvedDefaultRunner?.isActive === false ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400">
                  Disabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                  Enabled
                </span>
              )}
            </div>

            <h2 className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
              {resolvedDefaultRunner?.name || 'Local Server (Main)'}
            </h2>

          
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => resolvedDefaultRunner && setTestModalState({ open: true, runner: resolvedDefaultRunner })}
              disabled={!resolvedDefaultRunner}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)] disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Test Default Server</span>
            </button>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--cyan)] px-4 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-sm transition hover:opacity-90 active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Server </span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-2.5 text-[var(--muted-2)] hover:text-[var(--text)] disabled:opacity-50"
              title="Refresh runners list"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={refreshing ? 'animate-spin text-[var(--cyan)]' : ''}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
          </div>
        </div>

        {/* High-level Architecture Stats Pills */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-[var(--border)] pt-5">
          {(() => {
            const defaultDirect = Number(resolvedDefaultRunner?.monitorCount ?? resolvedDefaultRunner?._count?.monitors ?? 0);
            const defaultPool = Number(defaultMonitorCount || 0);
            const defaultTotal = defaultDirect + defaultPool;

            return (
              <>
                <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/60 p-3">
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)] uppercase tracking-wider block font-semibold">
                    Active Execution Load
                  </span>
                  <p className="mt-0.5 font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--cyan)]">
                    {defaultTotal} Monitor{defaultTotal === 1 ? '' : 's'}
                  </p>
                  <span className="text-[10px] text-[var(--muted-2)]">Total executing on this server</span>
                </div>

                <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/60 p-3">
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)] uppercase tracking-wider block font-semibold">
                    Default Monitor Pool
                  </span>
                  <p className="mt-0.5 font-['JetBrains_Mono',monospace] text-sm font-bold text-amber-800 dark:text-amber-300">
                    {defaultPool} Monitor{defaultPool === 1 ? '' : 's'}
                  </p>
                  <span className="text-[10px] text-[var(--muted-2)]">Unassigned (runnerId NULL)</span>
                </div>

                <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/60 p-3">
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)] uppercase tracking-wider block font-semibold">
                    Directly Assigned
                  </span>
                  <p className="mt-0.5 font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--text)]">
                    {defaultDirect} Monitor{defaultDirect === 1 ? '' : 's'}
                  </p>
                  <span className="text-[10px] text-[var(--muted-2)]">Explicitly bound to this ID</span>
                </div>

                <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/60 p-3">
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)] uppercase tracking-wider block font-semibold">
                    Batching Size
                  </span>
                  <p className="mt-0.5 font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--text)]">
                    50 Monitors / Job
                  </p>
                  <span className="text-[10px] text-[var(--muted-2)]">Per-runner chunking</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* ── Unassigned Monitors Quick Move Banner ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text)]">
              Unassigned Monitor Pool ({defaultMonitorCount} monitor{defaultMonitorCount === 1 ? '' : 's'})
            </h4>
            <p className="text-[11px] text-[var(--muted-2)]">
              These monitors currently execute on {resolvedDefaultRunner?.name || 'System Default'}. You can migrate all or part of this pool to dedicated runners.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMoveModalState({
              open: true,
              runner: {
                id: 'default',
                name: 'System Default Pool (Unassigned)',
                isDefault: true,
                defaultMonitorCount,
              },
            })
          }
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-amber-700 shadow-sm dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/40 dark:hover:bg-amber-500/30 whitespace-nowrap"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
          </svg>
          <span>Move Unassigned Monitors…</span>
        </button>
      </div>

      

      {/* ── Registered Runners Table ────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] bg-[var(--surface-2)]/50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
              Registered Execution Fleet ({runners.length})
            </h3>
            <p className="text-xs text-[var(--muted-2)]">
              Manage local processes, serverless AWS Lambda, and remote HTTP VPS nodes
            </p>
          </div>
          <span className="text-xs text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
            Exactly 1 system default runner enforced
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-32 rounded bg-[var(--surface-3)]" />
                <div className="h-4 w-20 rounded bg-[var(--surface-3)]" />
                <div className="h-4 w-48 rounded bg-[var(--surface-3)]" />
                <div className="ml-auto h-4 w-24 rounded bg-[var(--surface-3)]" />
              </div>
            ))}
          </div>
        ) : runners.length === 0 ? (
          <div className="p-10 text-center text-xs text-[var(--muted-2)]">
            No runners registered. Register a runner to configure your probe fleet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 text-[11px] font-semibold text-[var(--muted-2)] uppercase tracking-wider">
                  <th className="px-5 py-3">Runner Name & ID</th>
                  <th className="px-4 py-3">Engine Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Load</th>
                  <th className="px-4 py-3">Target Configuration</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {runners.map((r) => {
                  const isDefault = Boolean(r.isDefault);
                  const isEnabled = Boolean(r.isActive);
                  const isBusy = Boolean(actionInProgress[r.id]);
                  const typeBadge = getRunnerTypeBadge(r.type);
                  const cfg = r.config || {};
                  const directCount = Number(r.monitorCount ?? r._count?.monitors ?? 0);
                  const poolCount = isDefault ? (Number(defaultMonitorCount) || 0) : 0;
                  const totalLoad = directCount + poolCount;

                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors hover:bg-[var(--surface-2)]/40 ${
                        isDefault ? 'bg-amber-500/[0.04]' : ''
                      }`}
                    >
                      {/* Name & ID */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                              isDefault
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                : isEnabled
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-[var(--surface-3)] text-[var(--muted)]'
                            }`}
                          >
                            {r.type === 'lambda' ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                              </svg>
                            ) : r.type === 'http' ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                <line x1="6" y1="6" x2="6.01" y2="6" />
                                <line x1="6" y1="18" x2="6.01" y2="18" />
                              </svg>
                            )}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-xs text-[var(--text)]">
                                {r.name}
                              </p>
                              {isDefault && (
                                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                                  ⭐ Default
                                </span>
                              )}
                            </div>
                            <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted-2)]">
                              ID: #{r.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Engine Type */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${typeBadge.className}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${typeBadge.dot}`} />
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Enabled / Disabled State */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isEnabled ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-[10px] font-semibold text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Assigned Load */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="space-y-0.5 font-['JetBrains_Mono',monospace]">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${totalLoad > 0 ? 'text-[var(--text)]' : 'text-[var(--muted-2)]'}`}>
                              {totalLoad} monitor{totalLoad === 1 ? '' : 's'}
                            </span>
                            {totalLoad > 0 && (
                              <span
                                className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                  isDefault
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                                }`}
                              >
                                {isDefault ? 'Active' : 'Direct'}
                              </span>
                            )}
                          </div>
                          {isDefault ? (
                            totalLoad > 0 ? (
                              <p className="text-[10px] font-medium text-amber-800 dark:text-amber-300">
                                {poolCount > 0 && directCount > 0
                                  ? `${poolCount} default pool + ${directCount} direct`
                                  : poolCount > 0
                                  ? `${poolCount} from default pool`
                                  : `${directCount} directly assigned`}
                              </p>
                            ) : (
                              <p className="text-[10px] text-[var(--muted-2)]">Idle / 0 monitors</p>
                            )
                          ) : (
                            <p className="text-[10px] text-[var(--muted-2)]">
                              {directCount > 0 ? 'Explicitly assigned' : 'Idle / 0 monitors'}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Config summary (masked secrets) */}
                      <td className="px-4 py-4 text-[11px] text-[var(--text-2)] font-['JetBrains_Mono',monospace]">
                        {r.type === 'lambda' ? (
                          <div className="space-y-0.5">
                            <p>Function: <strong className="text-[var(--text)]">{cfg.functionName || '—'}</strong></p>
                            <p className="text-[10px] text-[var(--muted-2)]">Region: {cfg.region || 'ap-south-1'}</p>
                          </div>
                        ) : r.type === 'http' ? (
                          <div className="space-y-0.5 max-w-[240px]">
                            <p className="truncate" title={cfg.url}>URL: <strong className="text-[var(--text)]">{cfg.url || '—'}</strong></p>
                            <p className="text-[10px] text-[var(--muted-2)]">Auth: Token Configured</p>
                          </div>
                        ) : (
                          <div>
                            <p>Concurrency: <strong className="text-[var(--text)]">{cfg.concurrency || 20} concurrent</strong></p>
                            <p className="text-[10px] text-[var(--muted-2)]">Node.js bounded pool</p>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Test Probe button */}
                          <button
                            type="button"
                            onClick={() => setTestModalState({ open: true, runner: r })}
                            disabled={isBusy}
                            className="cursor-pointer rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] disabled:opacity-50"
                          >
                            Test Probe
                          </button>

                          {/* Move Monitors from this runner */}
                          <button
                            type="button"
                            onClick={() => setMoveModalState({ open: true, runner: r })}
                            disabled={isBusy}
                            className="cursor-pointer rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-800 hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20 disabled:opacity-50"
                            title="Move monitors from this runner to another"
                          >
                            Move Load…
                          </button>

                          {/* Set Default button */}
                          {!isDefault ? (
                            <button
                              type="button"
                              onClick={() => setSetDefaultState({ open: true, runner: r })}
                              disabled={isBusy || !isEnabled}
                              className="cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20 disabled:opacity-50"
                              title={!isEnabled ? 'Enable runner first before setting as default' : 'Set as system default runner'}
                            >
                              Set Default
                            </button>
                          ) : (
                            <span className="px-2 py-1 text-[11px] text-amber-800 dark:text-amber-400 font-bold">
                              ★ Default
                            </span>
                          )}

                          {/* Enable / Disable Toggle (cannot disable default) */}
                          <button
                            type="button"
                            onClick={() => onToggleRunner && onToggleRunner(r.id)}
                            disabled={isDefault || isBusy}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                              isDefault
                                ? 'cursor-not-allowed border-transparent text-[var(--muted)]/40'
                                : isEnabled
                                ? 'cursor-pointer border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20'
                                : 'cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
                            }`}
                            title={isDefault ? 'System default runner cannot be disabled' : isEnabled ? 'Disable runner' : 'Enable runner'}
                          >
                            {isEnabled ? 'Disable' : 'Enable'}
                          </button>

                          {/* Delete button (disabled if default) */}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteState({ open: true, runner: r })}
                            disabled={isDefault || isBusy}
                            className={`rounded-lg border p-1 text-[11px] transition ${
                              isDefault
                                ? 'cursor-not-allowed border-transparent text-[var(--muted)]/30'
                                : 'cursor-pointer border-transparent text-[var(--muted-2)] hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                            }`}
                            title={isDefault ? 'Default runner cannot be deleted' : 'Delete runner'}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
        )}
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────── */}
      {/* 1. Register Runner Modal */}
      {createModalOpen && (
        <AdminRunnerModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
          loading={Boolean(actionInProgress.create)}
        />
      )}

      {/* 2. Test Runner Modal */}
      {testModalState.open && testModalState.runner && (
        <AdminRunnerTestModal
          open={testModalState.open}
          runner={testModalState.runner}
          onClose={() => setTestModalState({ open: false, runner: null })}
          onTest={onTestRunner}
          testing={Boolean(actionInProgress[`test_${testModalState.runner.id}`])}
        />
      )}

      {/* 3. Move Fleet Monitors Modal */}
      {moveModalState.open && moveModalState.runner && (
        <AdminRunnerMoveModal
          open={moveModalState.open}
          sourceRunner={moveModalState.runner}
          runners={runners}
          onClose={() => setMoveModalState({ open: false, runner: null })}
          onConfirm={onMoveMonitors}
          loading={Boolean(actionInProgress.move)}
        />
      )}

      {/* 4. Confirm Set Default Modal */}
      {setDefaultState.open && setDefaultState.runner && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                  Set System Default Runner?
                </h3>
                <p className="text-xs text-[var(--muted-2)]">
                  Atomic switch across all unassigned monitors
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-[var(--muted-2)] leading-relaxed">
              Designating <strong className="text-[var(--text)]">{setDefaultState.runner.name}</strong> as the system default will immediately redirect all <strong className="text-amber-800 dark:text-amber-300 font-bold">{defaultMonitorCount} unassigned monitors</strong> to execute on this engine.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSetDefaultState({ open: false, runner: null })}
                className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--surface-3)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetDefaultSubmit}
                className="cursor-pointer rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400"
              >
                Confirm & Set Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Confirm Delete Modal */}
      {confirmDeleteState.open && confirmDeleteState.runner && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                  Delete Execution Runner?
                </h3>
                <p className="text-xs text-[var(--muted-2)]">
                  Safe deletion with automatic load reassignment
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-[var(--muted-2)] leading-relaxed">
              Are you sure you want to remove <strong className="text-[var(--text)]">{confirmDeleteState.runner.name}</strong> (#{confirmDeleteState.runner.id})?
            </p>
            <p className="mt-2 text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              Any monitors ({confirmDeleteState.runner?.monitorCount ?? confirmDeleteState.runner?._count?.monitors ?? 0}) currently assigned to this runner will be automatically reassigned to <strong>System Default</strong>.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteState({ open: false, runner: null })}
                className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--surface-3)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
              >
                Delete Runner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AdminRunnersManager);
