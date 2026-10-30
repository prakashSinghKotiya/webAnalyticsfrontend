import { memo, useState } from 'react';
import {
  buildTtfbHeadlineAndSubtitle,
  formatMs,
  rateLatency,
  regionLabel,
  relativeTime,
} from '../ttfb.utils';

/* ── Reading Row with Expandable Probe Breakdown ──────────────────────────── */

function RegionReadingRow({ reading, maxLatency, isExpandedByDefault = false }) {
  const [expanded, setExpanded] = useState(isExpandedByDefault);

  const ttfbMs = Number(reading.ttfb ?? reading.ms) || 0;
  const totalMs = Number(reading.totalToFirstByte) || 0;
  // Calculate relative bar width (balanced between 15% and 85%)
  const ratio = maxLatency > 0 ? ttfbMs / maxLatency : 1;
  const barWidth = Math.max(15, Math.min(85, Math.round(ratio * 70)));

  // Detailed timing line 1:
  const line1Parts = [];
  if (reading.dns != null) line1Parts.push(`DNS ${formatMs(reading.dns)}`);
  if (reading.tcp != null) line1Parts.push(`TCP ${formatMs(reading.tcp)}`);
  if (reading.tls != null) line1Parts.push(`TLS ${formatMs(reading.tls)}`);
  if (ttfbMs > 0) line1Parts.push(`TTFB (server) ${formatMs(ttfbMs)}`);
  if (totalMs > 0 && totalMs !== ttfbMs) line1Parts.push(`Total to 1st byte ${formatMs(totalMs)}`);

  const line2Parts = [];
  if (reading.min != null && reading.max != null) {
    line2Parts.push(`Min / max ${formatMs(reading.min)} / ${formatMs(reading.max)}`);
  }
  if (reading.samples != null) {
    line2Parts.push(`${reading.samples} samples`);
  }
  if (reading.reliable != null) {
    line2Parts.push(reading.reliable ? 'reliable' : 'unreliable');
  }
  if (reading.statusCode != null) {
    line2Parts.push(`HTTP ${reading.statusCode}`);
  }

  // Fallbacks if detailed sub-timings were not reported by worker
  const line1 = line1Parts.length > 0
    ? line1Parts.join(' · ')
    : `TTFB ${formatMs(ttfbMs)} · HTTP ${reading.statusCode || 200}`;
  const line2 = line2Parts.length > 0
    ? line2Parts.join(' · ')
    : `Verified via ${regionLabel(reading.region)} edge node`;

  return (
    <div className="py-3 border-b border-[var(--border)]/70 last:border-b-0">
      {/* Row Header: Region Name | Progress Bar | Latency | + / - Toggle */}
      <div
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-3 sm:gap-6 cursor-pointer select-none group"
      >
        {/* Region Name */}
        <span className="w-24 sm:w-32 shrink-0 text-sm font-medium text-[var(--text)] group-hover:text-[var(--cyan)] transition-colors">
          {regionLabel(reading.region)}
        </span>

        {/* Progress Bar Track & Dark Forest Green Fill */}
        <div className="flex-1 h-1.5 w-full bg-[#f0eae1] dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#065f46] dark:bg-[#10b981] transition-all duration-500 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>

        {/* Latency Value */}
        <div className="w-20 sm:w-28 shrink-0 text-right">
          <span className="text-sm font-semibold text-[var(--text)] tabular-nums">
            {formatMs(ttfbMs)}
          </span>
          {totalMs > 0 && totalMs !== ttfbMs && (
            <span className="hidden sm:block text-[10px] text-[var(--muted-2)] tabular-nums">
              tot {formatMs(totalMs)}
            </span>
          )}
        </div>

        {/* Toggle Expander (+ / -) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          className="flex h-5 w-5 shrink-0 items-center justify-center text-xs font-semibold text-[var(--muted-2)] group-hover:text-[var(--text)] transition-colors"
          aria-label={expanded ? 'Collapse probe details' : 'Expand probe details'}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      {/* Expanded Timing Breakdown */}
      {expanded && (
        <div className="mt-2.5 sm:pl-32 sm:pr-32 space-y-1 text-xs text-[var(--muted-2)] leading-relaxed">
          <p>{line1}</p>
          <p>{line2}</p>
        </div>
      )}
    </div>
  );
}

/* ── ResultPanel Component ────────────────────────────────────────────────── */

function ResultPanel({ result, isScanning = false, progress = {}, error = null, onReRun = null }) {
  // Scanning / Loading State
  if (isScanning) {
    const pct = progress.expected
      ? Math.min(100, Math.round((progress.received / progress.expected) * 100))
      : 0;

    return (
      <section className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span
            className="h-5 w-5 flex-none animate-spin rounded-full border-2 border-[var(--cyan)] border-t-transparent"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-['Outfit',sans-serif] text-base font-semibold text-[var(--text)]">
              Probing {progress.expected || 3} edge region{progress.expected === 1 ? '' : 's'}…
            </h3>
            <p className="text-xs text-[var(--muted-2)]">
              {progress.received || 0} of {progress.expected || 3} probe responses received
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

  // Error State
  if (error) {
    return (
      <section className="rounded-3xl border border-[var(--red)]/30 bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-card)]" role="alert">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[var(--red)]/30 bg-[var(--red)]/10 text-sm font-bold text-[var(--red)]">
            !
          </span>
          <div>
            <h3 className="font-['Outfit',sans-serif] text-base font-semibold text-[var(--text)]">
              Measurement failed
            </h3>
            <p className="mt-0.5 text-sm text-[var(--muted-2)]">{error}</p>
            {onReRun && (
              <button
                type="button"
                onClick={onReRun}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-1.5 text-xs font-semibold text-[var(--text)] hover:text-[var(--cyan)]"
              >
                Retry Scan
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Empty State
  if (!result) {
    return (
      <section className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-10 sm:p-12 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h3 className="mt-4 font-['Outfit',sans-serif] text-base font-semibold text-[var(--text)]">
          No measurement yet
        </h3>
        <p className="mt-1 max-w-sm mx-auto text-xs sm:text-sm text-[var(--muted-2)]">
          Enter a URL above and run a scan — real-time latency streams in live from worldwide edge probes.
        </p>
      </section>
    );
  }

  // Normalize readings array
  const readings = Array.isArray(result.readings) ? result.readings : [];
  const validReadings = readings.filter((r) => r && r.ms != null && Number.isFinite(Number(r.ms)));

  // Calculate fastest, slowest, average if not on result
  const fastestReading = [...validReadings].sort((a, b) => Number(a.ms) - Number(b.ms))[0];
  const slowestReading = [...validReadings].sort((a, b) => Number(b.ms) - Number(a.ms))[0];

  const fastestMs = result.fastest != null ? result.fastest : fastestReading?.ms;
  const slowestMs = result.slowest != null ? result.slowest : slowestReading?.ms;
  const avgMs = result.avg != null ? result.avg : fastestMs;

  const fastestRegion = fastestReading?.region;
  const slowestRegion = slowestReading?.region;

  const avgRating = rateLatency(avgMs);
  const maxLatency = Math.max(...validReadings.map((r) => Number(r.ms) || 0), Number(slowestMs) || 1);

  // Dynamic Headline & Subtitle matching Image 1
  const { headline, subtitle } = buildTtfbHeadlineAndSubtitle(
    result.url,
    avgMs,
    validReadings.length || 3,
  );

  // Top meta: "Measured just now · all regions · HTTP 403"
  const relTime = relativeTime(result.createdAt) || 'just now';
  const regionText = regionLabel(result.region || (validReadings.length > 1 ? 'all' : validReadings[0]?.region)).toLowerCase();
  const statusText = result.statusCode ? `HTTP ${result.statusCode}` : 'HTTP 200';
  const topMeta = `Measured ${relTime} · ${regionText} · ${statusText}`;

  return (
    <section className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 sm:p-10 shadow-[var(--shadow-card)]">
      {/* ── Top Meta Line ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-2)]">
        <span>{topMeta}</span>
        {onReRun && (
          <button
            type="button"
            onClick={onReRun}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--text)] hover:border-[var(--border-bright)] hover:text-[var(--cyan)] transition"
            title="Re-run TTFB scan"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Re-test</span>
          </button>
        )}
      </div>

      {/* ── Headline: "chatgpt.com responds fast" ──────────────────────────── */}
      <h2 className="mt-3 font-['Outfit',sans-serif] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
        {headline}
      </h2>

      {/* ── Subtitle: "Average time to first byte is 7 ms — excellent..." ──── */}
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted-2)]">
        {subtitle}
      </p>

      {/* ── 3 Stat Columns (Fastest | Slowest | Average) or (TTFB | Total | Quality) ──── */}
      {validReadings.length === 1 ? (
        <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-10">
          {/* TTFB (Server) */}
          <div>
            <span className="text-xs text-[var(--muted-2)] font-normal">TTFB (Server)</span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
              {formatMs(avgMs)}
            </p>
            <span className="mt-1 inline-block text-xs text-[var(--muted-2)]">
              {regionLabel(validReadings[0]?.region)} probe
            </span>
          </div>

          {/* Total to First Byte */}
          <div>
            <span className="text-xs text-[var(--muted-2)] font-normal">Total to 1st Byte</span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
              {formatMs(validReadings[0]?.totalToFirstByte ?? avgMs)}
            </p>
            <span className="mt-1 inline-block text-xs text-[var(--muted-2)]">
              DNS + TCP + TLS + Wait
            </span>
          </div>

          {/* Rating */}
          <div>
            <span className="text-xs text-[var(--muted-2)] font-normal">Rating</span>
            <p
              className="mt-1 font-['Outfit',sans-serif] text-2xl sm:text-4xl font-bold tracking-tight"
              style={{ color: avgRating.token }}
            >
              {avgRating.label}
            </p>
            <span className="mt-1 inline-block text-xs text-[var(--muted-2)]">
              {validReadings[0]?.statusCode ? `HTTP ${validReadings[0].statusCode}` : 'HTTP 200'}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-10">
          {/* Fastest */}
          <div>
            <span className="text-xs text-[var(--muted-2)] font-normal">Fastest</span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
              {formatMs(fastestMs)}
            </p>
            <span className="mt-1 inline-block text-xs text-[var(--muted-2)]">
              {fastestRegion ? regionLabel(fastestRegion) : 'Fastest node'}
            </span>
          </div>

          {/* Slowest */}
          <div>
            <span className="text-xs text-[var(--muted-2)] font-normal">Slowest</span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
              {formatMs(slowestMs)}
            </p>
            <span className="mt-1 inline-block text-xs text-[var(--muted-2)]">
              {slowestRegion ? regionLabel(slowestRegion) : 'Slowest node'}
            </span>
          </div>

          {/* Average */}
          <div>
            <span className="text-xs text-[var(--muted-2)] font-normal">Average</span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
              {formatMs(avgMs)}
            </p>
            <span className="mt-1 inline-block text-xs text-[var(--muted-2)]" style={{ color: avgRating.token }}>
              {avgRating.label || 'Excellent'}
            </span>
          </div>
        </div>
      )}

      {/* ── "By region" Section Label ──────────────────────────────────────── */}
      <div className="mt-10 mb-2">
        <h3 className="font-['Outfit',sans-serif] text-sm font-semibold text-[var(--text)]">
          By region
        </h3>
      </div>

      {/* ── Region Rows with Forest Green Bars & Accordion Details ─────────── */}
      <div className="divide-y-0">
        {validReadings.map((reading, idx) => (
          <RegionReadingRow
            key={`${result.id || 'ttfb'}-${reading.region || idx}`}
            reading={{
              ...reading,
              statusCode: reading.statusCode || result.statusCode,
            }}
            maxLatency={maxLatency}
            isExpandedByDefault={idx === 0 || reading.region === fastestRegion}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(ResultPanel);
