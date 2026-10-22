import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { getAppUrl, getLandingUrl } from '../utils/subdomainNav';
import Logo from './Logo';

/**
 * Smart Footer Service Links
 * Direct links for available demo tools; dynamic conversion redirect to register for upcoming/auth features.
 */
const SERVICES_NAV = [
  { name: 'Global TTFB Speed Test', path: '/ttfb-test', isDemo: true },
  { name: 'Lighthouse Performance & SEO', path: '/fullsite-report', isDemo: true },
  { name: 'DNS Record Inspector', path: '/dns-checker', isDemo: true },
  { name: 'Redirect Chain Tracer', path: '/redirection-checker', isDemo: true },
  { name: 'WHOIS Domain Intelligence', path: '/whois-lookup', isDemo: true },
  { name: 'Real-Time Uptime Monitoring', path: ROUTES.REGISTER, isDemo: false, badge: 'App' },
];

const COMPANY_NAV = [
  { name: 'About MonitorMyHost', path: ROUTES.ABOUT, isLink: true },
  { name: 'Platform Capabilities', href: '/#features', internal: true },
  { name: 'Core Diagnostic Tools', href: '/#tools', internal: true },
  { name: 'Pricing Plans', href: '/#pricing', internal: true },
  { name: 'Contact Us', path: ROUTES.CONTACT, isLink: true },
];


const SOCIAL_LINKS = [

  {
    name: 'X (Twitter)',
    href: 'https://twitter.com',
    ariaLabel: 'MonitorMyHost on X (Twitter)',
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },

  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    ariaLabel: 'MonitorMyHost on LinkedIn',
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text)] py-12 lg:py-16 transition-colors">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Main Grid: 5 columns on desktop */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Column 1: Brand & Mission */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-1">
            <Logo to={ROUTES.PUBLIC_HOME} />
            <p className="mt-4 text-xs sm:text-[13px] leading-6 text-[var(--muted-2)] max-w-sm">
              High-precision synthetic uptime monitoring, multi-region TTFB telemetry, and instant website diagnostics. Built for developers who demand zero surprises.
            </p>

            {/* Live Infrastructure Status Pill */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-2)] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--green)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--green)]"></span>
              </span>
              <span>All Systems Operational</span>
              <span className="font-['JetBrains_Mono',monospace] text-[9px] text-[var(--muted)]">· 99.99% SLA</span>
            </div>

            {/* Social Icons */}
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.ariaLabel}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] transition hover:border-[var(--cyan)] hover:bg-[var(--cyan-dim)] hover:text-[var(--cyan)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cyan)]"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Diagnostic & Monitoring Services (Smart Navigation) */}
          <div>
            <h3 className="font-['Outfit',sans-serif] text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-4">
              Services &amp; Tools
            </h3>
            <ul className="space-y-2.5">
              {SERVICES_NAV.map((service) => (
                <li key={service.name}>
                  {service.isDemo ? (
                    <Link
                      to={service.path}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-2)] transition hover:text-[var(--cyan)]"
                    >
                      {service.name}
                    </Link>
                  ) : (
                    <a
                      href={getAppUrl(service.path)}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-2)] transition hover:text-[var(--cyan)] group"
                    >
                      <span>{service.name}</span>
                      {service.badge && (
                        <span className="font-['JetBrains_Mono',monospace] rounded-sm bg-[var(--cyan-dim)] px-1.5 py-0.2 text-[9px] font-semibold text-[var(--cyan)] border border-[var(--cyan-mid)]">
                          {service.badge}
                        </span>
                      )}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="font-['Outfit',sans-serif] text-xs font-bold uppercase tracking-wider text-[var(--text)] mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {COMPANY_NAV.map((item) => (
                <li key={item.name}>
                  {item.isLink ? (
                    <Link
                      to={item.path}
                      className="text-xs text-[var(--muted-2)] transition hover:text-[var(--cyan)]"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-xs text-[var(--muted-2)] transition hover:text-[var(--cyan)]"
                    >
                      {item.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>



         
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 sm:flex-row text-center sm:text-left">
          <p className="font-['JetBrains_Mono',monospace] text-[11px] leading-5 text-[var(--muted)]">
            &copy; 2026 MonitorMyHost. Built for developers and infrastructure teams who care about uptime and speed.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-[var(--muted)] font-['JetBrains_Mono',monospace]">
         
          </div>
        </div>
      </div>
    </footer>
  );
}
