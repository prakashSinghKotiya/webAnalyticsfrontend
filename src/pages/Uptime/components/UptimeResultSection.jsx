import { memo } from 'react';
import {
  buildResponseSummary,
  calculateLatencyBreakdown,
  formatCheckedTimestamp,
  formatCreationDate,
  formatMs,
  formatReason,
  getHostname,
  getHttpStatusText,
  getStatusMeta,
  resolveHostingDetails,
} from '../uptime.utils';

/**
 * UptimeResultSection — Displays real-time telemetry matching the exact Uptime Robot design.
 *
 * Implements:
 *  - Header with host, provider & location, status badge, HTTP code badge
 *  - Summary banner ("Responded in 1.36 s (slow) and redirects to another address, which is normal.")
 *  - Two-column metrics grid: SPEED and SERVER
 *  - "Where the time went" multi-segmented timeline bar & legend (DNS, Connecting, Server wait, Download)
 *  - Footer with formatted check timestamp
 *  - Full responsiveness & dark/light theme alignment
 */
function UptimeResultSection({ result: rawResult, activeMonitor }) {
  // Robust unwrapping of real current result or active monitor's last result
  const unwrap = (obj) => (obj && typeof obj === 'object' && obj.result ? obj.result : obj);
  const rawCandidate = rawResult || activeMonitor?.lastResult || activeMonitor?.lastCheck || null;
  const result = unwrap(rawCandidate);

  // If no check has completed yet, show a clean awaiting state (no hardcoded fake data)
  if (!result) {
    const target = activeMonitor?.url ? new URL(activeMonitor.url).hostname : 'Target Domain';
    return (
      <section className="fade-up rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-8 sm:p-12 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--cyan)] border-t-transparent" />
        </div>
        <h3 className="mt-4 font-['Outfit',sans-serif] text-base sm:text-lg font-bold text-[var(--text)]">
          Awaiting First Check for {target}
        </h3>
        <p className="mt-1 max-w-md mx-auto text-xs sm:text-sm text-[var(--muted-2)]">
          The background probe worker is executing diagnostics. Real-time availability, DNS timings, and server response will stream in shortly.
        </p>
      </section>
    );
  }

  const totalMs = Number(
    result.TotalresponseTime ??
    result.responseTime ??
    result.totalResponseTime ??
    0
  );
  const isSlow = totalMs >= 1000 || result.status === 'DEGRADED';
  const meta = getStatusMeta(result.status, totalMs);

  let fallbackHost = 'Target Domain';
  if (activeMonitor?.url) {
    try {
      fallbackHost = new URL(activeMonitor.url).hostname;
    } catch {
      fallbackHost = activeMonitor.url;
    }
  }

  const targetHost = result.checkingFor || (result.url ? getHostname(result.url) : fallbackHost);

  // Resolve hosting info, provider, isp, location and DNS info using backend data
  const {
    rawHostedBy,
    hostedBy: provider,
    isp,
    fullLocation,
    shortLocation,
    dnsInfo,
  } = resolveHostingDetails({ result, activeMonitor, rawResult });

  // HTTP status
  const httpStatus = result.httpStatus || null;
  const httpStatusText = httpStatus ? getHttpStatusText(httpStatus) : '';

  // Timing metrics with fallbacks
  const ttfbMs = result.ttfb ?? result.timeToFirstByte;
  const dnsMs = result.DNSTime ?? result.dnsTime ?? result.dnsLookup;
  const tcpMs =
    result.tcpConnectTime ??
    result.tcpTime ??
    result.tcpConnection ??
    result.tcpConnectionTime ??
    result.connectingTime;

  // Summary and multi-segment timeline calculation
  const summary = buildResponseSummary(result);
  const breakdown = calculateLatencyBreakdown(result);

  const attempts = result.attempts ?? 1;
  const attemptsText = `${attempts} attempt${attempts > 1 ? 's' : ''}`;
  const resultText = formatReason(result.reason);

  return (
    <section className="fade-up rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 sm:p-10 shadow-[var(--shadow-card)] transition">
      {/* ── Top Header Row ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Domain & Host info */}
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-[var(--muted-2)]">
            Checking
          </span>
          <h2
            className="mt-0.5 truncate font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl"
            title={targetHost}
          >
            {targetHost}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-[var(--muted-2)] sm:text-sm">
            <span>Hosted by</span>
            <strong className="font-semibold text-[var(--text)]" title={rawHostedBy || provider}>
              {provider}
            </strong>
            {fullLocation ? (
              <span className="text-[var(--muted-2)]" title={fullLocation}>
                · {fullLocation}
              </span>
            ) : null}
            {(activeMonitor?.createdAt || activeMonitor?.created_at) ? (
              <span className="text-[var(--muted-2)]">
                · Created on{' '}
                <strong className="font-medium text-[var(--text)]">
                  {formatCreationDate(activeMonitor.createdAt || activeMonitor.created_at)}
                </strong>
              </span>
            ) : null}
          </p>
        </div>

        {/* Right: Status Pill & HTTP Pill */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          {/* Status Badge */}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold sm:text-sm"
            style={{
              backgroundColor: meta.bgColor,
              color: meta.color,
              border: `1px solid ${meta.borderColor}`,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: meta.dotColor }}
            />
            <span>{meta.label}</span>
          </span>

          {/* HTTP Status Badge */}
          {httpStatus ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
              <strong className="font-semibold text-[var(--text)]">
                HTTP {httpStatus}
              </strong>
              {httpStatusText ? <span>{httpStatusText}</span> : null}
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Middle Summary Strip ────────────────────────────────────────── */}
      <div className="my-6 border-y border-[var(--border)]/70 py-3 text-xs sm:text-sm text-[var(--muted-2)] leading-relaxed">
        Responded in{' '}
        <strong className="font-semibold text-[var(--text)]">
          {summary.timeText}
        </strong>
        {summary.speedTag}
        {summary.followUp}
      </div>

      {/* ── Two-Column Details Grid (SPEED vs SERVER) ──────────────────── */}
      <div className="my-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
        {/* Column 1: SPEED */}
        <div>
          <h3 className="mb-2 font-['Outfit',sans-serif] text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
            SPEED
          </h3>
          <div className="flex flex-col text-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)]/60 py-2.5">
              <span className="text-[var(--muted-2)]">Total response time</span>
              <span className="font-medium text-[var(--text)]">
                <strong className="font-semibold font-['JetBrains_Mono',monospace]">
                  {formatMs(totalMs)}
                </strong>
                {isSlow && (
                  <span className="ml-1.5 text-xs font-medium text-amber-500">
                    Slow
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--border)]/60 py-2.5">
              <span className="text-[var(--muted-2)]">Time to first byte</span>
              <span className="font-semibold text-[var(--text)] font-['JetBrains_Mono',monospace]">
                {formatMs(ttfbMs)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--border)]/60 py-2.5">
              <span className="text-[var(--muted-2)]">DNS lookup</span>
              <span className="font-semibold text-[var(--text)] font-['JetBrains_Mono',monospace]">
                {formatMs(dnsMs)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--muted-2)]">TCP connection</span>
              <span className="font-semibold text-[var(--text)] font-['JetBrains_Mono',monospace]">
                {formatMs(tcpMs)}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: SERVER */}
        <div>
          <h3 className="mb-2 font-['Outfit',sans-serif] text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
            SERVER
          </h3>
          <div className="flex flex-col text-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)]/60 py-2.5">
              <span className="text-[var(--muted-2)]">IP address</span>
              <span className="font-['JetBrains_Mono',monospace] font-medium text-[var(--text)]">
                {dnsInfo.ip}
                {dnsInfo.family ? (
                  <span className="ml-1.5 text-[11px] text-[var(--muted-2)] font-normal">
                    ({dnsInfo.family})
                  </span>
                ) : null}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--border)]/60 py-2.5">
              <span className="text-[var(--muted-2)]">Internet provider</span>
              <span className="font-medium text-[var(--text)]" title={rawHostedBy || isp}>
                {isp}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--border)]/60 py-2.5">
              <span className="text-[var(--muted-2)]">Location</span>
              <span className="font-medium text-[var(--text)]" title={fullLocation || shortLocation}>
                {shortLocation}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--muted-2)]">Result</span>
              <span className="text-[var(--text)]">
                <strong className="font-semibold capitalize">{resultText}</strong>{' '}
                <span className="text-xs text-[var(--muted-2)] sm:text-sm">
                  {attemptsText}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Where the time went ────────────────────────────────────────── */}
      <div className="mt-8 border-t border-[var(--border)]/60 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-['Outfit',sans-serif] text-xs sm:text-sm font-semibold text-[var(--text)]">
            Where the time went
          </h3>
          <span className="font-['JetBrains_Mono',monospace] text-xs font-medium text-[var(--muted-2)]">
            {formatMs(breakdown.totalMs)} total
          </span>
        </div>

        {/* Multi-segmented timeline progress bar */}
        <div className="flex h-2.5 sm:h-3 w-full overflow-hidden rounded-full bg-[#f0eae1] dark:bg-white/10">
          {breakdown.dnsPct > 0 && (
            <div
              className="bg-[#3b82f6] transition-[width] duration-300"
              style={{
                width: `${breakdown.dnsPct}%`,
                minWidth: breakdown.dns > 0 ? '4px' : '0',
              }}
              title={`DNS lookup: ${Math.round(breakdown.dns)} ms (${breakdown.dnsPct.toFixed(1)}%)`}
            />
          )}
          {breakdown.connectingPct > 0 && (
            <div
              className="bg-[#a855f7] transition-[width] duration-300"
              style={{
                width: `${breakdown.connectingPct}%`,
                minWidth: breakdown.connecting > 0 ? '4px' : '0',
              }}
              title={`Connecting: ${Math.round(breakdown.connecting)} ms (${breakdown.connectingPct.toFixed(1)}%)`}
            />
          )}
          {breakdown.serverWaitPct > 0 && (
            <div
              className="bg-[#059669] transition-[width] duration-300"
              style={{
                width: `${breakdown.serverWaitPct}%`,
                minWidth: breakdown.serverWait > 0 ? '4px' : '0',
              }}
              title={`Server wait: ${Math.round(breakdown.serverWait)} ms (${breakdown.serverWaitPct.toFixed(1)}%)`}
            />
          )}
          {breakdown.downloadPct > 0 && (
            <div
              className="bg-[#eab308] transition-[width] duration-300"
              style={{
                width: `${breakdown.downloadPct}%`,
                minWidth: breakdown.download > 0 ? '4px' : '0',
              }}
              title={`Download: ${Math.round(breakdown.download)} ms (${breakdown.downloadPct.toFixed(1)}%)`}
            />
          )}
        </div>

        {/* Color Legend with exact ms */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--muted-2)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
            <span>
              DNS lookup{' '}
              <strong className="font-semibold text-[var(--text)] font-['JetBrains_Mono',monospace]">
                {Math.round(breakdown.dns)} ms
              </strong>
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#a855f7]" />
            <span>
              Connecting{' '}
              <strong className="font-semibold text-[var(--text)] font-['JetBrains_Mono',monospace]">
                {Math.round(breakdown.connecting)} ms
              </strong>
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#059669]" />
            <span>
              Server wait{' '}
              <strong className="font-semibold text-[var(--text)] font-['JetBrains_Mono',monospace]">
                {Math.round(breakdown.serverWait)} ms
              </strong>
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#eab308]" />
            <span>
              Download{' '}
              <strong className="font-semibold text-[var(--text)] font-['JetBrains_Mono',monospace]">
                {Math.round(breakdown.download)} ms
              </strong>
            </span>
          </span>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="mt-6 border-t border-[var(--border)]/60 pt-4 text-xs text-[var(--muted-2)]">
        <span>{formatCheckedTimestamp(result.timestamp || result.receivedAt || result.checkedAt)}</span>
      </div>
    </section>
  );
}

export default memo(UptimeResultSection);
