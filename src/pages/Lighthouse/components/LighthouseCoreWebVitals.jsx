import { memo, useState } from 'react';
import { formatMs } from '../lighthouse.utils';

function VitalPill({ label, p75, rating }) {
  let color = 'var(--muted-2)';
  let bg = 'rgba(148, 153, 168, 0.1)';
  let badgeText = rating || 'N/A';

  const lower = String(rating).toLowerCase();
  if (lower === 'fast' || lower === 'good') {
    color = 'var(--green)';
    bg = 'var(--green-dim)';
    badgeText = 'Good';
  } else if (lower === 'average' || lower === 'needs_improvement') {
    color = 'var(--orange)';
    bg = 'var(--orange-dim)';
    badgeText = 'Needs Work';
  } else if (lower === 'slow' || lower === 'poor') {
    color = 'var(--red)';
    bg = 'rgba(255, 77, 106, 0.12)';
    badgeText = 'Poor';
  }

  const formattedValue =
    p75 != null
      ? label === 'CLS'
        ? Number(p75).toFixed(3)
        : formatMs(p75)
      : '—';

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">{label}</span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color, backgroundColor: bg }}
        >
          {badgeText}
        </span>
      </div>

      <p className="mt-2 font-['JetBrains_Mono',monospace] text-xl font-bold tabular-nums" style={{ color }}>
        {formattedValue}
      </p>

      <span className="mt-1 text-[11px] text-[var(--muted-2)]">75th percentile (p75)</span>
    </div>
  );
}

function LighthouseCoreWebVitals({ coreWebVitals }) {
  const [source, setSource] = useState('page'); // 'page' | 'origin'

  if (!coreWebVitals) return null;

  const currentData = source === 'page' ? coreWebVitals.page : coreWebVitals.origin;
  const hasPageData = Boolean(coreWebVitals.page?.metrics);
  const hasOriginData = Boolean(coreWebVitals.origin?.metrics);

  const overall = currentData?.overall;
  let overallColor = 'var(--muted-2)';
  if (overall === 'FAST') overallColor = 'var(--green)';
  if (overall === 'AVERAGE') overallColor = 'var(--orange)';
  if (overall === 'SLOW') overallColor = 'var(--red)';

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
              Core Web Vitals (Real User Field Data)
            </h2>
            {overall && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{
                  color: overallColor,
                  backgroundColor: `${overallColor}18`,
                  border: `1px solid ${overallColor}40`,
                }}
              >
                {overall}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-2)]">
            Chrome UX Report (CrUX) based on the last 28 days of real-world visitor traffic
          </p>
        </div>

        {/* Source switch: Page vs Origin */}
        <div className="flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1 text-xs">
          <button
            type="button"
            onClick={() => setSource('page')}
            disabled={!hasPageData && hasOriginData}
            className={`cursor-pointer rounded-md px-3 py-1 font-medium transition ${
              source === 'page'
                ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-sm'
                : 'text-[var(--muted-2)] hover:text-[var(--text)]'
            }`}
          >
            URL Data
          </button>
          <button
            type="button"
            onClick={() => setSource('origin')}
            disabled={!hasOriginData && hasPageData}
            className={`cursor-pointer rounded-md px-3 py-1 font-medium transition ${
              source === 'origin'
                ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-sm'
                : 'text-[var(--muted-2)] hover:text-[var(--text)]'
            }`}
          >
            Origin Data
          </button>
        </div>
      </header>

      {!currentData?.metrics ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-8 text-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--muted-2)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-semibold text-[var(--text)]">Insufficient Real User Data</p>
          <p className="mt-1 max-w-md text-xs text-[var(--muted-2)]">
            The Chrome User Experience Report does not have sufficient traffic samples for this specific{' '}
            {source === 'page' ? 'URL' : 'domain origin'} in the last 28 days.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].map((key) => {
            const metric = currentData.metrics[key];
            if (!metric) return null;
            return (
              <VitalPill
                key={key}
                label={key}
                p75={metric.p75}
                rating={metric.rating}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(LighthouseCoreWebVitals);
