import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] p-6 text-center">
      <p className="font-['JetBrains_Mono',monospace] mb-3 text-sm uppercase tracking-[0.2em] text-[var(--cyan)]">
        404 — Signal lost
      </p>
      <h1 className="font-['Outfit',sans-serif] mb-3 text-6xl font-extrabold tracking-tight text-[var(--text)]">
        Page not found
      </h1>
      <p className="mb-8 max-w-sm text-sm text-[var(--muted-2)]">
        The route you requested doesn&apos;t exist, or it moved. Let&apos;s get you back on track.
      </p>
      <Link
        to={ROUTES.HOME}
        className="font-['Outfit',sans-serif] inline-block rounded-[10px] bg-gradient-to-br from-[var(--cyan)] to-[#0099ff] px-6 py-3 text-sm font-bold text-white no-underline shadow-[0_0_24px_var(--cyan-mid)] transition hover:-translate-y-px"
      >
        Back to home
      </Link>
    </div>
  );
}
