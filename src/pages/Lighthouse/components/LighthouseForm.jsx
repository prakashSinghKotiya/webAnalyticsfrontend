import { memo, useCallback } from 'react';

const PRESETS = [
  'https://github.com',
  'https://wikipedia.org',
  'https://news.ycombinator.com',
  'https://vercel.com',
];

function LighthouseForm({
  url,
  onUrlChange,
  strategy = 'mobile',
  onStrategyChange,
  isAuditing,
  onSubmit,
}) {
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!url.trim() || isAuditing) return;
      onSubmit();
    },
    [url, isAuditing, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* URL Input */}
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
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            disabled={isAuditing}
            placeholder="Enter web page URL (e.g. https://example.com)"
            className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-3 pr-10 pl-10 font-['JetBrains_Mono',monospace] text-sm text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--cyan)] focus:ring-2 focus:ring-[var(--cyan-dim)] focus:outline-none disabled:opacity-60"
            autoComplete="url"
            spellCheck="false"
          />

          {url && !isAuditing && (
            <button
              type="button"
              onClick={() => onUrlChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted)] hover:text-[var(--text)]"
              aria-label="Clear URL"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Strategy Selector (Mobile / Desktop) */}
        {onStrategyChange && (
          <div className="flex flex-none items-center rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-1">
            <button
              type="button"
              disabled={isAuditing}
              onClick={() => onStrategyChange('mobile')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                strategy === 'mobile'
                  ? 'bg-[var(--cyan)] text-black shadow-sm'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span>Mobile</span>
            </button>
            <button
              type="button"
              disabled={isAuditing}
              onClick={() => onStrategyChange('desktop')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                strategy === 'desktop'
                  ? 'bg-[var(--cyan)] text-black shadow-sm'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Desktop</span>
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!url.trim() || isAuditing}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-blue-500 px-6 py-3 font-['Outfit',sans-serif] text-sm font-semibold text-black shadow-lg shadow-[var(--cyan-dim)] transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAuditing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              <span>Analyzing…</span>
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
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Analyze Page</span>
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
            disabled={isAuditing}
            onClick={() => onUrlChange(preset)}
            className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)] disabled:opacity-50"
          >
            {preset.replace('https://', '')}
          </button>
        ))}
      </div>
    </form>
  );
}

export default memo(LighthouseForm);
