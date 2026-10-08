import { memo, useCallback } from 'react';
import { useSocket } from '../../../context';
import { DNS_RECORD_ORDER } from '../dns.utils';

const PRESETS = [
  'google.com',
  'cloudflare.com',
  'github.com',
  'wikipedia.org',
  'apple.com',
];

const RECORD_BUTTONS = ['ALL', ...DNS_RECORD_ORDER];

function DnsInputSection({
  domain,
  onDomainChange,
  isScanning,
  onSubmit,
  selectedType = 'ALL',
  onSelectType,
}) {
  const { isConnected } = useSocket();

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!domain.trim() || isScanning) return;
      onSubmit();
    },
    [domain, isScanning, onSubmit],
  );

  return (
    <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
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
              <rect x="2" y="4" width="20" height="7" rx="2" />
              <rect x="2" y="13" width="20" height="7" rx="2" />
              <line x1="6" y1="7.5" x2="6.01" y2="7.5" />
              <line x1="6" y1="16.5" x2="6.01" y2="16.5" />
            </svg>
          </span>
          <div>
            <h1 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)]">
              DNS Record Inspector
            </h1>
            <p className="text-xs text-[var(--muted-2)]">
              Query authoritative DNS records across A, AAAA, MX, TXT, NS, CNAME, SOA, SPF, and CAA
            </p>
          </div>
        </div>

        {/* Live Engine & Resolver Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-2)]">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-[var(--green)]' : 'bg-[var(--orange)] animate-pulse'
              }`}
            />
            <span className="text-[11px] font-medium">{isConnected ? 'Live Resolver' : 'Connecting'}</span>
          </span>

          <span className="rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-3 py-1 text-[11px] font-semibold text-[var(--cyan)]">
            Parallel Query
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
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>

            <input
              type="text"
              value={domain}
              onChange={(e) => onDomainChange(e.target.value)}
              disabled={isScanning}
              placeholder="Enter domain name (e.g. cloudflare.com or google.com)"
              className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-3 pr-10 pl-10 font-['JetBrains_Mono',monospace] text-sm text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--cyan)] focus:ring-2 focus:ring-[var(--cyan-dim)] focus:outline-none disabled:opacity-60"
              autoComplete="off"
              spellCheck="false"
            />

            {domain && !isScanning && (
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
            disabled={!domain.trim() || isScanning}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-blue-500 px-6 py-3 font-['Outfit',sans-serif] text-sm font-semibold text-black shadow-lg shadow-[var(--cyan-dim)] transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>Resolving…</span>
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
                <span>Lookup DNS</span>
              </>
            )}
          </button>
        </div>

        {/* Record Type Quick Selectors Matching Screenshot */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {RECORD_BUTTONS.map((type) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onSelectType?.(type)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 font-['JetBrains_Mono',monospace] text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-[var(--cyan)] text-black shadow-sm'
                    : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)]'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-2)]">
          <span className="font-medium">Quick Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={isScanning}
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

export default memo(DnsInputSection);
