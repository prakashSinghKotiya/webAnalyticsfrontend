
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { getAppUrl } from '../../utils/subdomainNav';
import { useTheme } from '../../context';
import { Logo, Footer } from '../../components';

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
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function AboutPage() {
  const stats = [
    { label: 'Global Probe Locations', val: '6+ Continents', sub: 'North America, Europe, Asia-Pacific' },
    { label: 'Check Frequency', val: 'Down to 30s', sub: 'High-precision synthetic telemetry' },
    { label: 'Monitoring SLA', val: '99.99%', sub: 'Zero-tolerance downtime detection' },
    { label: 'Deployment Time', val: '0 Agents', sub: 'Instant external synthetic queries' },
  ];

  const pillars = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
      tone: 'cyan',
      title: 'Autonomous Global Probe Clusters',
      desc: 'Our telemetry probes run concurrently across tier-1 data centers worldwide. By firing diagnostic requests directly from distributed networks, we evaluate edge response times without client-side caching interference.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      tone: 'green',
      title: 'Sub-Second Outage Detection & Alerts',
      desc: 'Detect origin outages, TLS handshakes stalls, and 5xx errors in real time. Configure instantaneous alert notifications across Email, Slack, PagerDuty, or custom webhooks to maintain uninterrupted availability.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      tone: 'orange',
      title: 'Core Web Vitals & Lighthouse Diagnostics',
      desc: 'Google Lighthouse audits simulate both mobile and desktop profiles, diagnosing Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), Total Blocking Time (TBT), and Accessibility defects.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
      tone: 'cyan',
      title: 'Authoritative DNS & Network Telemetry',
      desc: 'Inspect authoritative nameservers for A, AAAA, MX, CNAME, TXT, NS, and SOA records. Trace HTTP redirect chains to uncover latency loops and protect valuable SEO search equity.',
    },
  ];

  const faqs = [
    {
      q: 'What is MonitorMyHost and what problem does it solve?',
      a: 'MonitorMyHost is a specialized synthetic website and server monitoring platform. We provide developers, DevOps teams, and webmasters with real-time visibility into server uptime, multi-region TTFB latency, DNS integrity, and Google Core Web Vitals to prevent downtime before users notice.',
    },
    {
      q: 'How does multi-region synthetic monitoring differ from basic ping checkers?',
      a: 'Basic uptime tools ping a URL from a single location and often hit cached CDN nodes. MonitorMyHost executes multi-region concurrent requests from autonomous probes across North America, Europe, and Asia, testing raw TCP connection speed, TLS negotiation, and origin server processing.',
    },
    {
      q: 'Do I need to install any agent or script on my server?',
      a: 'No. MonitorMyHost operates entirely externally via non-intrusive synthetic probes. There are no agents to install, no root privileges needed, and zero performance impact on your application servers.',
    },
    {
      q: 'Why is Time to First Byte (TTFB) so critical for SEO rankings?',
      a: 'Google utilizes Core Web Vitals (specifically Largest Contentful Paint) as a direct search ranking factor. TTFB accounts for up to 40% of LCP latency. Faster first-byte delivery enables browsers and search engine crawlers to parse critical content immediately.',
    },
    {
      q: 'Are the free diagnostic tools genuinely free to use?',
      a: 'Yes. Our free public tools (TTFB Test, Lighthouse Report, DNS Inspector, Redirect Checker, and WHOIS Lookup) are available directly on monitormyhost.com without signup or credit card required.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo to={ROUTES.PUBLIC_HOME} />

          {/* Desktop Nav */}
          <nav aria-label="About page navigation" className="hidden lg:flex items-center gap-7">
            <Link to={ROUTES.PUBLIC_HOME} className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              Home
            </Link>
            <Link to="/ttfb-test" className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              Tools
            </Link>
            <Link to={ROUTES.ABOUT} className="text-sm font-semibold text-[var(--cyan)]">
              About
            </Link>
            <a href="/#pricing" className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              Pricing
            </a>
            <Link to={ROUTES.CONTACT} className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={getAppUrl(ROUTES.LOGIN)}
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold text-[var(--text-2)] hover:text-[var(--cyan)] transition"
            >
              Sign In
            </a>
            <a
              href={getAppUrl(ROUTES.REGISTER)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition"
            >
              Get Started Free
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface-2)]/30 py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--glow-bg),transparent_70%)]" />
          <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center">
            <span className="font-['JetBrains_Mono',monospace] inline-flex items-center gap-2 rounded-full border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--cyan)]">
              About MonitorMyHost
            </span>
            <h1 className="font-['Outfit',sans-serif] mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.1]">
              Pioneering High-Precision{' '}
              <span className="bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] bg-clip-text text-transparent">
                Server &amp; Uptime Telemetry
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[var(--muted-2)] sm:text-base">
              MonitorMyHost was built to eliminate infrastructure blind spots. We empower engineering teams, developers, and businesses with real-time uptime monitoring, multi-region latency intelligence, and full-spectrum website diagnostics.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={getAppUrl(ROUTES.REGISTER)}
                className="font-['Outfit',sans-serif] inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-6 py-3 text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition"
              >
                Start Monitoring Today
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
              <Link
                to="/ttfb-test"
                className="font-['Outfit',sans-serif] inline-flex items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition"
              >
                Try Free Diagnostic Tools
              </Link>
            </div>
          </div>
        </section>

        {/* Global Metrics Bar */}
        <section aria-label="Platform metrics" className="border-b border-[var(--border)] bg-[var(--surface)] py-8">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8 text-center">
            {stats.map((s) => (
              <div key={s.label} className="p-2">
                <div className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold text-[var(--cyan)]">
                  {s.val}
                </div>
                <div className="mt-1 text-xs font-bold text-[var(--text)]">{s.label}</div>
                <div className="font-['JetBrains_Mono',monospace] mt-0.5 text-[10px] text-[var(--muted)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>



        {/* Frequently Asked Questions (SEO Keyword Rich) */}
        <section aria-labelledby="faq-heading" className="border-t border-[var(--border)] py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[var(--cyan)]">
                Knowledge Base
              </span>
              <h2 id="faq-heading" className="font-['Outfit',sans-serif] mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-[var(--muted-2)]">
                Everything you need to know about our server monitoring and diagnostic capabilities.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                  <h3 className="font-['Outfit',sans-serif] text-sm sm:text-base font-bold text-[var(--text)]">
                    {f.q}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm leading-6 text-[var(--muted-2)]">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--surface-2)]/40 py-16 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-['Outfit',sans-serif] text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Safeguard Your Infrastructure?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-xs sm:text-sm text-[var(--muted-2)]">
              Join developers and DevOps teams who rely on MonitorMyHost for zero-downtime operations and sub-second performance monitoring.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={getAppUrl(ROUTES.REGISTER)}
                className="font-['Outfit',sans-serif] rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-7 py-3 text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition"
              >
                Create Free Account
              </a>
              <Link
                to={ROUTES.CONTACT}
                className="font-['Outfit',sans-serif] rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-7 py-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition"
              >
                Contact Sales &amp; Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Shared Responsive Footer */}
      <Footer />
    </div>
  );
}
