import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { getLandingUrl, isLandingSubdomain } from '../utils/subdomainNav';

/**
 * Shared brand logo — navigates to the app home by default or the landing domain for public home.
 */
export default function Logo({ to = ROUTES.HOME }) {
  const content = (
    <>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] shadow-[0_0_16px_var(--cyan-mid)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </span>
      <span className="font-['Outfit',sans-serif] text-base min-[380px]:text-lg font-bold tracking-tight text-[var(--text)]">
        Monitor<span className="text-[var(--cyan)]">MyHost</span>
      </span>
    </>
  );

  if (to === ROUTES.PUBLIC_HOME) {
    if (isLandingSubdomain()) {
      return (
        <Link to="/" className="inline-flex items-center gap-2.5 no-underline" aria-label="MonitorMyHost home">
          {content}
        </Link>
      );
    }
    return (
      <a href={getLandingUrl('/')} className="inline-flex items-center gap-2.5 no-underline" aria-label="MonitorMyHost home">
        {content}
      </a>
    );
  }

  return (
    <Link to={to} className="inline-flex items-center gap-2.5 no-underline" aria-label="MonitorMyHost home">
      {content}
    </Link>
  );
}
