import { memo, useCallback, useId, useState } from 'react';
import { UPTIME_INTERVALS } from '../../../api/uptime';

/**
 * UptimeInputSection — Controlled, memoized component for configuring and deploying monitors.
 *
 * Designed with modern UX:
 *  - URL input with automatic protocol prefixing
 *  - Interval selector (1m, 5m, 10m, 30m, 1h)
 *  - Quick domain presets for instant testing
 *  - Optimized: typing inside does not cause parent or list re-renders
 */
function UptimeInputSection({ isCreating, onSubmit }) {
  const urlId = useId();
  const intervalId = useId();

  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState('5m');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!url.trim()) {
        setValidationError('Target endpoint or domain is required.');
        return;
      }
      setValidationError('');
      onSubmit(url.trim(), interval);
    },
    [interval, onSubmit, url]
  );

  const handleQuickPreset = (presetUrl) => {
    setUrl(presetUrl);
    setValidationError('');
  };

  return (
    <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-[0_0_16px_var(--cyan-dim)]">
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
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <div>
            <h1 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)]">
              Uptime Monitor
            </h1>
            <p className="text-xs text-[var(--muted-2)]">
              Continuous 24/7 availability testing, latency tracking, and outage detection
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-3 py-1 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--cyan)]">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
          <span>Real-time Cron Scheduler</span>
        </div>
      </header>

      {/* Input Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_auto]">
          {/* Target URL */}
          <div className="relative">
            <label htmlFor={urlId} className="mb-1.5 block text-xs font-medium text-[var(--muted-2)]">
              Target URL or Hostname
            </label>
            <div className="relative flex items-center">
              <span
                className="pointer-events-none absolute left-4 text-[var(--muted)]"
                aria-hidden="true"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <input
                id={urlId}
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck="false"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="https://api.yourdomain.com/health"
                disabled={isCreating}
                className={`w-full rounded-xl border bg-[var(--surface-2)] py-3 pl-12 pr-4 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--cyan-mid)] disabled:cursor-not-allowed disabled:opacity-60 ${
                  validationError
                    ? 'border-[var(--red)] focus:border-[var(--red)]'
                    : 'border-[var(--border-mid)] focus:border-[var(--border-bright)]'
                }`}
              />
            </div>
            {validationError ? (
              <p role="alert" className="mt-1 text-xs text-[var(--red)]">
                {validationError}
              </p>
            ) : null}
          </div>

          {/* Check Frequency */}
          <div>
            <label htmlFor={intervalId} className="mb-1.5 block text-xs font-medium text-[var(--muted-2)]">
              Check Frequency
            </label>
            <select
              id={intervalId}
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              disabled={isCreating}
              className="w-full cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-3 px-3.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--border-bright)] focus:ring-2 focus:ring-[var(--cyan-mid)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {UPTIME_INTERVALS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Action */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[#0099ff] px-6 py-3 font-['Outfit',sans-serif] text-sm font-bold text-white shadow-[0_0_20px_var(--cyan-mid)] transition hover:-translate-y-0.5 hover:shadow-[0_0_28px_var(--cyan-mid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isCreating ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                  <span>Scheduling…</span>
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
                    aria-hidden="true"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Start Monitoring</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <span>Quick presets:</span>
          {['https://google.com', 'https://github.com', 'https://api.github.com'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleQuickPreset(preset)}
              className="cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
            >
              {preset}
            </button>
          ))}
        </div>
      </form>
    </section>
  );
}

export default memo(UptimeInputSection);
