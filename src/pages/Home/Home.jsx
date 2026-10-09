import { useState, useTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from '../../context';
import { ROUTES } from '../../constants';

// Clean SVG Icons for Tools & Actions
const Icons = {
  gauge: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
      <polyline points="12 12 18 6" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  zap: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  clock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  globe: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  dns: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="7" rx="2" />
      <rect x="2" y="13" width="20" height="7" rx="2" />
      <line x1="6" y1="7.5" x2="6.01" y2="7.5" />
      <line x1="6" y1="16.5" x2="6.01" y2="16.5" />
    </svg>
  ),
  redirect: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  arrowRight: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  shieldCheck: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
};

const FEATURED_SUITE = [
  {
    to: ROUTES.TTFB,
    icon: Icons.gauge,
    label: 'Global TTFB Analyzer',
    tag: 'Latency',
    desc: 'Diagnose response time and CDN edge caching across 35+ worldwide probe servers.',
    color: 'var(--cyan)',
  },
  {
    to: ROUTES.LIGHTHOUSE,
    icon: Icons.zap,
    label: 'FullSite Report',
    tag: 'Web Vitals',
    desc: 'Comprehensive Performance, Accessibility, Best Practices, and SEO audits.',
    color: 'var(--green)',
  },
  {
    to: ROUTES.UPTIME,
    icon: Icons.clock,
    label: '24/7 Uptime Monitor',
    tag: 'Reliability',
    desc: 'Continuously verify endpoint reachability with instant alerts on outages.',
    color: 'var(--orange)',
  },
  {
    to: ROUTES.DNS,
    icon: Icons.dns,
    label: 'DNS Record Inspector',
    tag: 'Network',
    desc: 'Query, validate, and troubleshoot A, AAAA, CNAME, MX, TXT, and NS records.',
    color: 'var(--cyan)',
  },
  {
    to: ROUTES.WHOIS,
    icon: Icons.globe,
    label: 'WHOIS Lookup',
    tag: 'Domain',
    desc: 'Inspect registrar information, expiration dates, and domain name servers.',
    color: 'var(--green)',
  },
  {
    to: ROUTES.REDIRECTS,
    icon: Icons.redirect,
    label: 'Redirect Chain Checker',
    tag: 'SEO & HTTP',
    desc: 'Trace 301/302 redirect paths, detect routing loops, and audit status codes.',
    color: 'var(--orange)',
  },
];

export default function Home() {
  const { user } = useAuthState();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [testUrl, setTestUrl] = useState('');
  const [selectedTool, setSelectedTool] = useState(ROUTES.TTFB);

  const cleanDomain = (value) => {
    return value.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  };

  const handleQuickRun = (e) => {
    e.preventDefault();
    if (!testUrl.trim()) return;

    const domain = cleanDomain(testUrl);
    startTransition(() => {
      navigate(`${selectedTool}?domain=${encodeURIComponent(domain)}`);
    });
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="space-y-8 pb-12">
      {/* ── Welcome Banner with Glass Gradient ── */}
      <section className="fade-up relative overflow-hidden rounded-3xl border border-[var(--border-mid)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-2)] to-[var(--surface)] p-6 sm:p-10 shadow-[var(--shadow-card)]">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--glow-bg)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-[var(--green-dim)] blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider text-[var(--cyan)]">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
            <span>Workspace Active</span>
          </div>

          <h1 className="mt-4 font-['Outfit',sans-serif] text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
            Welcome back, <span className="bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] bg-clip-text text-transparent">{displayName}</span>
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[var(--muted-2)] leading-relaxed">
            Run on-demand diagnostics, test latency worldwide, or track site health across your web properties.
          </p>

          {/* ── Quick URL Launcher Bar ── */}
          <form onSubmit={handleQuickRun} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3.5 py-2.5 shadow-inner transition focus-within:border-[var(--cyan)] focus-within:shadow-[0_0_0_3px_var(--cyan-dim)]">
              <span className="text-[var(--muted)] mr-2.5">{Icons.search}</span>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="example.com or https://yoursite.com"
                className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] font-['Inter',sans-serif]"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[var(--text)] outline-none transition focus:border-[var(--cyan)]"
              >
                <option value={ROUTES.TTFB}>TTFB Analyzer</option>
                <option value={ROUTES.LIGHTHOUSE}>FullSite Report</option>
                <option value={ROUTES.UPTIME}>Uptime Monitor</option>
                <option value={ROUTES.DNS}>DNS Records</option>
                <option value={ROUTES.WHOIS}>WHOIS Lookup</option>
                <option value={ROUTES.REDIRECTS}>Redirects</option>
              </select>

              <button
                type="submit"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[var(--cyan)] to-[#0099ff] px-5 py-2.5 font-['Outfit',sans-serif] text-sm font-bold text-white shadow-[0_0_20px_var(--cyan-mid)] transition hover:-translate-y-0.5 hover:shadow-[0_0_28px_var(--cyan-mid)]"
              >
                Run {Icons.arrowRight}
              </button>
            </div>
          </form>

          {/* Quick presets */}
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>Quick test:</span>
            {['google.com', 'github.com', 'cloudflare.com'].map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setTestUrl(domain)}
                className="cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
              >
                {domain}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Status / Live Metrics Strip ── */}
      <section className="fade-up-delay-1 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Global Probes', value: '35 Nodes', badge: 'Active', color: 'var(--cyan)' },
          { label: 'Avg Latency', value: '< 65 ms', badge: 'Optimal', color: 'var(--green)' },
          { label: 'Audits Engine', value: 'Lighthouse v12', badge: 'Ready', color: 'var(--orange)' },
          { label: 'WebSocket Stream', value: 'Live Feed', badge: 'Connected', color: 'var(--cyan)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {stat.label}
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] font-semibold uppercase tracking-wider"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
              >
                {stat.badge}
              </span>
            </div>
            <div className="mt-2 font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--text)]">
              {stat.value}
            </div>
          </div>
        ))}
      </section>

      {/* ── Tools Suite Cards ── */}
      <section className="fade-up-delay-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--text)]">
              Analytics & Diagnostic Suite
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-2)]">
              Select a specialized tool to analyze site speed, domain health, or server configuration.
            </p>
          </div>
          <Link
            to={ROUTES.DASHBOARD}
            className="hidden text-xs font-semibold text-[var(--cyan)] no-underline hover:underline sm:inline-flex items-center gap-1"
          >
            View Dashboard Overview {Icons.arrowRight}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_SUITE.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 no-underline shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-[var(--border-bright)] hover:shadow-[var(--shadow-card-hover)]"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
                  >
                    {tool.icon}
                  </div>
                  <span
                    className="rounded-md border px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-medium uppercase tracking-wider"
                    style={{ borderColor: `${tool.color}30`, color: tool.color }}
                  >
                    {tool.tag}
                  </span>
                </div>

                <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] transition group-hover:text-[var(--cyan)]">
                  {tool.label}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted-2)] leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1.5 font-['Outfit',sans-serif] text-xs font-semibold text-[var(--cyan)]">
                Launch Tool
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  {Icons.arrowRight}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── System Status & Security Note ── */}
      <section className="fade-up-delay-3 flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cyan-dim)] text-[var(--cyan)]">
            {Icons.shieldCheck}
          </span>
          <div>
            <div className="text-sm font-semibold text-[var(--text)]">Enterprise Edge Probes Active</div>
            <div className="text-xs text-[var(--muted-2)]">Tests originate from dedicated nodes across North America, Europe, Asia, and Oceania.</div>
          </div>
        </div>
        <Link
          to={ROUTES.DASHBOARD}
          className="inline-flex items-center justify-center rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] no-underline transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
        >
          Explore All Metrics
        </Link>
      </section>
    </div>
  );
}
