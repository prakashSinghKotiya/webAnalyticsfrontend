import { memo, useCallback, useId } from 'react';
import { ALL_REGIONS, TTFB_REGIONS } from '../../../api/ttfb';

/** `All regions` first, then every individual probe queue. */
const REGION_OPTIONS = Object.freeze([
  { value: ALL_REGIONS, label: `All regions (${TTFB_REGIONS.length} probes)` },
  ...TTFB_REGIONS,
]);

/**
 * UrlForm — controlled, memoized URL + region input.
 *
 * Fully controlled so the parent can prefill it from history without the
 * component holding duplicated state; `memo` keeps keystrokes from re-rendering
 * the results and history panels.
 */
function UrlForm({ url, region, isScanning, onUrlChange, onRegionChange, onSubmit }) {
  const urlId = useId();
  const regionId = useId();

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!isScanning) onSubmit();
    },
    [isScanning, onSubmit],
  );

  const handleUrlChange = useCallback(
    (event) => onUrlChange(event.target.value),
    [onUrlChange],
  );

  const handleRegionChange = useCallback(
    (event) => onRegionChange(event.target.value),
    [onRegionChange],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <label htmlFor={urlId} className="sr-only">
            Target URL
          </label>
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden="true"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </span>
          <input
            id={urlId}
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck="false"
            value={url}
            onChange={handleUrlChange}
            placeholder="example.com"
            disabled={isScanning}
            className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-3.5 pl-12 pr-4 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-bright)] focus:ring-2 focus:ring-[var(--cyan-mid)] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={isScanning}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--cyan)] px-6 py-3.5 font-['Outfit',sans-serif] text-sm font-semibold text-[var(--bg-deep)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isScanning ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--bg-deep)] border-t-transparent"
                aria-hidden="true"
              />
              Measuring…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Measure TTFB
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor={regionId} className="text-xs font-medium text-[var(--muted-2)]">
          Probe region
        </label>
        <select
          id={regionId}
          value={region}
          onChange={handleRegionChange}
          disabled={isScanning}
          className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--border-bright)] focus:ring-2 focus:ring-[var(--cyan-mid)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {REGION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}

export default memo(UrlForm);
