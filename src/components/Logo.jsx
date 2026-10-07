import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';

/**
 * Shared brand logo — always navigates via the router (never raw hrefs).
 */
export default function Logo({ to = ROUTES.HOME }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5 no-underline" aria-label="WebPulse home">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] shadow-[0_0_16px_var(--cyan-mid)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </span>
      <span className="font-['Outfit',sans-serif] text-lg font-bold tracking-tight text-[var(--text)]">
        Web<span className="text-[var(--cyan)]">Pulse</span>
      </span>
    </Link>
  );
}
