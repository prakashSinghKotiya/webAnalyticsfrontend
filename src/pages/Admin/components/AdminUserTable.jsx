import { useState } from 'react';
import {
  getUserId,
  formatDate,
  getRoleBadgeConfig,
  getPlanBadgeConfig,
  getUserInitials,
  copyToClipboard,
} from '../admin.utils';

export default function AdminUserTable({
  users,
  currentUser,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onInspect,
  onPromptForceLogout,
  onPromptDeleteUser,
  actionInProgress,
  onResetFilters,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyEmail = async (email, id) => {
    const ok = await copyToClipboard(email);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const currentUserId = getUserId(currentUser);

  // Render Skeleton Loader
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--surface-3)]" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded bg-[var(--surface-3)]" />
                  <div className="h-3 w-48 rounded bg-[var(--surface-3)]" />
                </div>
              </div>
              <div className="hidden h-6 w-20 rounded bg-[var(--surface-3)] sm:block" />
              <div className="hidden h-6 w-16 rounded bg-[var(--surface-3)] md:block" />
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-lg bg-[var(--surface-3)]" />
                <div className="h-8 w-20 rounded-lg bg-[var(--surface-3)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Empty State
  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-mid)] bg-[var(--surface)] px-6 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-bright)] bg-[var(--cyan-dim)] text-[var(--cyan)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h3 className="font-['Outfit',sans-serif] mt-4 text-base font-bold text-[var(--text)]">
          No user accounts found
        </h3>
        <p className="mt-1 max-w-sm text-xs text-[var(--muted-2)]">
          No accounts matched your search or filter parameters. Try clearing the query or adjusting filters.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 cursor-pointer rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] px-4 py-2 text-xs font-semibold text-[var(--cyan)] transition hover:bg-[var(--cyan)] hover:text-black"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  const renderSortIndicator = (field) => {
    if (sortBy !== field) {
      return (
        <span className="text-[var(--muted)] opacity-50 group-hover:opacity-100">↕</span>
      );
    }
    return (
      <span className="text-[var(--cyan)] font-bold">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      {/* ── DESKTOP TABLE ─────────────────────────────────────────── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/80 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
              <th className="px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => onSort('name')}
                  className="group flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-inherit hover:text-[var(--text)]"
                >
                  <span>User Account</span>
                  {renderSortIndicator('name')}
                </button>
              </th>
              <th className="px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => onSort('email')}
                  className="group flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-inherit hover:text-[var(--text)]"
                >
                  <span>Email</span>
                  {renderSortIndicator('email')}
                </button>
              </th>
              <th className="px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => onSort('role')}
                  className="group flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-inherit hover:text-[var(--text)]"
                >
                  <span>Role</span>
                  {renderSortIndicator('role')}
                </button>
              </th>
              <th className="px-4 py-3.5">Plan</th>
              <th className="px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => onSort('createdAt')}
                  className="group flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-inherit hover:text-[var(--text)]"
                >
                  <span>Joined Date</span>
                  {renderSortIndicator('createdAt')}
                </button>
              </th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-sm">
            {users.map((user) => {
              const uId = getUserId(user);
              const isSelf = currentUserId === uId;
              const roleBadge = getRoleBadgeConfig(user.role);
              const planBadge = getPlanBadgeConfig(user.plan);
              const initials = getUserInitials(user.name);
              const isActionBusy = actionInProgress[uId];

              return (
                <tr
                  key={uId || user.email}
                  className="transition hover:bg-[var(--surface-2)]/60"
                >
                  {/* User Account */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] text-xs font-bold text-white shadow-[0_0_10px_var(--cyan-dim)]">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[var(--text)] truncate">
                            {user.name || 'Anonymous User'}
                          </span>
                          {isSelf && (
                            <span className="font-['JetBrains_Mono',monospace] rounded-md bg-[var(--cyan-dim)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--cyan)] border border-[var(--cyan)]/30">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)] truncate max-w-[150px]">
                          {uId ? `ID: ${uId.slice(-6)}` : 'No ID'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)] truncate max-w-[200px]">
                        {user.email || '—'}
                      </span>
                      {user.email && (
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(user.email, uId)}
                          className="cursor-pointer border-none bg-transparent p-1 text-[var(--muted)] hover:text-[var(--cyan)] transition"
                          title="Copy email to clipboard"
                        >
                          {copiedId === uId ? (
                            <span className="text-[10px] font-semibold text-[var(--green)]">Copied!</span>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`font-['JetBrains_Mono',monospace] inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${roleBadge.className}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${roleBadge.indicator}`} />
                      {roleBadge.label}
                    </span>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`font-['JetBrains_Mono',monospace] inline-block rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${planBadge.className}`}
                    >
                      {planBadge.label}
                    </span>
                  </td>

                  {/* Joined Date */}
                  <td className="px-4 py-3.5">
                    <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Inspect user */}
                      <button
                        type="button"
                        onClick={() => onInspect(user)}
                        className="cursor-pointer rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] p-1.5 text-xs text-[var(--muted-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
                        title="View user details"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Force logout */}
                      <button
                        type="button"
                        onClick={() => onPromptForceLogout(user)}
                        disabled={isSelf || isActionBusy === 'logout'}
                        className="cursor-pointer rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={isSelf ? 'Cannot force logout your own account' : 'Force logout user session'}
                      >
                        {isActionBusy === 'logout' ? 'Logging out…' : 'Logout'}
                      </button>

                      {/* Delete user */}
                      <button
                        type="button"
                        onClick={() => onPromptDeleteUser(user)}
                        disabled={isSelf || isActionBusy === 'delete'}
                        className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={isSelf ? 'Cannot delete your own account' : 'Delete user account'}
                      >
                        {isActionBusy === 'delete' ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE / TABLET CARDS ─────────────────────────────────── */}
      <div className="divide-y divide-[var(--border)] lg:hidden">
        {users.map((user) => {
          const uId = getUserId(user);
          const isSelf = currentUserId === uId;
          const roleBadge = getRoleBadgeConfig(user.role);
          const planBadge = getPlanBadgeConfig(user.plan);
          const initials = getUserInitials(user.name);
          const isActionBusy = actionInProgress[uId];

          return (
            <div key={uId || user.email} className="p-4 space-y-3">
              {/* Card Header: Avatar, Name, Email */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] text-xs font-bold text-white shadow-[0_0_10px_var(--cyan-dim)]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-[var(--text)] truncate">
                        {user.name || 'Anonymous User'}
                      </span>
                      {isSelf && (
                        <span className="font-['JetBrains_Mono',monospace] rounded-md bg-[var(--cyan-dim)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--cyan)] border border-[var(--cyan)]/30">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
                      <span className="truncate max-w-[190px]">{user.email || '—'}</span>
                      {user.email && (
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(user.email, uId)}
                          className="border-none bg-transparent p-0.5 text-[var(--muted)] hover:text-[var(--cyan)]"
                          title="Copy email"
                        >
                          {copiedId === uId ? (
                            <span className="text-[10px] text-[var(--green)]">Copied</span>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inspect button */}
                <button
                  type="button"
                  onClick={() => onInspect(user)}
                  className="cursor-pointer rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] p-1.5 text-[var(--muted-2)] hover:text-[var(--cyan)]"
                  title="Inspect"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>

              {/* Card Meta: Badges & Date */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/60 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-['JetBrains_Mono',monospace] inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${roleBadge.className}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${roleBadge.indicator}`} />
                    {roleBadge.label}
                  </span>
                  <span
                    className={`font-['JetBrains_Mono',monospace] inline-block rounded px-1.5 py-0.5 text-[9px] uppercase ${planBadge.className}`}
                  >
                    {planBadge.label}
                  </span>
                </div>
                <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)]">
                  Joined: {formatDate(user.createdAt)}
                </span>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onPromptForceLogout(user)}
                  disabled={isSelf || isActionBusy === 'logout'}
                  className="flex-1 cursor-pointer rounded-xl border border-orange-500/30 bg-orange-500/10 py-1.5 text-xs font-semibold text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isActionBusy === 'logout' ? 'Logging out…' : 'Force Logout'}
                </button>

                <button
                  type="button"
                  onClick={() => onPromptDeleteUser(user)}
                  disabled={isSelf || isActionBusy === 'delete'}
                  className="flex-1 cursor-pointer rounded-xl border border-red-500/30 bg-red-500/10 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isActionBusy === 'delete' ? 'Deleting…' : 'Delete Account'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

