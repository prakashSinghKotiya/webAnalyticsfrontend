import { useEffect } from 'react';

export default function AdminConfirmModal({
  open,
  type, // 'logout' | 'delete' | 'promote' | 'demote'
  user,
  onClose,
  onConfirmLogout,
  onConfirmDelete,
  onConfirmPromote,
  onConfirmDemote,
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
  const isPromote = type === 'promote';
  const isDemote = type === 'demote';

  let title = 'Confirm Action';
  let description = '';
  let confirmButtonText = 'Confirm';
  let confirmButtonClass = 'border-[var(--cyan)] bg-[var(--cyan)] text-white dark:text-slate-950 hover:opacity-90 font-bold';

  if (isLogout) {
    title = 'Force Terminate User Session?';
    description = `This will invalidate active tokens and disconnect any active WebSockets for "${user.name || user.email}". The user will be logged out immediately and required to sign in again.`;
    confirmButtonText = 'Force Logout Session';
    confirmButtonClass = 'bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:text-black dark:hover:bg-orange-400 font-bold shadow-sm';
  } else if (isDelete) {
    title = 'Delete User Account?';
    description = `Are you sure you want to soft-delete the account for "${user.name || user.email}"? Their active session will be revoked and they will no longer be able to access the dashboard.`;
    confirmButtonText = 'Delete Account';
    confirmButtonClass = 'bg-red-600 text-white hover:bg-red-700 font-bold shadow-sm';
  } else if (isPromote) {
    title = 'Promote User to Admin?';
    description = `This will promote "${user.name || user.email}" from User to Admin. They will be granted access to the Admin Dashboard to manage monitors, view system metrics, and inspect user accounts.`;
    confirmButtonText = 'Promote to Admin';
    confirmButtonClass = 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400 font-bold shadow-sm';
  } else if (isDemote) {
    title = 'Demote Admin to Regular User?';
    description = `WARNING: This will demote "${user.name || user.email}" from Admin to regular User. All active sessions in the database will be immediately deleted, and real-time WebSocket connections will be forcefully severed to prevent lingering privileges.`;
    confirmButtonText = 'Demote to User & Revoke Sessions';
    confirmButtonClass = 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400 font-bold shadow-sm';
  }

  const handleConfirm = () => {
    if (isLogout && onConfirmLogout) onConfirmLogout(user);
    if (isDelete && onConfirmDelete) onConfirmDelete(user);
    if (isPromote && onConfirmPromote) onConfirmPromote(user);
    if (isDemote && onConfirmDemote) onConfirmDemote(user);
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 flex-none items-center justify-center rounded-2xl border ${
              isPromote
                ? 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                : isDemote
                ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                : isLogout
                ? 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400'
                : 'border-red-300 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
            }`}
          >
            {isPromote ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="14" />
                <line x1="9" y1="11" x2="15" y2="11" />
              </svg>
            ) : isDemote ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : isLogout ? (
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

