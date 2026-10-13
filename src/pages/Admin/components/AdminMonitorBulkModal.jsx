import { useState, memo } from 'react';

/**
 * AdminMonitorBulkModal — Confirmation and parameter input for bulk and destructive operations.
 */
function AdminMonitorBulkModal({
  open,
  type, // 'pause' | 'resume' | 'interval' | 'delete' | 'clearResults' | 'deleteSingle'
  selectedIds = [],
  targetMonitor = null,
  onClose,
  onConfirm,
  loading = false,
}) {
  const [selectedInterval, setSelectedInterval] = useState('5m');
  const [olderThanDays, setOlderThanDays] = useState('all'); // 'all' | '7' | '30'

  if (!open) return null;

  const count = targetMonitor ? 1 : selectedIds.length;

  const getTitle = () => {
    switch (type) {
      case 'pause':
        return `Pause ${count} Monitor${count > 1 ? 's' : ''}?`;
      case 'resume':
        return `Resume ${count} Monitor${count > 1 ? 's' : ''}?`;
      case 'interval':
        return `Update Frequency for ${count} Monitor${count > 1 ? 's' : ''}`;
      case 'delete':
      case 'deleteSingle':
        return `Delete ${count} Monitor${count > 1 ? 's' : ''}?`;
      case 'clearResults':
        return `Purge Check History for ${targetMonitor?.url || 'Monitor'}?`;
      default:
        return 'Confirm Administrative Action';
    }
  };

  const isDestructive = type === 'delete' || type === 'deleteSingle' || type === 'clearResults';

  const handleConfirm = () => {
    if (type === 'interval') {
      onConfirm({ interval: selectedInterval });
    } else if (type === 'clearResults') {
      onConfirm({
        olderThanDays: olderThanDays === 'all' ? null : Number(olderThanDays),
      });
    } else {
      onConfirm();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isDestructive
                ? 'bg-red-500/20 text-red-400'
                : 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
            }`}
          >
            {isDestructive ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )}
          </div>

          <div>
            <h2 className="text-base font-bold text-[var(--text)]">
              {getTitle()}
            </h2>
            <p className="text-xs text-[var(--muted-2)]">
              {isDestructive
                ? 'This administrative action is irreversible and affects scheduled telemetry.'
                : 'Selected monitors will be updated across background worker queues.'}
            </p>
          </div>
        </div>

        {/* Dynamic Body content */}
        <div className="mt-4 space-y-3 text-xs">
          {type === 'interval' && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                Choose New Polling Frequency
              </label>
              <select
                value={selectedInterval}
                onChange={(e) => setSelectedInterval(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
              >
                <option value="1m">1 minute (high frequency)</option>
                <option value="5m">5 minutes (standard)</option>
                <option value="10m">10 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
              </select>
            </div>
          )}

          {type === 'clearResults' && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                Purge Time Range
              </label>
              <select
                value={olderThanDays}
                onChange={(e) => setOlderThanDays(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
              >
                <option value="all">Purge All Historical Records</option>
                <option value="7">Purge Records Older Than 7 Days</option>
                <option value="30">Purge Records Older Than 30 Days</option>
              </select>
            </div>
          )}

          {type === 'deleteSingle' && targetMonitor && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3 text-[11px] text-red-300">
              <span className="font-semibold font-['JetBrains_Mono',monospace]">
                {targetMonitor.url}
              </span>
              <p className="mt-1 text-[10px] text-red-400/80">
                The monitor and all associated telemetry results will be permanently removed.
              </p>
            </div>
          )}

          {type === 'delete' && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3 text-[11px] text-red-300">
              Are you sure you want to permanently delete {count} selected monitor{count > 1 ? 's' : ''} and all their historical check records?
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-medium text-[var(--text-2)] hover:text-[var(--text)] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-50 ${
              isDestructive
                ? 'border border-red-500/40 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-[0_0_12px_var(--cyan-dim)] hover:brightness-110'
            }`}
          >
            {loading ? 'Processing...' : 'Confirm Action'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AdminMonitorBulkModal);

