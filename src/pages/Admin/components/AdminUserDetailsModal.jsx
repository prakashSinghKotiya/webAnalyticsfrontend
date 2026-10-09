import { useEffect, useState } from 'react';
import {
  getUserId,
  formatDateTime,
  getRoleBadgeConfig,
  getPlanBadgeConfig,
  getUserInitials,
  copyToClipboard,
} from '../admin.utils';

export default function AdminUserDetailsModal({
  user,
  currentUser,
  onClose,
  onPromptForceLogout,
  onPromptDeleteUser,
  actionInProgress,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!user) return null;

  const uId = getUserId(user);
  const isSelf = currentUser && getUserId(currentUser) === uId;
  const roleBadge = getRoleBadgeConfig(user.role);
  const planBadge = getPlanBadgeConfig(user.plan);
  const initials = getUserInitials(user.name);
  const isActionBusy = actionInProgress[uId];

  const handleCopy = async (text, key) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-bright)] bg-[var(--surface)] shadow-[var(--shadow-card-hover)] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--surface-2)]/50">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--cyan-dim)] text-[var(--cyan)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
              Account Inspection
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border-none bg-transparent p-1 text-[var(--muted-2)] transition hover:text-[var(--text)]"
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* User profile row */}
          <div className="flex items-center gap-4 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/60 p-4">
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] text-lg font-bold text-white shadow-[0_0_16px_var(--cyan-dim)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)] truncate">
                  {user.name || 'Anonymous User'}
                </h4>
                {isSelf && (
                  <span className="font-['JetBrains_Mono',monospace] rounded-md bg-[var(--cyan-dim)] px-2 py-0.5 text-[9px] font-semibold text-[var(--cyan)] border border-[var(--cyan)]/30">
                    YOUR ACCOUNT
                  </span>
                )}
              </div>
              <p className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)] truncate">
                {user.email || 'No email registered'}
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span
                  className={`font-['JetBrains_Mono',monospace] inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${roleBadge.className}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${roleBadge.indicator}`} />
                  {roleBadge.label}
                </span>
                <span
                  className={`font-['JetBrains_Mono',monospace] inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${planBadge.className}`}
                >
                  {planBadge.label} Plan
                </span>
              </div>
            </div>
          </div>

          {/* Details breakdown grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            {/* Database ID */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
              <div className="flex items-center justify-between text-[var(--muted)] mb-1">
                <span className="font-['JetBrains_Mono',monospace] uppercase text-[10px] tracking-wider">User ID</span>
                {uId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(uId, 'id')}
                    className="cursor-pointer border-none bg-transparent p-0 text-[10px] text-[var(--cyan)] hover:underline"
                  >
                    {copiedKey === 'id' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <p className="font-['JetBrains_Mono',monospace] text-[var(--text)] truncate">
                {uId || '—'}
              </p>
            </div>

            {/* Email Address */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
              <div className="flex items-center justify-between text-[var(--muted)] mb-1">
                <span className="font-['JetBrains_Mono',monospace] uppercase text-[10px] tracking-wider">Email</span>
                {user.email && (
                  <button
                    type="button"
                    onClick={() => handleCopy(user.email, 'email')}
                    className="cursor-pointer border-none bg-transparent p-0 text-[10px] text-[var(--cyan)] hover:underline"
                  >
                    {copiedKey === 'email' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <p className="font-['JetBrains_Mono',monospace] text-[var(--text)] truncate">
                {user.email || '—'}
              </p>
            </div>

            {/* Account Created */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
              <span className="font-['JetBrains_Mono',monospace] block uppercase text-[10px] tracking-wider text-[var(--muted)] mb-1">
                Registration Date
              </span>
              <p className="font-['JetBrains_Mono',monospace] text-[var(--text)] truncate">
                {formatDateTime(user.createdAt)}
              </p>
            </div>

            {/* Session Security */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
              <span className="font-['JetBrains_Mono',monospace] block uppercase text-[10px] tracking-wider text-[var(--muted)] mb-1">
                Security Status
              </span>
              <p className="font-['JetBrains_Mono',monospace] text-[var(--text)] truncate">
                {user.isDeleted ? 'Soft-deleted' : 'Active Account'}
              </p>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="pt-2">
            <p className="font-['JetBrains_Mono',monospace] mb-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Administrative Actions
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPromptForceLogout(user);
                }}
                disabled={isSelf || isActionBusy}
                className="flex-1 cursor-pointer rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-xs font-semibold text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Force Terminate Session
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPromptDeleteUser(user);
                }}
                disabled={isSelf || isActionBusy}
                className="flex-1 cursor-pointer rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete / Suspend User
              </button>
            </div>
            {isSelf && (
              <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
                Actions are disabled because this is your currently logged-in account.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[var(--border)] px-6 py-3.5 bg-[var(--surface-2)]/40">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--border-bright)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

