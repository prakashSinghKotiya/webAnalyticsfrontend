import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components';
import { ROUTES } from '../../constants';
import { useAuthState } from '../../context/AuthContext';

/**
 * Diagnostic tool quick navigation cards for faster recovery
 */
const QUICK_TOOLS = [
  {
    name: 'TTFB Latency',
    desc: 'Regional probe latency',
    demoPath: ROUTES.DEMO_TTFB,
    authPath: ROUTES.TTFB,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    accent: 'var(--cyan)',
  },
  {
    name: 'Lighthouse Audit',
    desc: 'Performance & SEO health',
    demoPath: ROUTES.DEMO_LIGHTHOUSE,
    authPath: ROUTES.LIGHTHOUSE,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    accent: 'var(--yellow)',
  },
  {
    name: 'DNS Lookup',
    desc: 'A, AAAA, MX & TXT records',
    demoPath: ROUTES.DEMO_DNS,
    authPath: ROUTES.DNS,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    accent: 'var(--purple)',
  },
  {
    name: 'Redirect Tracer',
    desc: 'HTTP hop analysis & status',
    demoPath: ROUTES.DEMO_REDIRECTS,
    authPath: ROUTES.REDIRECTS,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
    accent: 'var(--orange)',
  },
  {
    name: 'WHOIS / RDAP',
    desc: 'Domain registrar & expiration',
    demoPath: ROUTES.DEMO_WHOIS,
    authPath: ROUTES.WHOIS,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    accent: 'var(--green)',
  },
];

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthState() || {};

  const homeDestination = isAuthenticated ? ROUTES.HOME : ROUTES.PUBLIC_HOME;

  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-full max-w-4xl -translate-x-1/2 rounded-full bg-[var(--cyan)]/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--purple)]/5 blur-3xl" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-[var(--border)] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo to={homeDestination} />
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={ROUTES.HOME}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--border-bright)]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="text-xs sm:text-sm font-semibold text-[var(--muted-2)] transition hover:text-[var(--text)]"
                >
                  Sign in
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="rounded-xl bg-[var(--cyan)] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        {/* Animated Radar/Ping Graphic */}
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[var(--cyan)]/10 duration-1000" />
          <div className="absolute inset-2 rounded-full border border-[var(--cyan)]/20 bg-[var(--surface)] shadow-[var(--shadow-card)]" />
          <div className="absolute inset-6 rounded-full border border-dashed border-[var(--cyan)]/40 animate-[spin_20s_linear_infinite]" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--cyan-dim)] to-[var(--surface-2)] text-[var(--cyan)] shadow-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
        </div>

        {/* Status Tag */}
        <span className="font-['JetBrains_Mono',monospace] mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--cyan)]/30 bg-[var(--cyan-dim)] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cyan)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
          <span>404 · Signal Lost</span>
        </span>

        {/* Heading */}
        <h1 className="font-['Outfit',sans-serif] text-center text-3xl font-extrabold tracking-tight sm:text-5xl">
          Page not found
        </h1>

        {/* Description */}
        <p className="mt-3 max-w-lg text-center text-sm sm:text-base leading-relaxed text-[var(--muted-2)]">
          Looks like you’ve followed a broken link or entered a URL that doesn’t exist on this site.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            to={homeDestination}
            className="font-['Outfit',sans-serif] inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[#0099ff] px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_var(--cyan-mid)] transition hover:-translate-y-0.5 hover:brightness-110 sm:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{isAuthenticated ? 'Go to Dashboard' : 'Back to Home'}</span>
          </Link>

          <Link
            to={ROUTES.DEMO_TTFB}
            className="font-['Outfit',sans-serif] inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)] sm:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Try Live Demos</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="cursor-pointer font-['Outfit',sans-serif] inline-flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-[var(--muted-2)] transition hover:text-[var(--text)] sm:w-auto"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Previous Page</span>
          </button>
        </div>

        {/* Quick Tools Explorer Grid */}
        <section aria-label="Available Diagnostic Tools" className="mt-12 w-full">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wider text-[var(--muted-2)]">
              Operational Diagnostic Analyzers
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--green)]">
              ● All Systems Operational
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {QUICK_TOOLS.map((tool) => {
              const targetPath = isAuthenticated ? tool.authPath : tool.demoPath;
              return (
                <Link
                  key={tool.name}
                  to={targetPath}
                  className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-sm transition hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] transition group-hover:scale-105"
                    style={{ color: tool.accent }}
                  >
                    {tool.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[var(--text)] group-hover:text-[var(--cyan)]">
                      {tool.name}
                    </p>
                    <p className="truncate text-[11px] text-[var(--muted-2)]">
                      {tool.desc}
                    </p>
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--muted)] opacity-0 transition group-hover:opacity-100 group-hover:translate-x-0.5"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted)]">
        <p>© WebPulse · Real-time website performance telemetry &amp; security analytics.</p>
      </footer>
    </main>
  );
}
