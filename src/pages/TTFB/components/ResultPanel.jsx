import { memo } from 'react';
import { formatMs, rateLatency, regionLabel, relativeTime } from '../ttfb.utils';

const CARD = 'rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8';

/** Single headline metric (fastest / slowest / average). */
function StatCard({ label, value, hint, token }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted-2)]">
        {label}
      </p>
      <p
        className="mt-1.5 font-['Outfit',sans-serif] text-2xl font-bold leading-none tabular-nums"
        style={{ color: token }}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 truncate text-xs text-[var(--muted-2)]">{hint}</p> : null}
    </div>
  );
}

/** One probe reading: region, latency and a relative bar. */
function ReadingRow({ region, ms, slowest, statusCode }) {
  const { label, token } = rateLatency(ms);
  const ratio = slowest ? (Number(ms) / slowest) * 100 : 100;
  const width = Math.max(6, Math.min(100, Number.isFinite(ratio) ? ratio : 100));

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_140px]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--text)]">{regionLabel(region)}</p>
        <p className="text-xs" style={{ color: token }}>
          {label}
        </p>
      </div>
      {statusCode ? (
        <span className="rounded-md border border-[var(--border-mid)] bg-[var(--surface)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)]">
          HTTP {statusCode}
        </span>
      ) : <span />}
      <span
        className="font-['JetBrains_Mono',monospace] text-sm font-semibold tabular-nums"
        style={{ color: token }}
      >
        {formatMs(ms)}
      </span>
      <div className="col-span-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bar-track)] sm:col-span-1">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${width}%`, backgroundColor: token }}
        />
      </div>
    </li>
  );
}

/**
 * ResultPanel — the measurement output area.
 *
 * Renders exactly one of four states: idle hint, live scan progress, error, or
 * the full result breakdown. Memoized so typing in the URL field never re-renders
 * it, and so the progress bar only updates while a scan is in flight.
 */
function ResultPanel({ result, isScanning, progress, error }) {
  if (isScanning) {
    const pct = progress.expected
      ? Math.min(100, Math.round((progress.received / progress.expected) * 100))
      : 0;

    return (
      <section className={CARD} aria-live="polite" aria-busy="true">
        <div className="flex items-center gap-3">
          <span
            className="h-5 w-5 flex-none animate-spin rounded-full border-2 border-[var(--cyan)] border-t-transparent"
            aria-hidden="true"
          />
          <div>
            <p className="font-['Outfit',sans-serif] text-sm font-semibold text-[var(--text)]">
              Probing {progress.expected} region{progress.expected === 1 ? '' : 's'}…
            </p>
            <p className="text-xs text-[var(--muted-2)]">
              {progress.received} of {progress.expected} results received
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
          <div
            className="h-full rounded-full bg-[var(--cyan)] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={CARD} role="alert">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[var(--red)]/30 bg-[var(--red)]/10 text-sm font-bold text-[var(--red)]">
            !
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Measurement failed</p>
            <p className="mt-0.5 text-sm text-[var(--muted-2)]">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className={`${CARD} flex flex-col items-center justify-center py-14 text-center`}>
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <polyline points="12 12 18 6" />
          </svg>
        </span>
        <p className="font-['Outfit',sans-serif] text-base font-semibold text-[var(--text)]">
          No measurement yet
        </p>
        <p className="mt-1 max-w-sm text-sm text-[var(--muted-2)]">
          Enter a URL above and run a scan — results stream in live from the probe regions.
        </p>
      </section>
    );
  }

  const readings = result.readings ?? [];
  const fastestRegion = [...readings].sort((a, b) => Number(a.ms) - Number(b.ms))[0]?.region;
  const avgRating = rateLatency(result.avg);

  return (
    <section className={`${CARD} fade-up-delay-1`}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-['Outfit',sans-serif] text-lg font-semibold text-[var(--text)]">
            Measurement result
          </h2>
          <p className="mt-0.5 truncate font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
            {result.url}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {result.statusCode ? (
            <span className={`rounded-full border px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] font-semibold ${
              result.statusCode >= 200 && result.statusCode < 300
                ? 'border-[var(--green)]/30 bg-[var(--green)]/10 text-[var(--green)]'
                : 'border-[var(--orange)]/30 bg-[var(--orange)]/10 text-[var(--orange)]'
            }`}>
              HTTP {result.statusCode}
            </span>
          ) : null}
          <span className="rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--cyan)]">
            {regionLabel(result.region)}
          </span>
          <span className="text-xs text-[var(--muted-2)]">{relativeTime(result.createdAt)}</span>
        </div>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Fastest"
          value={formatMs(result.fastest)}
          hint={fastestRegion ? regionLabel(fastestRegion) : undefined}
          token="var(--green)"
        />
        <StatCard
          label="Slowest"
          value={formatMs(result.slowest)}
          token={rateLatency(result.slowest).token}
        />
        <StatCard
          label="Average"
          value={formatMs(result.avg)}
          hint={avgRating.label}
          token={avgRating.token}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {readings.map((reading) => (
          <ReadingRow
            key={reading.region}
            region={reading.region}
            ms={reading.ms}
            slowest={result.slowest}
            statusCode={reading.statusCode || result.statusCode}
          />
        ))}
      </ul>
    </section>
  );
}

export default memo(ResultPanel);
