import { NavLink } from 'react-router-dom';
import { ROUTES } from '../constants';
import Logo from './Logo';
import { I, TOOL_GROUPS } from './navConfig.jsx';

export default function MobileDrawer({ open, onClose, user, onLogout, isAdmin }) {
  const roleLower = (user?.role || '').toLowerCase();
  const isSuper = roleLower === 'superadmin' || roleLower === 'super_admin';

  const handleNav = (callback) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (callback) callback();
    onClose();
  };

  return (
    <>
      <div
        onClick={() => handleNav()}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden="true"
      />
      <aside
        inert={!open ? '' : undefined}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-200 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <Logo to={ROUTES.HOME} />
          <button type="button" onClick={() => handleNav()} className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--muted-2)] transition hover:text-[var(--text)]">
            {I.x}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <NavLink
            to={ROUTES.HOME}
            onClick={() => handleNav()}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline transition mb-1 ${
                isActive ? 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`
            }
          >
            {I.home}
            Home
          </NavLink>

          <NavLink
            to={ROUTES.DASHBOARD}
            onClick={() => handleNav()}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline transition mb-1 ${
                isActive ? 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`
            }
          >
            {I.dashboard}
            Dashboard
          </NavLink>

          {TOOL_GROUPS.map(group => (
            <div key={group.label} className="mt-4">
              <p className="font-['JetBrains_Mono',monospace] mb-1.5 px-3 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                {group.label}
              </p>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => handleNav()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline transition mb-0.5 ${
                      isActive ? 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}

          {isAdmin && (
            <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-1">
              <NavLink
                to={ROUTES.ADMIN}
                onClick={() => handleNav()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline transition ${
                    isActive
                      ? isSuper
                        ? 'bg-purple-100 font-semibold text-purple-900 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
                        : 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]'
                      : isSuper
                      ? 'text-purple-800 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10'
                      : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`
                }
              >
                {I.shield}
                {isSuper ? 'SuperAdmin Panel' : 'Admin Panel'}
              </NavLink>

              <NavLink
                to={ROUTES.ADMIN_HOSTING_REVIEWS}
                onClick={() => handleNav()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline transition ${
                    isActive
                      ? 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]'
                      : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Hosting Reviews
              </NavLink>
            </div>
          )}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] text-sm font-bold text-white">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text)]">{user?.name || 'Account'}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-['JetBrains_Mono',monospace] truncate text-[10px] text-[var(--muted)]">{user?.plan || 'free'} plan</p>
                {isSuper ? (
                  <span className="font-['JetBrains_Mono',monospace] rounded-full border border-purple-300 bg-purple-100 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-purple-900 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-300">
                    SuperAdmin
                  </span>
                ) : isAdmin ? (
                  <span className="font-['JetBrains_Mono',monospace] rounded-full border border-[var(--cyan)]/30 bg-[var(--cyan-dim)] px-1.5 py-0.2 text-[8px] uppercase tracking-wider text-[var(--cyan)]">
                    {user?.role || 'Admin'}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {isAdmin && (
            <>
              <NavLink
                to={ROUTES.ADMIN}
                onClick={() => handleNav()}
                className={({ isActive }) =>
                  `mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium no-underline transition ${
                    isActive
                      ? isSuper
                        ? 'bg-purple-100 font-semibold text-purple-900 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
                        : 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]'
                      : isSuper
                      ? 'text-purple-800 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10'
                      : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--cyan)]'
                  }`
                }
              >
                {I.shield}
                {isSuper ? 'SuperAdmin Panel' : 'Admin Panel'}
              </NavLink>

              <NavLink
                to={ROUTES.ADMIN_HOSTING_REVIEWS}
                onClick={() => handleNav()}
                className={({ isActive }) =>
                  `mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium no-underline transition ${
                    isActive
                      ? 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]'
                      : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--cyan)]'
                  }`
                }
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Hosting Reviews
              </NavLink>
            </>
          )}
          <button
            type="button"
            onClick={() => handleNav(onLogout)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-none bg-transparent px-3 py-2 text-sm text-[var(--muted-2)] transition hover:bg-[var(--red)]/10 hover:text-[var(--red)]"
          >
            {I.logout}
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
