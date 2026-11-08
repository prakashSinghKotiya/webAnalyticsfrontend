import { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { getAppUrl } from '../utils/subdomainNav';
import { useTheme } from '../context';
import Logo from './Logo';

const NAV_LINKS = [
  { name: 'Home', to: ROUTES.PUBLIC_HOME, end: true },
  { name: 'Tools', to: '/ttfb-test' },
  { name: 'Hosting Reviews', to: '/hosting-reviews' },
  { name: 'About', to: ROUTES.ABOUT },
  { name: 'Contact', to: ROUTES.CONTACT },
];

const SERVICES_LINKS = [
  {
    name: 'Hosting Reviews',
    to: '/hosting-reviews',
    badge: 'Real Uptime',
    tone: 'cyan',
    desc: 'Independent reviews with real speed & uptime data',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
  },
  {
    name: 'Global TTFB Test',
    to: '/ttfb-test',
    badge: '35+ Nodes',
    tone: 'cyan',
    desc: 'First byte server response time & edge latency',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    name: 'FullSite Report',
    to: '/fullsite-report',
    badge: 'Core Vitals',
    tone: 'orange',
    desc: 'Google Lighthouse performance & SEO audit',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="m9.17 14.83-4.24 4.24" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    name: 'DNS Inspector',
    to: '/dns-checker',
    badge: 'Authoritative',
    tone: 'green',
    desc: 'Check A, AAAA, MX, CNAME, & TXT records',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
  },
  {
    name: 'Redirect Checker',
    to: '/redirection-checker',
    badge: 'Trace Hops',
    tone: 'orange',
    desc: 'Analyze 301/302 chains & prevent loops',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
  },
  {
    name: 'WHOIS Domain Lookup',
    to: '/whois-lookup',
    badge: 'Domain Intel',
    tone: 'cyan',
    desc: 'Registrar intel, nameservers, & expiry dates',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--cyan)] transition hover:border-[var(--border-bright)]"
    >
      {theme === 'dark' ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function PublicHeader({ activeKey = '' }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo to={ROUTES.PUBLIC_HOME} />

          {/* Desktop Navigation */}
          <nav aria-label="Main public navigation" className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `text-sm font-semibold transition ${
                    isActive || activeKey === link.name
                      ? 'text-[var(--cyan)]'
                      : 'text-[var(--muted-2)] hover:text-[var(--text)]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            <a
              href="/#pricing"
              className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]"
            >
              Pricing
            </a>
          </nav>

          {/* Right CTA & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={getAppUrl(ROUTES.LOGIN)}
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold text-[var(--text-2)] hover:text-[var(--cyan)] transition"
            >
              Sign In
            </a>
            <a
              href={getAppUrl(ROUTES.REGISTER)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition"
            >
              Get Started Free
            </a>
            <ThemeToggle />

            {/* Mobile hamburger button */}
            <button
              type="button"
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              aria-expanded={open}
              aria-controls="public-mobile-navigation"
              onClick={() => setOpen((prev) => !prev)}
              className="rounded-lg p-2 text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] lg:hidden transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {open ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE SIDEBAR DRAWER (PORTAL DIRECTLY INTO BODY) ── */}
      {/* Mounted in document.body so that header's backdrop-blur never traps or clips it */}
      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop Overlay - completely covers viewport with blur & fade */}
          <div
            className={`fixed inset-0 z-[99] bg-black/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
              open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel - 100% solid, fully opaque background, top-to-bottom */}
          <aside
            ref={menuRef}
            id="public-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            style={{
              backgroundColor: 'var(--surface, #181b22)',
              color: 'var(--text, #f0f0f0)',
            }}
            className={`fixed inset-y-0 right-0 z-[100] flex h-[100dvh] w-full max-w-[340px] flex-col border-l border-[var(--border-mid)] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
              open ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
            }`}
          >
            {/* Drawer Header */}
            <div
              style={{ backgroundColor: 'var(--surface, #181b22)' }}
              className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-4"
            >
              <Logo to={ROUTES.PUBLIC_HOME} />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-[var(--muted-2)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div
              style={{ backgroundColor: 'var(--surface, #181b22)' }}
              className="flex-1 space-y-5 overflow-y-auto px-4 py-4 overscroll-contain"
            >
              {/* Featured Hosting Reviews Banner Link */}
              <Link
                to="/hosting-reviews"
                onClick={() => setOpen(false)}
                className={`group flex items-center justify-between rounded-xl border p-3 transition active:scale-[0.98] ${
                  activeKey === 'Hosting Reviews'
                    ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)]'
                    : 'border-[var(--cyan-mid)]/40 bg-[var(--cyan-dim)]/30 text-[var(--text)] hover:border-[var(--cyan)] hover:bg-[var(--cyan-dim)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cyan)] text-white shadow-xs">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20V10" />
                      <path d="M18 20V4" />
                      <path d="M6 20v-4" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-bold leading-tight text-[var(--text)]">Hosting Reviews</p>
                    <p className="text-[10px] text-[var(--muted-2)]">Real Uptime &amp; Speed Telemetry</p>
                  </div>
                </div>
                <span className="font-['JetBrains_Mono',monospace] rounded-full border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] px-2 py-0.5 text-[9px] font-bold text-[var(--cyan)]">
                  Live
                </span>
              </Link>

              {/* Free Diagnostic Tools Section */}
              <div>
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <p className="font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Services &amp; Tools
                  </p>
                  <span className="text-[10px] font-medium text-[var(--cyan)]">Zero Signup</span>
                </div>
                <div className="space-y-1.5">
                  {SERVICES_LINKS.map((tool) => (
                    <Link
                      key={tool.to}
                      to={tool.to}
                      onClick={() => setOpen(false)}
                      className={`group flex items-start gap-3 rounded-xl border p-2.5 transition active:scale-[0.98] ${
                        activeKey === tool.name
                          ? 'border-[var(--cyan)] bg-[var(--cyan-dim)]'
                          : 'border-[var(--border)] bg-[var(--surface-2)]/60 hover:border-[var(--cyan)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                          tool.tone === 'cyan'
                            ? 'border-[var(--cyan-mid)] bg-[var(--cyan-dim)] text-[var(--cyan)]'
                            : tool.tone === 'green'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {tool.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--cyan)] transition">
                            {tool.name}
                          </p>
                          {tool.badge && (
                            <span className="font-['JetBrains_Mono',monospace] text-[9px] font-semibold text-[var(--muted)]">
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-[var(--muted-2)]">
                          {tool.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Main Navigation Links */}
              <div className="border-t border-[var(--border)] pt-3">
                <p className="mb-1.5 px-1 font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Explore Platform
                </p>
                <div className="space-y-0.5">
                  <NavLink
                    to={ROUTES.PUBLIC_HOME}
                    end
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]'
                          : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                      }`
                    }
                  >
                    Home
                  </NavLink>
                  <NavLink
                    to={ROUTES.ABOUT}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]'
                          : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                      }`
                    }
                  >
                    About MonitorMyHost
                  </NavLink>
                  <NavLink
                    to={ROUTES.CONTACT}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? 'bg-[var(--cyan-dim)] font-semibold text-[var(--cyan)]'
                          : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                      }`
                    }
                  >
                    Contact Us
                  </NavLink>
                  <a
                    href="/#pricing"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-2)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                  >
                    Pricing Plans
                  </a>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div
              style={{ backgroundColor: 'var(--surface, #181b22)' }}
              className="space-y-2 border-t border-[var(--border)] p-4 shrink-0"
            >
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-[var(--muted-2)] font-medium">Theme</span>
                <ThemeToggle />
              </div>
              <div className="flex gap-2">
                <a
                  href={getAppUrl(ROUTES.LOGIN)}
                  onClick={() => setOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-2 text-xs font-bold text-[var(--text)] transition hover:border-[var(--border-bright)]"
                >
                  Sign In
                </a>
                <a
                  href={getAppUrl(ROUTES.REGISTER)}
                  onClick={() => setOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] py-2 text-xs font-bold text-white shadow-xs transition hover:brightness-110"
                >
                  Get Started
                </a>
              </div>
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  );
}

export default memo(PublicHeader);
