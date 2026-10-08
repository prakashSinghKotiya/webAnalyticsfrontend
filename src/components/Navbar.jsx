import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useSocket, useTheme } from '../context';
import Logo from './Logo';
import { I, TOOL_GROUPS } from './navConfig.jsx';

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-mid)] bg-transparent text-[var(--muted-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
    >
      {isDark ? I.sun : I.moon}
    </button>
  );
}

function SocketDot() {
  const { isConnected, isReconnecting } = useSocket();
  const color = isConnected ? 'var(--green)' : isReconnecting ? 'var(--orange)' : 'var(--muted)';
  const label = isConnected ? 'Live' : isReconnecting ? 'Reconnecting' : 'Offline';
  return (
    <span className="hidden items-center gap-1.5 sm:flex">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: isConnected ? `0 0 5px ${color}` : 'none' }} />
      <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]">{label}</span>
    </span>
  );
}

function ToolsDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);
  const ref = useRef(null);

  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setOpen(false);
  }

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isToolActive = TOOL_GROUPS.flatMap(g => g.items).some(i => location.pathname === i.to);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition cursor-pointer border-none ${
          isToolActive
            ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
            : 'bg-transparent text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
        }`}
      >
        Tools
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>{I.chevron}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[520px] rounded-2xl border border-[var(--border-bright)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card-hover)]">
          <div className="grid grid-cols-3 gap-4">
            {TOOL_GROUPS.map(group => (
              <div key={group.label}>
                <p className="font-['JetBrains_Mono',monospace] mb-2 px-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex items-start gap-2.5 rounded-xl p-2.5 no-underline transition ${
                          isActive
                            ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
                            : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                        }`
                      }
                    >
                      <span className="mt-0.5 flex-none">{item.icon}</span>
                      <span>
                        <span className="block text-sm font-semibold leading-tight">{item.label}</span>
                        <span className="block text-[11px] text-[var(--muted)] leading-snug mt-0.5">{item.desc}</span>
                      </span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, onLogout }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);
  const ref = useRef(null);

  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setOpen(false);
  }

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] text-sm font-bold text-white border-none transition hover:shadow-[0_0_12px_var(--cyan-mid)]"
        aria-label="User menu"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[var(--border-bright)] bg-[var(--surface)] p-2 shadow-[var(--shadow-card-hover)]">
          <div className="border-b border-[var(--border)] px-3 py-2.5 mb-1">
            <p className="text-sm font-semibold text-[var(--text)] truncate">{user?.name || 'Account'}</p>
            <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)] truncate">{user?.email || ''}</p>
            <span className="font-['JetBrains_Mono',monospace] mt-1.5 inline-block rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[var(--cyan)]">
              {user?.plan || 'free'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-none bg-transparent px-3 py-2 text-sm text-[var(--muted-2)] transition hover:bg-[var(--red)]/10 hover:text-[var(--red)]"
          >
            {I.logout}
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ user, onLogout, isAdmin, onMenuOpen }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 backdrop-blur-md sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open menu"
          className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--muted-2)] transition hover:text-[var(--text)] lg:hidden"
        >
          {I.menu}
        </button>

        <Logo to={ROUTES.HOME} />

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <NavLink
            to={ROUTES.HOME}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition ${
                isActive
                  ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
                  : 'text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`
            }
          >
            Home
          </NavLink>

          <NavLink
            to={ROUTES.DASHBOARD}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition ${
                isActive
                  ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
                  : 'text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`
            }
          >
            Dashboard
          </NavLink>

          <ToolsDropdown />

          {isAdmin && (
            <NavLink
              to={ROUTES.ADMIN}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition ${
                  isActive
                    ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
                    : 'text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`
              }
            >
              {I.shield}
              <span className="ml-1">Admin</span>
            </NavLink>
          )}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <SocketDot />
        <ThemeToggle />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
