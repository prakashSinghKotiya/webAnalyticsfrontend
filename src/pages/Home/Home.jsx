import { useState, useTransition, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState, useTheme } from '../../context';
import { ROUTES } from '../../constants';

/**
 * Unified SVG Icon library matching the product typography and screenshot styling.
 */
function Icon({ name, size = 20, className = '' }) {
  const paths = {
    pulse: (
      <path d="M2 12h5l3-8 4 16 3-8h5" />
    ),
    arrow: (
      <>
        <path d="M4 12h15" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    zap: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    server: (
      <>
        <rect x="3" y="3" width="18" height="7" rx="2" />
        <rect x="3" y="14" width="18" height="7" rx="2" />
        <path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6" />
      </>
    ),
    redirect: (
      <>
        <path d="M4 7h15l-4-4" />
        <path d="M20 17H5l4 4" />
        <path d="m19 7-4 4" />
        <path d="m5 17 4-4" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
      </>
    ),
    moon: <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    chart: (
      <>
        <path d="M4 3v17h17" />
        <path d="m8 15 4-5 4 2 5-7" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] || paths.pulse}
    </svg>
  );
}

/**
 * Diagnostic tool suite definitions.
 * Each tool properly maps to a real route in our router with tailored color accents.
 */
const TOOLS = [
  {
    id: 'ttfb',
    name: 'Global TTFB Analyzer',
    to: ROUTES.TTFB,
    icon: 'globe',
    category: 'Performance',
    tag: 'MOST POPULAR',
    description: 'See how fast your server responds. Test latency from 3+ locations around the world.',
    colorKey: 'emerald',
    iconBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    tagBg: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
  },
  {
    id: 'lighthouse',
    name: 'FullSite Report',
    to: ROUTES.LIGHTHOUSE,
    icon: 'zap',
    category: 'Performance',
    tag: 'LIGHTHOUSE',
    description: 'One report. Every insight. Audit performance, accessibility, best practices, and SEO.',
    colorKey: 'purple',
    iconBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    tagBg: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20',
  },
  {
    id: 'uptime',
    name: '24/7 Uptime Monitor',
    to: ROUTES.UPTIME,
    icon: 'clock',
    category: 'Monitoring',
    tag: 'ALWAYS ON',
    description: 'Know the moment your site goes down. Monitor availability and stay ahead of outages.',
    colorKey: 'orange',
    iconBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    tagBg: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
  },
  {
    id: 'dns',
    name: 'DNS Record Inspector',
    to: ROUTES.DNS,
    icon: 'server',
    category: 'Domain & network',
    tag: 'NETWORK',
    description: 'Take the guesswork out of DNS. Query and validate A, AAAA, MX, CNAME, and more.',
    colorKey: 'blue',
    iconBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    tagBg: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20',
  },
  {
    id: 'whois',
    name: 'WHOIS Lookup',
    to: ROUTES.WHOIS,
    icon: 'search',
    category: 'Domain & network',
    tag: 'DOMAIN',
    description: 'Get the full picture of any domain, from registrar details to expiration dates.',
    colorKey: 'pink',
    iconBg: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
    tagBg: 'bg-pink-500/10 text-pink-800 dark:text-pink-300 border-pink-500/20',
  },
  {
    id: 'redirects',
    name: 'Redirect Chain Checker',
    to: ROUTES.REDIRECTS,
    icon: 'redirect',
    category: 'Domain & network',
    tag: 'SEO & HTTP',
    description: 'Follow every hop. Find redirect loops, inspect status codes, and fix broken journeys.',
    colorKey: 'yellow',
    iconBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    tagBg: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
  },
];

const FILTER_TABS = ['All tools', 'Performance', 'Monitoring', 'Domain & network'];



export default function Home() {
  const { user } = useAuthState();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [activeFilter, setActiveFilter] = useState('All tools');
  const [domainInput, setDomainInput] = useState('');
  const [selectedToolId, setSelectedToolId] = useState(TOOLS[0].id);
  const [inputError, setInputError] = useState('');
  const [activeModal, setActiveModal] = useState(null);

  // Normalize user display name & initial
  const displayName = user?.name ? user.name.split(' ')[0] : 'shkngg';
  const initial = displayName.charAt(0).toUpperCase() || 'S';

  // Cleans domain input (strips protocol, port, trailing path)
  const sanitizeDomain = (raw) => {
    return raw.trim().replace(/^https?:\/\//i, '').replace(/[:/].*$/, '');
  };

  const handleLaunch = (e) => {
    e.preventDefault();
    const clean = sanitizeDomain(domainInput);

    if (!clean || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(clean)) {
      setInputError('Enter a valid domain, like example.com or github.com.');
      return;
    }

    setInputError('');
    const targetTool = TOOLS.find((t) => t.id === selectedToolId) || TOOLS[0];

    startTransition(() => {
      navigate(`${targetTool.to}?domain=${encodeURIComponent(clean)}`);
    });
  };

  const handleQuickPreset = (preset) => {
    setDomainInput(preset);
    setInputError('');
    document.getElementById('homepage-url')?.focus();
  };

  const scrollToTools = useCallback(() => {
    document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const filteredTools = activeFilter === 'All tools'
    ? TOOLS
    : TOOLS.filter((t) => t.category === activeFilter);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Compact Welcome Hero ───────────────────────────────────── */}
      <section className="fade-up relative overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)] transition">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--cyan-dim)] font-['Outfit',sans-serif] text-base font-bold text-[var(--cyan)] shadow-inner">
              {initial}
            </div>
            <div>
              <h1 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-bold tracking-tight text-[var(--text)]">
                Welcome back, <span className="text-[var(--cyan)]">{displayName}</span>
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-[var(--muted-2)]">
                Your command center for a faster, more reliable web. Let’s make every millisecond count.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--muted-2)] shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[var(--green)] animate-pulse" />
              <span>Workspace Active</span>
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] text-[var(--muted-2)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)] shadow-xs"
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Quick Check Launcher (Matching Image 1 bottom) ──────────── */}
      <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Header Title & Subtitle with Zap Icon */}
          <div className="flex items-start gap-3.5 lg:max-w-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-inner">
              <Icon name="zap" size={20} />
            </div>
            <div>
              <h2 className="font-['Outfit',sans-serif] text-base sm:text-lg font-bold text-[var(--text)]">
                Start with a quick check
              </h2>
              <p className="text-xs text-[var(--muted-2)]">
                One URL. Instant clarity.
              </p>
            </div>
          </div>

          {/* Form Controls */}
          <form onSubmit={handleLaunch} className="flex-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
              {/* URL Input */}
              <div className="sm:col-span-6">
                <label htmlFor="homepage-url" className="mb-1.5 block text-xs font-semibold text-[var(--text)]">
                  Your website URL
                </label>
                <div
                  className={`flex h-11 items-center gap-2.5 rounded-xl border bg-[var(--surface-2)] px-3 text-sm transition focus-within:border-[var(--green)] focus-within:ring-2 focus-within:ring-[var(--green-dim)] ${
                    inputError ? 'border-red-500' : 'border-[var(--border-mid)]'
                  }`}
                >
                  <Icon name="globe" size={17} className="text-[var(--muted)] shrink-0" />
                  <input
                    id="homepage-url"
                    type="text"
                    value={domainInput}
                    onChange={(e) => {
                      setDomainInput(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    placeholder="example.com or https://yoursite.com"
                    className="h-full w-full bg-transparent text-xs sm:text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                  />
                </div>
              </div>

              {/* Tool Selector Dropdown */}
              <div className="sm:col-span-3">
                <label htmlFor="homepage-tool" className="mb-1.5 block text-xs font-semibold text-[var(--text)]">
                  Choose a tool
                </label>
                <div className="relative">
                  <select
                    id="homepage-tool"
                    value={selectedToolId}
                    onChange={(e) => setSelectedToolId(e.target.value)}
                    className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] pl-3 pr-8 text-xs font-medium text-[var(--text)] outline-none transition focus:border-[var(--green)]"
                  >
                    {TOOLS.map((tool) => (
                      <option key={tool.id} value={tool.id}>
                        {tool.name}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="chevron"
                    size={14}
                    className="pointer-events-none absolute right-3 top-3.5 text-[var(--muted)]"
                  />
                </div>
              </div>

              {/* Run Analysis Button */}
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--cyan)] hover:opacity-90 text-white dark:text-slate-950 font-bold text-xs px-4 shadow-sm transition active:scale-95"
                >
                  <span>Run analysis</span>
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {inputError && (
              <p className="mt-2 text-xs font-medium text-red-500" role="alert">
                {inputError}
              </p>
            )}

            {/* Quick Example Presets */}
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-[var(--muted-2)]">
              <span>Try a quick example:</span>
              {['google.com', 'github.com', 'cloudflare.com'].map((site) => (
                <button
                  key={site}
                  type="button"
                  onClick={() => handleQuickPreset(site)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)] transition hover:border-[var(--green)] hover:text-[var(--text)]"
                >
                  <span>{site}</span>
                  <Icon name="arrow" size={10} />
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

  
      {/* ── Tools Suite Section (Matching Image 2) ───────────────────── */}
      <section id="tools-section" className="fade-up-delay-2 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-2)]">
              LESS GUESSWORK. MORE INSIGHT.
            </div>
            <h2 className="mt-1 font-['Outfit',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
              The right tool for every question<span className="text-[var(--cyan)]">.</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[var(--muted-2)]">
              Go deeper into your site’s performance, reliability, and infrastructure.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[var(--text)] hover:text-[var(--cyan)] transition"
          >
            <span>Go to dashboard</span>
            <Icon name="arrow" size={14} />
          </Link>
        </div>

        {/* Toolbar: Category Filter Tabs & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-mid)] pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="tablist">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab;
              const count = tab === 'All tools' ? TOOLS.length : TOOLS.filter((t) => t.category === tab).length;

              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[var(--surface-2)] text-[var(--text)] shadow-xs border border-[var(--border-mid)]'
                      : 'text-[var(--muted-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/60'
                  }`}
                >
                  <span>{tab}</span>
                  {tab === 'All tools' && (
                    <span className="rounded-full bg-[var(--surface-3)] px-1.5 py-0.2 text-[10px] font-bold text-[var(--muted-2)]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-[var(--muted-2)]">
            {activeFilter === 'All tools' ? '6 tools, one workspace' : `${filteredTools.length} tools to explore`}
          </span>
        </div>

        {/* 6 Tool Cards Grid (Matching Image 2) */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.to}
              className="group flex flex-col justify-between rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-[var(--border-bright)] hover:shadow-[var(--shadow-card-hover)] no-underline"
            >
              <div>
                {/* Top Row: Icon Container & Tag Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tool.iconBg} shadow-xs`}>
                    <Icon name={tool.icon} size={22} />
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider ${tool.tagBg}`}
                  >
                    {tool.tag}
                  </span>
                </div>

                {/* Card Title & Description */}
                <h3 className="mt-4 font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)] group-hover:text-[var(--cyan)] transition">
                  {tool.name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[var(--muted-2)] leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Bottom Footer Row */}
              <div className="mt-6 flex items-center justify-between border-t border-[var(--border-mid)] pt-4 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text)] group-hover:text-[var(--cyan)] transition">
                  <span>Explore tool</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    <Icon name="arrow" size={13} />
                  </span>
                </span>
                <span className="text-[var(--muted-2)] font-medium">
                  {tool.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Global Network Banner ───────────────────────────────────── */}
      <section className="fade-up-delay-3 flex flex-col gap-5 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
            <Icon name="globe" size={24} />
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
              A global perspective. A local advantage.
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted-2)]">
              Dedicated probes across North America, Europe, Asia, and Oceania. See your site the way the world does.
            </p>
          </div>
        </div>

        <Link
          to={ROUTES.TTFB}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition shadow-xs"
        >
          <span>Explore our network</span>
          <Icon name="arrow" size={14} />
        </Link>
      </section>

      {/* ── Page Footer (Matching Image 3) ──────────────────────────── */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-mid)] pt-6 text-xs text-[var(--muted-2)]">
        {/* Brand statement */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--cyan)]">
            <Icon name="pulse" size={17} />
          </span>
          <strong className="font-semibold text-[var(--text)]">MonitorMyHost</strong>
          <span className="text-[var(--border-mid)]">|</span>
          <span>Built for a healthier web.</span>
        </div>

        {/* System operational badge & help */}
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--green)]">
            <span className="h-2 w-2 rounded-full bg-[var(--green)] animate-pulse" />
            <span>All systems operational</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveModal('help')}
            className="cursor-pointer text-[var(--muted-2)] hover:text-[var(--text)] transition flex items-center gap-1"
          >
            <Icon name="help" size={14} />
            <span>Need a hand?</span>
          </button>
        </div>
      </footer>

      {/* ── Help / Network Information Dialog Modal ─────────────────── */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative w-full max-w-md rounded-3xl border border-[var(--border-bright)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-card-hover)] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              aria-label="Close dialog"
              className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition"
            >
              <Icon name="close" size={16} />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
              <Icon name={activeModal === 'help' ? 'help' : 'globe'} size={24} />
            </div>

            <h3 id="modal-title" className="mt-4 font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)]">
              {activeModal === 'help' ? 'Workspace Help & Guide' : 'Global Probe Network'}
            </h3>

            {activeModal === 'help' ? (
              <div className="mt-3 space-y-3 text-xs text-[var(--muted-2)] leading-relaxed">
                <p>Start with a target domain, then choose the diagnostic angle you need:</p>
                <div className="space-y-2 rounded-xl bg-[var(--surface-2)] p-3.5">
                  <div>
                    <strong className="text-[var(--text)]">Is my site fast?</strong>
                    <p className="mt-0.5">Use Global TTFB Analyzer or FullSite Report (Lighthouse v12).</p>
                  </div>
                  <div>
                    <strong className="text-[var(--text)]">Is my site reliable?</strong>
                    <p className="mt-0.5">Monitor availability with 24/7 Uptime Monitor.</p>
                  </div>
                  <div>
                    <strong className="text-[var(--text)]">Is DNS & routing configured properly?</strong>
                    <p className="mt-0.5">Query records with DNS Inspector and Redirect Chain Checker.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    scrollToTools();
                  }}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--cyan)] hover:opacity-90 text-white dark:text-slate-950 font-bold py-2.5 transition"
                >
                  <span>Browse all tools</span>
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
