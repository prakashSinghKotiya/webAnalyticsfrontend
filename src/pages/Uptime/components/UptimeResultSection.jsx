import { memo } from 'react';
import { formatMs, formatReason, getStatusMeta, parseDnsInfo, relativeTime } from '../uptime.utils';

const CARD =
  'rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8';

/** Stat tile for key metric displays */
function MetricTile({ label, value, hint, color, badge, children }) {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 min-w-0">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[var(--muted-2)] truncate">
            {label}
          </p>
          {badge && (
            <span className="flex-none rounded-md border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] font-bold text-[var(--cyan)]">
              {badge}
            </span>
          )}
        </div>

        {children ? (
          <div className="mt-2 min-w-0">{children}</div>
        ) : (
          <p
            className="mt-1.5 font-['Outfit',sans-serif] text-xl sm:text-2xl font-bold tracking-tight tabular-nums truncate block"
            style={{ color: color || 'var(--text)' }}
            title={typeof value === 'string' ? value : undefined}
          >
            {value}
          </p>
        )}
      </div>

      {hint ? <p className="mt-1.5 truncate text-xs text-[var(--muted-2)]">{hint}</p> : null}
    </div>
  );
}

/**
 * UptimeResultSection — Displays live telemetry of the most recent probe check or selected monitor.
 *
 * Visualizes:
 *  - Real-time status (UP / DEGRADED / DOWN)
 *  - Response code & diagnostic reason
 *  - Total Latency, TTFB, and DNS Lookup duration
 *  - Resolved IP Address and target host
 *  - Live pulse indicator when connected
 */
function UptimeResultSection({ result, activeMonitor, isLive = true }) {
  if (!result) {
    return (
      <section className={`${CARD} fade-up-delay-1`}>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--cyan)] shadow-inner">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h2 className="mt-3 font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            Live Telemetry Standby
          </h2>
          <p className="mt-1 max-w-md text-xs text-[var(--muted-2)]">
            Create or select a monitor below. As background checks run, real-time response times,
            DNS timings, and status events will stream here live.
          </p>
        </div>
      </section>
    );
  }

  const meta = getStatusMeta(result.status);
  const targetHost = result.checkingFor || (activeMonitor?.url ? new URL(activeMonitor.url).hostname : 'Target Endpoint');
  const totalMs = result.TotalresponseTime ?? result.responseTime;

  return (
    <section className={`${CARD} fade-up-delay-1`}>
      {/* Header bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: meta.bgColor, color: meta.color }}
          >
            {meta.isOperational ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </span>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
                {targetHost}
              </h2>
              <span
                className="rounded-full border px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: meta.bgColor,
                  color: meta.color,
                  borderColor: meta.borderColor,
                }}
              >
                {meta.label}
              </span>
            </div>
            <p className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
              {formatReason(result.reason)} {result.httpStatus ? `(HTTP ${result.httpStatus})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)]">
            {isLive && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" />}
            <span>Telemetry updated {relativeTime(result.receivedAt || result.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile
          label="Total Latency"
          value={formatMs(totalMs)}
          hint={totalMs < 300 ? '⚡ Ultra fast' : totalMs < 1000 ? 'Normal speed' : 'Slow response'}
          color={meta.color}
        />
        <MetricTile
          label="TTFB (First Byte)"
          value={formatMs(result.ttfb)}
          hint="Server execution time"
          color="var(--cyan)"
        />
        <MetricTile
          label="DNS Lookup Time"
          value={formatMs(result.DNSTime)}
          hint="Resolver resolution"
          color="var(--orange)"
        />
        {(() => {
          const { ip, family } = parseDnsInfo(result.dnsAddress);
          return (
            <MetricTile
              label="Resolved Host IP"
              badge={family || undefined}
              hint="Target network node"
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span
                  className="font-['JetBrains_Mono',monospace] text-sm sm:text-base font-semibold text-[var(--text)] truncate tracking-tight"
                  title={ip}
                >
                  {ip}
                </span>
              </div>
            </MetricTile>
          );
        })()}
      </div>

      {/* Latency Breakdown Bar */}
      {Number.isFinite(Number(totalMs)) && totalMs > 0 && (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="mb-2 flex items-center justify-between font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
            <span>Latency Breakdown</span>
            <span>{Math.round(totalMs)} ms total</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
            {result.DNSTime != null && (
              <div
                className="bg-[var(--orange)] transition-[width] duration-500"
                style={{ width: `${Math.min(100, (result.DNSTime / totalMs) * 100)}%` }}
                title={`DNS: ${Math.round(result.DNSTime)}ms`}
              />
            )}
            {result.ttfb != null && (
              <div
                className="bg-[var(--cyan)] transition-[width] duration-500"
                style={{ width: `${Math.min(100, (result.ttfb / totalMs) * 100)}%` }}
                title={`TTFB: ${Math.round(result.ttfb)}ms`}
              />
            )}
            <div
              className="bg-[var(--green)] transition-[width] duration-500 flex-1"
              title="Content transfer"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--orange)]" /> DNS Lookup
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--cyan)]" /> TTFB (Server)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--green)]" /> Download & Completion
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(UptimeResultSection);
