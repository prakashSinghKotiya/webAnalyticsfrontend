import { useState, memo } from 'react';

/**
 * AdminRunnerMoveModal — Modal to batch-migrate monitors from one runner to another.
 * Supports optional filters: interval, limit, and userId.
 */
function AdminRunnerMoveModal({
  open,
  sourceRunner = null,
  runners = [],
  onClose,
  onConfirm,
  loading = false,
}) {
  const [toRunnerId, setToRunnerId] = useState('');
  const [interval, setInterval] = useState('');
  const [limit, setLimit] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState(null);

  if (!open || !sourceRunner) return null;

  const isSourceDefault = sourceRunner.id === 'default' || sourceRunner.isDefault;
  const directCount = Number(sourceRunner.monitorCount ?? sourceRunner._count?.monitors ?? 0);
  const poolCount = isSourceDefault ? Number(sourceRunner.defaultMonitorCount ?? 0) : 0;
  const sourceMonitorCount = isSourceDefault ? (directCount + poolCount) : directCount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const targetId = toRunnerId === '' ? null : Number(toRunnerId);

    // Validate that source and target are not the same
    if (sourceRunner.id !== 'default' && targetId === sourceRunner.id) {
      setError('Target runner must be different from the source runner.');
      return;
    }
    if (sourceRunner.id === 'default' && targetId === null) {
      setError('Monitors are already on System Default. Please select an explicit destination runner.');
      return;
    }

    const payload = {
      toRunnerId: targetId,
    };

    if (interval) {
      payload.interval = interval;
    }

    if (limit && Number(limit) > 0) {
      payload.limit = Number(limit);
    }

    if (userId && userId.trim()) {
      payload.userId = isNaN(userId.trim()) ? userId.trim() : Number(userId.trim());
    }

    try {
      await onConfirm(sourceRunner.id, payload);
      onClose();
    } catch (err) {
      setError(err?.message || err?.error || 'Failed to move monitors.');
    }
  };

  // Available target runners (must be active and not the source)
  const targetOptions = runners.filter((r) => r.id !== sourceRunner.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">
                Move Fleet Monitors
              </h2>
              <p className="text-xs text-[var(--muted-2)]">
                Batch re-route monitors to offload or rebalance runner capacity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-1 text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Source Runner Info */}
          <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/60 p-3 text-xs">
            <span className="text-[var(--muted-2)]">Source Runner: </span>
            <strong className="text-[var(--text)] font-semibold">
              {sourceRunner.name}
            </strong>
            <span className="ml-2 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)]">
              ({sourceMonitorCount} monitor{sourceMonitorCount === 1 ? '' : 's'} assigned)
            </span>
          </div>

          {/* Destination Runner Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
              Destination Runner Engine *
            </label>
            <select
              value={toRunnerId}
              onChange={(e) => setToRunnerId(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--cyan)]"
            >
              <option value="">
                System Default {runners.find((r) => r.isDefault)?.name ? `(${runners.find((r) => r.isDefault)?.name})` : '(Local)'}
              </option>
              {targetOptions.map((r) => (
                <option key={r.id} value={r.id} disabled={!r.isActive}>
                  {r.name} ({r.type}){r.isDefault ? ' ⭐ Default' : ''}{!r.isActive ? ' — [Disabled]' : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Selecting &quot;System Default&quot; clears the explicit runner assignment so monitors dynamically route to whichever runner is the system default.
            </p>
          </div>

          {/* Optional Filters Section */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-2)]">
                Optional Subset Filters
              </span>
              <span className="text-[10px] text-[var(--muted)]">
                Leave blank to move ALL monitors
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Frequency Filter */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-2)] mb-1">
                  Interval Frequency
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                >
                  <option value="">Any Interval</option>
                  <option value="1m">1 min</option>
                  <option value="5m">5 min</option>
                  <option value="15m">15 min</option>
                  <option value="30m">30 min</option>
                  <option value="1h">1 hour</option>
                </select>
              </div>

              {/* Limit Batch Size */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-2)] mb-1">
                  Max Monitors to Move (Limit)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="e.g. 50 (All if blank)"
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] placeholder-[var(--muted)] outline-none focus:border-[var(--cyan)]"
                />
              </div>
            </div>

            {/* Tenant User ID */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--muted-2)] mb-1">
                Tenant User ID (Optional)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Only move monitors owned by this User ID"
                className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] placeholder-[var(--muted)] outline-none focus:border-[var(--cyan)]"
              />
            </div>
          </div>

          {/* Warning Note */}
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            Routing changes take effect on the very next dispatch cycle with zero missed checks.
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 active:scale-95 disabled:opacity-50 dark:bg-purple-500/20 dark:text-purple-300 dark:border dark:border-purple-500/40 dark:hover:bg-purple-500/30"
            >
              {loading ? 'Re-routing Monitors…' : 'Move Monitors Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(AdminRunnerMoveModal);

