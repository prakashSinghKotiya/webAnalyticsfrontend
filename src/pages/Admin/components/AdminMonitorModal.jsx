import { useState, useEffect, memo } from 'react';
import { getUserId } from '../admin.utils';

/**
 * AdminMonitorModal — Minimalist Modal for Provisioning or Editing Monitors.
 */
function AdminMonitorModal({
  open,
  mode = 'create', // 'create' | 'edit'
  monitor = null,
  users = [],
  onClose,
  onSubmit,
  loading = false,
}) {
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState('5m');
  const [status, setStatus] = useState('active');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setUrl('');
      setInterval('5m');
      setStatus('active');
      setUserId('');
      setError(null);
      return;
    }

    if (mode === 'edit' && monitor) {
      setUrl(monitor.url || '');
      setInterval(monitor.interval || '5m');
      setStatus(monitor.status || 'active');
      setUserId(getUserId(monitor.userId));
      setError(null);
    } else {
      setUrl('');
      setInterval('5m');
      setStatus('active');
      setUserId(users.length > 0 ? getUserId(users[0]) : '');
      setError(null);
    }
  }, [open, mode, monitor, users]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = (url || '').trim();
    if (!cleanUrl) {
      setError('Target URL is required.');
      return;
    }

    // Auto-prepend https:// if scheme is missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setError('Invalid URL format. Please provide a valid domain or web address.');
      return;
    }

    if (mode === 'create' && !userId) {
      setError('Please select or specify a tenant user account to own this monitor.');
      return;
    }

    try {
      if (mode === 'create') {
        await onSubmit({
          url: cleanUrl,
          interval,
          userId,
        });
      } else {
        await onSubmit({
          id: monitor._id || monitor.id,
          url: cleanUrl,
          interval,
          status,
        });
      }
      onClose();
    } catch (err) {
      setError(err?.message || err?.error || 'Operation failed. Please verify inputs.');
    }
  };

  const isEdit = mode === 'edit';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
              {isEdit ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">
                {isEdit ? 'Configure Monitor' : 'Provision New Monitor'}
              </h2>
              <p className="text-xs text-[var(--muted-2)]">
                {isEdit
                  ? 'Update target endpoint, polling interval, or pause state'
                  : 'Deploy a background uptime monitor on behalf of a user'}
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
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target URL */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
              Target URL / Host Endpoint *
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com or api.service.net"
              className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]"
              required
            />
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Protocols http:// and https:// are supported.
            </p>
          </div>

          {/* Tenant Owner Selection */}
          {!isEdit ? (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                Assign to Tenant Account *
              </label>
              {users.length > 0 ? (
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-2 text-xs text-[var(--text)] outline-none transition focus:border-[var(--cyan)]"
                >
                  {users.map((u) => {
                    const uid = getUserId(u);
                    return (
                      <option key={uid} value={uid}>
                        {u.name || 'User'} ({u.email}) — [{u.role || 'User'}]
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter User ObjectId"
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  required
                />
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3 text-xs">
              <span className="text-[var(--muted-2)]">Assigned Tenant: </span>
              <span className="font-semibold text-[var(--text)]">
                {monitor?.userId?.name || 'User'} ({monitor?.userId?.email || '—'})
              </span>
            </div>
          )}

          {/* Frequency Interval */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
              Check Frequency Interval
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[
                { val: '1m', label: '1 min', sub: 'High freq' },
                { val: '5m', label: '5 min', sub: 'Standard' },
                { val: '10m', label: '10 min', sub: 'Normal' },
                { val: '30m', label: '30 min', sub: 'Low' },
                { val: '1h', label: '1 hour', sub: 'Infrequent' },
              ].map((item) => {
                const isSelected = interval === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setInterval(item.val)}
                    className={`cursor-pointer rounded-xl border p-2 text-center transition ${
                      isSelected
                        ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-[0_0_10px_var(--cyan-dim)]'
                        : 'border-[var(--border-mid)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)]'
                    }`}
                  >
                    <p className="font-['JetBrains_Mono',monospace] text-xs font-bold">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">
                      {item.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status State (when editing) */}
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                Scheduler State
              </label>
              <div className="flex gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-2 text-xs font-medium text-[var(--text)]">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={status === 'active'}
                    onChange={() => setStatus('active')}
                    className="text-[var(--cyan)]"
                  />
                  <span>Active & Running</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-2 text-xs font-medium text-[var(--text)]">
                  <input
                    type="radio"
                    name="status"
                    value="paused"
                    checked={status === 'paused'}
                    onChange={() => setStatus('paused')}
                    className="text-[var(--cyan)]"
                  />
                  <span>Paused (Suspended)</span>
                </label>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-medium text-[var(--text-2)] hover:text-[var(--text)] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] px-4 py-2 text-xs font-semibold text-[var(--cyan)] shadow-[0_0_12px_var(--cyan-dim)] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : isEdit
                ? 'Save Changes'
                : 'Deploy Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(AdminMonitorModal);

