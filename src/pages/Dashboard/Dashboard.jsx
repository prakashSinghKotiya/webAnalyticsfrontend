import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

const TOOLS = [
  { to: ROUTES.TTFB, label: 'TTFB', desc: 'Time-to-first-byte across regions' },
  { to: ROUTES.LIGHTHOUSE, label: 'FullSite Report', desc: 'Performance & quality reports' },
  { to: ROUTES.UPTIME, label: 'Uptime', desc: 'Availability monitoring' },
  { to: ROUTES.WHOIS, label: 'WHOIS', desc: 'Domain ownership lookup' },
  { to: ROUTES.DNS, label: 'DNS', desc: 'Record lookup & validation' },
  { to: ROUTES.REDIRECTS, label: 'Redirects', desc: 'Redirect chain analysis' },
];

/** Dashboard — landing page after login. */
export default function Dashboard() {
  return (
    <section className="fade-up">
      <h1 className="font-['Outfit',sans-serif] mb-1 text-2xl font-bold tracking-tight text-[var(--text)]">
        Dashboard
      </h1>
      <p className="mb-8 text-sm text-[var(--muted-2)]">
        Pick a tool to start measuring your sites.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ to, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 no-underline shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--border-bright)] hover:shadow-[var(--shadow-card-hover)]"
          >
            <h2 className="font-['Outfit',sans-serif] mb-1.5 text-base font-bold text-[var(--text)] group-hover:text-[var(--cyan)]">
              {label}
            </h2>
            <p className="text-sm text-[var(--muted-2)]">{desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
