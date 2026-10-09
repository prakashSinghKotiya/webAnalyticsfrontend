import { useEffect } from 'react';

export default function AdminConfirmModal({
  open,
  type, // 'logout' | 'delete'
  user,
  onClose,
  onConfirmLogout,
  onConfirmDelete,
  isLoading,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, onClose]);

  if (!open || !user) return null;

  const isLogout = type === 'logout';
  const isDelete = type === 'delete';

  const title = isLogout ? 'Force Terminate User Session?' : 'Delete User Account?';

  const description = isLogout
    ? `This will invalidate active tokens and disconnect any active WebSockets for "${user.name || user.email}". The user will be logged out immediately and required to sign in again.`
    : `Are you sure you want to soft-delete the account for "${user.name || user.email}"? Their active session will be revoked and they will no longer be able to access the dashboard.`;

  const confirmButtonText = isLogout ? 'Force Logout Session' : 'Delete Account';
  const confirmButtonClass = isLogout
    ? 'border-orange-500/40 bg-orange-500 text-black hover:bg-orange-400'
    : 'border-red-500/40 bg-red-500 text-white hover:bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.25)]';

  const handleConfirm = () => {
    if (isLogout) onConfirmLogout(user);
    if (isDelete) onConfirmDelete(user);
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-bright)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card-hover)] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 flex-none items-center justify-center rounded-2xl border ${
              isLogout
                ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                : 'border-red-500/30 bg-red-500/10 text-red-400'
            }`}
          >
            {isLogout ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            )}
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
              {title}
            </h3>
            <p className="mt-1 text-xs text-[var(--muted-2)] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* User Card Recap */}
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text)] truncate max-w-[200px]">
              {user.name || 'Anonymous User'}
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)]">
              {user.role || 'User'}
            </span>
          </div>
          <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)] truncate mt-0.5">
            {user.email || 'No email registered'}
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-2)] transition hover:text-[var(--text)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${confirmButtonClass}`}
          >
            {isLoading ? 'Processing…' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

