import { memo, useMemo, useState } from 'react';
import {
  analyzeRedirectChain,
  exportRedirectReport,
  formatDuration,
  getStatusMeta,
  relativeTime,
} from '../redirects.utils';

/* ── Copy Helper ─────────────────────────────────────────────────────────── */

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-[var(--green)]">Copied</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

/* ── Single Hop Card ─────────────────────────────────────────────────────── */

function HopCard({ hop, isLast, totalHops }) {
  const meta = getStatusMeta(hop.statusCode);
  const isFinal = !hop.redirectsTo || isLast;

  let protocol = '';
  try {
    protocol = new URL(hop.url).protocol.replace(':', '').toUpperCase();
  } catch {
    protocol = hop.url.startsWith('https') ? 'HTTPS' : 'HTTP';
  }

  return (
    <div className="relative flex flex-col rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-5 shadow-sm transition hover:border-[var(--border-bright)]">
      {/* Hop Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-3)] font-['Outfit',sans-serif] text-xs font-bold text-[var(--text)]">
            #{hop.hop}
          </span>
          <span
            className="rounded-lg px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-xs font-bold"
            style={{
              backgroundColor: `${meta.color}18`,
              color: meta.color,
              border: `1px solid ${meta.color}40`,
            }}
          >
            {hop.statusCode} {meta.badge}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold ${
              protocol === 'HTTPS'
                ? 'bg-[var(--green-dim)] text-[var(--green)]'
                : 'bg-[var(--orange)]/15 text-[var(--orange)]'
            }`}
          >
            {protocol}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-['JetBrains_Mono',monospace] text-[var(--cyan)]">
            {formatDuration(hop.timeMs)}
          </span>
          {isFinal && (
            <span className="rounded-full bg-[var(--green-dim)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--green)]">
              Final Destination
            </span>
          )}
        </div>
      </div>

      {/* URL Display */}
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="break-all font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)]">
            {hop.url}
          </span>
          <div className="flex-none">
            <CopyButton text={hop.url} />
          </div>
        </div>
        <p className="text-[11px] text-[var(--muted-2)] leading-relaxed">{meta.desc}</p>
      </div>

      {/* Next redirect target if present */}
      {hop.redirectsTo && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--cyan)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-none"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          <span className="text-[11px] text-[var(--muted-2)]">Redirects to:</span>
          <span className="truncate font-['JetBrains_Mono',monospace] text-[11px] text-[var(--cyan)]">
            {hop.redirectsTo}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Redirect Health & SEO Insights ───────────────────────────────────────── */

function RedirectHealthInsights({ chain, inputUrl, finalUrl }) {
  const diagnostics = useMemo(
    () => analyzeRedirectChain(chain, inputUrl, finalUrl),
    [chain, inputUrl, finalUrl],
  );

  if (!diagnostics.length) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="mb-4 font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
        Redirect Diagnostics & SEO Health
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {diagnostics.map((diag, idx) => {
          let badgeColor = 'var(--cyan)';
          if (diag.status === 'pass') badgeColor = 'var(--green)';
          else if (diag.status === 'warn') badgeColor = 'var(--orange)';
          else if (diag.status === 'fail') badgeColor = 'var(--red)';

          return (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-['Outfit',sans-serif] text-xs font-bold text-[var(--text)]">
                    {diag.title}
                  </h4>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: badgeColor,
                      backgroundColor: `${badgeColor}15`,
                    }}
                  >
                    {diag.badge}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--muted-2)] leading-relaxed">{diag.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Result Section (Section 2) ─────────────────────────────────────── */

function RedirectResultSection({ result, isChecking, error, onReRun }) {
  // Active checking state
  if (isChecking) {
    return (
      <section className="fade-up rounded-2xl border border-[var(--border-bright)] bg-[var(--surface)] p-8 shadow-[var(--hero-shadow)] sm:p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full bg-[var(--cyan)]/20" />
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
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>
          <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)]">
            Tracing Redirect Chain…
          </h3>
          <p className="mt-2 max-w-sm text-xs text-[var(--muted-2)]">
            Probing HTTP headers, following location directives, and measuring hop-by-hop latency.
          </p>
          <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[var(--bar-track)]">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-[var(--cyan)] to-blue-500 animate-[marquee_2s_linear_infinite]" />
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section role="alert" className="fade-up rounded-2xl border border-[var(--red)]/30 bg-[var(--red)]/10 p-6 text-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[var(--red)] text-black font-bold">
            !
          </span>
          <div className="flex-1">
            <h3 className="font-['Outfit',sans-serif] font-bold text-[var(--text)]">Redirect Trace Failed</h3>
            <p className="mt-1 text-xs text-[var(--muted-2)] leading-relaxed">{error}</p>
            {onReRun && (
              <button
                type="button"
                onClick={onReRun}
                className="mt-3 cursor-pointer rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-3)]"
              >
                Retry Trace
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (!result) {
    return (
      <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)] sm:p-12">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </span>
        <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
          No Redirect Chain Traced
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs text-[var(--muted-2)]">
          Enter any URL above to inspect the complete hop progression, HTTP 301/302 statuses, header location targets, and round-trip response times.
        </p>
      </section>
    );
  }

  const { inputUrl, finalUrl, finalStatus, redirectCount, totalTimeMs, chain, checkedAt } = result;
  const finalMeta = getStatusMeta(finalStatus);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Summary Card ────────────────────────────────────────────────────── */}
      <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md bg-[var(--cyan-dim)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[var(--cyan)]">
                Input
              </span>
              <span className="truncate font-['JetBrains_Mono',monospace] text-sm font-semibold text-[var(--text)]">
                {inputUrl}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${finalMeta.color}18`,
                  color: finalMeta.color,
                  border: `1px solid ${finalMeta.color}40`,
                }}
              >
                Final: {finalStatus} {finalMeta.badge}
              </span>
              <span className="text-xs text-[var(--muted-2)]">
                {redirectCount === 0 ? 'Direct load' : `${redirectCount} redirect hop${redirectCount === 1 ? '' : 's'}`} in{' '}
                <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--cyan)]">
                  {formatDuration(totalTimeMs)}
                </span>{' '}
                ({relativeTime(checkedAt)})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={finalUrl} label="Copy Final URL" />
            <button
              type="button"
              onClick={() => exportRedirectReport(result.raw || result)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export</span>
            </button>
            {onReRun && (
              <button
                type="button"
                onClick={onReRun}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--cyan-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--cyan)] transition hover:bg-[var(--cyan-mid)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>Re-trace</span>
              </button>
            )}
          </div>
        </header>

        {/* Headline Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Redirect Count
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold text-[var(--text)]">
              {redirectCount}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Total Duration
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold text-[var(--cyan)]">
              {formatDuration(totalTimeMs)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Final Status
            </span>
            <p
              className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold"
              style={{ color: finalMeta.color }}
            >
              {finalStatus}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Total Hops
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold text-[var(--text-2)]">
              {chain.length || 1}
            </p>
          </div>
        </div>

        {/* Final Destination Highlight Box */}
        <div className="mt-5 rounded-xl border border-[var(--border-bright)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Final Landing Destination
            </span>
            <CopyButton text={finalUrl} />
          </div>
          <p className="mt-1.5 break-all font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--cyan)]">
            {finalUrl}
          </p>
        </div>

        {/* Hop Progression List */}
        <div className="mt-6 flex flex-col gap-4">
          <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
            Hop-by-Hop Trace Sequence ({chain.length} Step{chain.length === 1 ? '' : 's'})
          </h3>

          <div className="flex flex-col gap-3">
            {chain.map((hop, idx) => (
              <HopCard
                key={idx}
                hop={hop}
                isLast={idx === chain.length - 1}
                totalHops={chain.length}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Redirect Health & SEO Diagnostics ───────────────────────────────── */}
      <RedirectHealthInsights chain={chain} inputUrl={inputUrl} finalUrl={finalUrl} />
    </div>
  );
}

export default memo(RedirectResultSection);
