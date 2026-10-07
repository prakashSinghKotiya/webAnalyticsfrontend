import { memo } from 'react';

function LighthouseScanningState({ targetUrl, auditStep }) {
  return (
    <div className="fade-up rounded-2xl border border-[var(--border-bright)] bg-[var(--surface)] p-8 shadow-[var(--hero-shadow)] sm:p-12">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Animated Radar Pulse */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute h-full w-full animate-ping rounded-full bg-[var(--cyan)]/20" />
          <div className="absolute h-18 w-18 animate-pulse rounded-full bg-[var(--cyan-dim)]" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[var(--cyan)] to-blue-500 shadow-lg shadow-[var(--cyan-dim)]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-spin"
            >
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
          </div>
        </div>

        <h3 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
          Running Lighthouse Audit…
        </h3>

        {targetUrl && (
          <p className="mt-1.5 max-w-md truncate font-['JetBrains_Mono',monospace] text-xs text-[var(--cyan)]">
            {targetUrl}
          </p>
        )}

        {/* Dynamic active step */}
        <div className="mt-4 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-1.5 text-xs text-[var(--text-2)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--cyan)]" />
          <span>{auditStep || 'Analyzing performance, accessibility, SEO & best practices…'}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[var(--bar-track)]">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-[var(--cyan)] to-blue-500 animate-[marquee_2s_linear_infinite]" />
        </div>

        <p className="mt-4 max-w-sm text-xs text-[var(--muted-2)]">
          Audits typically complete in 15–30 seconds. Real-time updates stream directly via WebSockets.
        </p>
      </div>
    </div>
  );
}

export default memo(LighthouseScanningState);

