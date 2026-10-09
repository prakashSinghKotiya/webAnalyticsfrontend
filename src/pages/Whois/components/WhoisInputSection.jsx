import { memo, useCallback } from 'react';
import { useSocket } from '../../../context';

const PRESETS = [
  'google.com',
  'cloudflare.com',
  'github.com',
  'apple.com',
  'wikipedia.org',
];

function WhoisInputSection({ domain, onDomainChange, isLookingUp, onSubmit }) {
  const { isConnected } = useSocket();

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!domain.trim() || isLookingUp) return;
      onSubmit();
    },
    [domain, isLookingUp, onSubmit],
  );

  return (
    <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 sm:p-8 shadow-[var(--shadow-card)]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 flex-none items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="font-['Outfit',sans-serif] text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] truncate">
              WHOIS & RDAP Domain Inspector
            </h1>
            <p className="text-xs text-[var(--muted-2)]">
              Inspect authoritative ICANN RDAP registry records: registration dates, expiry health, nameservers, and DNSSEC
            </p>
          </div>
        </div>

        {/* Live Engine Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-2)]">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-[var(--green)]' : 'bg-[var(--orange)] animate-pulse'
              }`}
            />
            <span className="text-[11px] font-medium">{isConnected ? 'Live RDAP Client' : 'Connecting'}</span>
          </span>

          <span className="rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-3 py-1 text-[11px] font-semibold text-[var(--cyan)]">
            ICANN Protocol
          </span>
        </div>
      </header>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--muted)]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>

            <input
              type="text"
              value={domain}
              onChange={(e) => onDomainChange(e.target.value)}
              disabled={isLookingUp}
              placeholder="Enter domain name (e.g. cloudflare.com or google.com)"
              className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-3 pr-10 pl-10 font-['JetBrains_Mono',monospace] text-sm text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--cyan)] focus:ring-2 focus:ring-[var(--cyan-dim)] focus:outline-none disabled:opacity-60"
              autoComplete="off"
              spellCheck="false"
            />

            {domain && !isLookingUp && (
              <button
                type="button"
                onClick={() => onDomainChange('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted)] hover:text-[var(--text)]"
                aria-label="Clear domain input"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!domain.trim() || isLookingUp}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-blue-500 px-6 py-3 font-['Outfit',sans-serif] text-sm font-semibold text-black shadow-lg shadow-[var(--cyan-dim)] transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLookingUp ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>Querying RDAP…</span>
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Lookup Domain</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-2)]">
          <span className="font-medium">Quick Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={isLookingUp}
              onClick={() => onDomainChange(preset)}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)] disabled:opacity-50"
            >
              {preset}
            </button>
          ))}
        </div>
      </form>
    </section>
  );
}

export default memo(WhoisInputSection);
