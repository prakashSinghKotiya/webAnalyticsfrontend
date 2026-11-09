import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { getAppUrl } from '../../utils/subdomainNav';
import { useTheme } from '../../context';
import { Logo, Footer } from '../../components';

/* ------------------------------------------------------------------ */
/* SEO CONFIG – edit the URLs/paths below to match your real routes    */
/* ------------------------------------------------------------------ */
const SITE_URL = 'https://monitormyhost.com';
const PAGE_URL = `${SITE_URL}/about`;
const PAGE_TITLE =
  'About MonitorMyHost – Free Uptime Monitoring, TTFB Test, DNS Lookup & Website Speed Analysis';
const PAGE_DESCRIPTION =
  'MonitorMyHost is a free website uptime monitor and server performance toolkit: multi-location TTFB test, Lighthouse Core Web Vitals report, DNS lookup, redirect checker and WHOIS lookup. No agents, no signup for free tools.';
const PAGE_KEYWORDS =
  'free uptime monitor, website uptime monitoring, uptime robot alternative, free ttfb test, time to first byte test, website speed test, dns lookup, dns checker, lighthouse report, core web vitals checker, redirect checker, whois lookup, server monitoring, website monitoring tool, website down checker';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

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

const stats = [
  { label: 'Global Probe Locations', val: '6+ Regions', sub: 'North America, Europe, Asia-Pacific' },
  { label: 'Uptime Check Interval', val: 'Down to 1m', sub: 'Fast website downtime detection' },
  { label: 'Free Diagnostic Tools', val: '5 Tools', sub: 'TTFB, Lighthouse, DNS, Redirects, WHOIS' },
  { label: 'Agents to Install', val: '0', sub: 'Agentless external monitoring' },
];

// Internal links = strong SEO signal. Adjust `to` paths to your real routes.
const tools = [
  {
    to: '/ttfb-test',
    title: 'Free TTFB Test',
    kw: 'Time to First Byte checker',
    desc: 'Run a free TTFB test from multiple global locations. Measure DNS, TCP, TLS and server response time to find slow origins and weak CDN edges.',
  },
  {
    to: '/lighthouse',
    title: 'Lighthouse & Core Web Vitals Report',
    kw: 'Website speed test',
    desc: 'Get a free Google Lighthouse report for mobile and desktop: LCP, CLS, TBT, SEO, accessibility and best-practice scores for any URL.',
  },
  {
    to: '/dns-lookup',
    title: 'DNS Lookup Tool',
    kw: 'DNS checker',
    desc: 'Free DNS record lookup for A, AAAA, MX, CNAME, TXT, NS and SOA records. Verify propagation, email setup and nameserver health.',
  },
  {
    to: '/redirect-checker',
    title: 'Redirect Checker',
    kw: 'HTTP redirect trace',
    desc: 'Trace 301, 302 and 307 redirect chains hop by hop. Fix redirect loops and slow chains that waste crawl budget and SEO link equity.',
  },
  {
    to: '/whois-lookup',
    title: 'WHOIS Lookup',
    kw: 'Domain WHOIS & expiry',
    desc: 'Look up domain registrar, creation date, expiry date and nameservers to avoid surprise domain expiration.',
  },
];

const pillars = [
  {
    tone: 'cyan',
    title: 'Multi-Location Website Uptime Monitoring',
    desc: 'Independent probes in tier-1 data centers check your site at the same time from several continents. This confirms real outages, filters out false alarms from a single bad route, and shows how your site responds to visitors in each region, without browser cache getting in the way.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    tone: 'green',
    title: 'Instant Downtime Alerts',
    desc: 'Catch server downtime, TLS handshake failures, timeouts and 5xx errors fast. Get notified by email, Slack, PagerDuty or custom webhook so your team can respond before customers or search engines notice.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    tone: 'orange',
    title: 'Core Web Vitals & Lighthouse Analysis',
    desc: 'Lighthouse audits run on mobile and desktop profiles and report Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), Total Blocking Time (TBT), SEO and accessibility issues, so you know exactly what to fix to improve page speed and rankings.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    tone: 'cyan',
    title: 'DNS, Redirect & Domain Diagnostics',
    desc: 'Query authoritative nameservers for A, AAAA, MX, CNAME, TXT, NS and SOA records, trace HTTP redirect chains, and check WHOIS data. Everything you need to troubleshoot DNS propagation, email delivery and migration issues.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
  },
];

const audiences = [
  { title: 'Developers & DevOps teams', desc: 'Monitor APIs, staging and production, and get alerted the moment a deploy breaks something.' },
  { title: 'SEO specialists & agencies', desc: 'Audit TTFB, Core Web Vitals, redirects and DNS for every client site from one place.' },
  { title: 'Ecommerce & SaaS owners', desc: 'Protect revenue by catching downtime and slow pages before they cost you checkouts and signups.' },
  { title: 'Freelancers & webmasters', desc: 'Keep client websites online and prove uptime with clear monitoring history.' },
];

const faqs = [
  {
    q: 'What is MonitorMyHost?',
    a: 'MonitorMyHost is a website uptime monitoring and server performance platform with free online tools. It combines uptime checks, multi-location TTFB testing, Google Lighthouse Core Web Vitals reports, DNS lookup, redirect checking and WHOIS lookup, so you can find and fix website downtime and speed problems quickly.',
  },
  {
    q: 'Is there a free uptime monitor on MonitorMyHost?',
    a: 'Yes. You can create a free account and start monitoring your website uptime, response time and availability. The diagnostic tools (TTFB test, Lighthouse report, DNS lookup, redirect checker and WHOIS lookup) are free to use without signup or a credit card.',
  },
  {
    q: 'Is MonitorMyHost an alternative to UptimeRobot?',
    a: 'MonitorMyHost covers the same core need as tools like UptimeRobot: tracking whether your website is up and alerting you when it is not. It adds multi-location TTFB testing, Lighthouse and Core Web Vitals reports, DNS lookup and redirect tracing in the same platform, which makes it useful if you want uptime and performance analysis together.',
  },
  {
    q: 'What is a TTFB test and how do I test Time to First Byte for free?',
    a: 'Time to First Byte (TTFB) measures how long a browser waits to receive the first byte of a response after requesting a page. Enter your URL into our free TTFB test to see timing from multiple locations, including DNS lookup, connection, TLS and server processing time. As a rule of thumb, Google considers a TTFB under about 800 ms good.',
  },
  {
    q: 'Why does TTFB matter for SEO and Core Web Vitals?',
    a: 'TTFB is not a Core Web Vital itself, but a slow server response delays everything after it, including Largest Contentful Paint (LCP), which is a Core Web Vital and a Google page experience signal. Lowering TTFB with better hosting, caching and a CDN gives crawlers and visitors faster access to your content.',
  },
  {
    q: 'How does multi-location monitoring differ from a simple ping or single-location checker?',
    a: 'A single-location checker can miss regional outages and often hits a cached CDN node. MonitorMyHost tests from probes across North America, Europe and Asia-Pacific, so you see real availability and latency for visitors in different regions and can confirm an outage before alerting you.',
  },
  {
    q: 'Do I need to install an agent or plugin on my server?',
    a: 'No. MonitorMyHost works externally, like a real visitor. There is nothing to install, no root access required, and no performance overhead on your server.',
  },
  {
    q: 'How do I check DNS records and DNS propagation?',
    a: 'Use the free DNS lookup tool: enter your domain and choose a record type such as A, AAAA, MX, CNAME, TXT, NS or SOA. It helps you verify DNS changes, email (MX, SPF, DKIM) records and nameserver configuration after a migration.',
  },
  {
    q: 'How do I find out why my website is slow?',
    a: 'Start with a TTFB test to see whether the server is slow, then run a Lighthouse report to find front-end issues such as large images, render-blocking scripts and layout shifts. Check the redirect chain and DNS timing too, since both add delay before the page starts loading.',
  },
  {
    q: 'How do I get alerted when my website goes down?',
    a: 'Add your URL as a monitor, choose a check interval, and connect alert channels such as email, Slack, PagerDuty or a webhook. You are notified when the site goes down and again when it recovers.',
  },
];

export default function AboutPage() {
  // Title, meta tags, canonical and JSON-LD structured data (no extra dependency).
  useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    setMeta('name', 'description', PAGE_DESCRIPTION);
    setMeta('name', 'keywords', PAGE_KEYWORDS);
    setMeta('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'MonitorMyHost');
    setMeta('property', 'og:title', PAGE_TITLE);
    setMeta('property', 'og:description', PAGE_DESCRIPTION);
    setMeta('property', 'og:url', PAGE_URL);
    setMeta('property', 'og:image', `${SITE_URL}/og-image.png`); // add this image (1200x630)
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', PAGE_TITLE);
    setMeta('name', 'twitter:description', PAGE_DESCRIPTION);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', PAGE_URL);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: 'MonitorMyHost',
          url: SITE_URL,
          logo: `${SITE_URL}/logo.png`,
        },
        {
          '@type': 'WebApplication',
          '@id': `${SITE_URL}/#app`,
          name: 'MonitorMyHost',
          url: SITE_URL,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any (web-based)',
          description: PAGE_DESCRIPTION,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
        {
          '@type': 'AboutPage',
          '@id': `${PAGE_URL}#webpage`,
          url: PAGE_URL,
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          about: { '@id': `${SITE_URL}/#app` },
          isPartOf: { '@type': 'WebSite', url: SITE_URL, name: 'MonitorMyHost' },
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'About', item: PAGE_URL },
          ],
        },
      ],
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'about-jsonld';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      script.remove();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo to={ROUTES.PUBLIC_HOME} />

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-7">
            <Link to={ROUTES.PUBLIC_HOME} className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              Home
            </Link>
            <Link to="/ttfb-test" className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              Free Tools
            </Link>
            <Link to={ROUTES.ABOUT} aria-current="page" className="text-sm font-semibold text-[var(--cyan)]">
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
              Start Free Monitoring
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section (single H1) */}
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface-2)]/30 py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--glow-bg),transparent_70%)]" />
          <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center">
            <span className="font-['JetBrains_Mono',monospace] inline-flex items-center gap-2 rounded-full border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--cyan)]">
              About MonitorMyHost
            </span>
            <h1 className="font-['Outfit',sans-serif] mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.1]">
              Free Website Uptime Monitoring,{' '}
              <span className="bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] bg-clip-text text-transparent">
                TTFB Test &amp; Speed Analysis
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[var(--muted-2)] sm:text-base">
              MonitorMyHost is a website monitoring platform and free toolkit for developers, DevOps teams and SEO professionals. Monitor <strong>website uptime</strong>, run a <strong>free TTFB test</strong>, generate <strong>Lighthouse and Core Web Vitals reports</strong>, and use our <strong>DNS lookup</strong>, <strong>redirect checker</strong> and <strong>WHOIS lookup</strong> to find and fix problems before they hurt your traffic and rankings.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={getAppUrl(ROUTES.REGISTER)}
                className="font-['Outfit',sans-serif] inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-6 py-3 text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition"
              >
                Start Free Uptime Monitoring
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
              <Link
                to="/ttfb-test"
                className="font-['Outfit',sans-serif] inline-flex items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition"
              >
                Run a Free TTFB Test
              </Link>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section aria-label="Platform at a glance" className="border-b border-[var(--border)] bg-[var(--surface)] py-8">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8 text-center">
            {stats.map((s) => (
              <div key={s.label} className="p-2">
                <div className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold text-[var(--cyan)]">{s.val}</div>
                <div className="mt-1 text-xs font-bold text-[var(--text)]">{s.label}</div>
                <div className="font-['JetBrains_Mono',monospace] mt-0.5 text-[10px] text-[var(--muted)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission / keyword-rich intro copy */}
        <section aria-labelledby="mission-heading" className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 id="mission-heading" className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold tracking-tight text-center">
              Why We Built MonitorMyHost
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--muted-2)] sm:text-base">
              <p>
                A website that is down, slow or misconfigured loses visitors, sales and search rankings, often before anyone on the team notices. Most teams end up juggling one tool for an <strong>uptime check</strong>, another for a <strong>website speed test</strong>, and a third for a <strong>DNS lookup</strong>.
              </p>
              <p>
                MonitorMyHost brings <strong>website uptime monitoring</strong>, <strong>server response time (TTFB) testing</strong>, <strong>Google Lighthouse analysis</strong> and <strong>DNS and domain diagnostics</strong> into one agentless platform. Everything runs from external probes, so you see your site the way real users and search engine crawlers do.
              </p>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section aria-labelledby="features-heading" className="border-t border-[var(--border)] py-16 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[var(--cyan)]">
                What You Can Monitor
              </span>
              <h2 id="features-heading" className="font-['Outfit',sans-serif] mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Uptime, Performance and DNS Monitoring in One Platform
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar) => (
                <article key={pillar.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-[var(--border-bright)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--cyan)] mb-4">
                    {pillar.icon}
                  </div>
                  <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] mb-2">{pillar.title}</h3>
                  <p className="text-xs leading-relaxed text-[var(--muted-2)]">{pillar.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Free tools: internal links with keyword anchors */}
        <section aria-labelledby="tools-heading" className="border-t border-[var(--border)] bg-[var(--surface-2)]/30 py-16 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[var(--cyan)]">
                No Signup Required
              </span>
              <h2 id="tools-heading" className="font-['Outfit',sans-serif] mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Free Website Diagnostic Tools
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-[var(--muted-2)]">
                Use our free online tools to test TTFB, analyze page speed, look up DNS records, trace redirects and check domain WHOIS data.
              </p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className="block h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-[var(--border-bright)]"
                  >
                    <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">{t.title}</h3>
                    <p className="font-['JetBrains_Mono',monospace] mt-1 text-[10px] text-[var(--cyan)]">{t.kw}</p>
                    <p className="mt-3 text-xs leading-relaxed text-[var(--muted-2)]">{t.desc}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Who it's for */}
        <section aria-labelledby="audience-heading" className="border-t border-[var(--border)] py-16 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <h2 id="audience-heading" className="font-['Outfit',sans-serif] text-center text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Built for Developers, DevOps, SEO Teams and Site Owners
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {audiences.map((a) => (
                <div key={a.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                  <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">{a.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-2)]">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ (mirrors FAQPage JSON-LD) */}
        <section aria-labelledby="faq-heading" className="border-t border-[var(--border)] py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[var(--cyan)]">
                Knowledge Base
              </span>
              <h2 id="faq-heading" className="font-['Outfit',sans-serif] mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Frequently Asked Questions About Uptime Monitoring, TTFB &amp; DNS
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-[var(--muted-2)]">
                Answers about free uptime monitoring, TTFB testing, Core Web Vitals, DNS lookup and website performance.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                  <h3 className="font-['Outfit',sans-serif] text-sm sm:text-base font-bold text-[var(--text)]">{f.q}</h3>
                  <p className="mt-3 text-xs sm:text-sm leading-6 text-[var(--muted-2)]">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--surface-2)]/40 py-16 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-['Outfit',sans-serif] text-2xl sm:text-4xl font-extrabold tracking-tight">
              Know the Moment Your Website Goes Down
            </h2>
            <p className="mx-auto mt-4 max-w-md text-xs sm:text-sm text-[var(--muted-2)]">
              Start free uptime monitoring in minutes, or try the TTFB test, DNS lookup and Lighthouse report right now without signing up.
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
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
