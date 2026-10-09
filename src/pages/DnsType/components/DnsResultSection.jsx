import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import {
  DNS_RECORD_ORDER,
  RECORD_METADATA,
  exportDnsReport,
  extractAllRecordTypes,
  formatDuration,
  formatHostmaster,
  formatSecondsToTime,
  getFlagEmoji,
  relativeTime,
  resolveHostIp,
} from '../dns.utils';

/* ── 1-Click Clipboard Copy Helper ───────────────────────────────────────── */

function CopyButton({ text, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)] ${className}`}
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

/* ── MX Record Table View (Expanded Dropdown) ────────────────────────────── */

function MxRecordView({ records = [], hostname = '', extraIps = {} }) {
  if (!records.length) {
    return <EmptyRecordNotice type="MX" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Table Header on Desktop */}
      <div className="hidden grid-cols-12 items-center gap-3 border-b border-[var(--border)] pb-2 text-[11px] font-semibold tracking-wider text-[var(--muted-2)] uppercase sm:grid">
        <div className="col-span-2">Priority</div>
        <div className="col-span-4">Host / Mail Server</div>
        <div className="col-span-2">IP Address</div>
        <div className="col-span-2">TTL</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="flex flex-col divide-y divide-[var(--border)]">
        {records.map((item, idx) => {
          const resolvedIpInfo = extraIps[item.exchange];
          const displayIp = item.ip || resolvedIpInfo?.ip || '';
          const displayCountry = item.country || resolvedIpInfo?.country || { flag: '🇺🇸', code: 'US' };

          return (
            <div
              key={idx}
              className="flex flex-col gap-2.5 py-3 text-xs sm:grid sm:grid-cols-12 sm:items-center sm:gap-3"
            >
              {/* Priority & Mobile TTL */}
              <div className="col-span-2 flex items-center justify-between gap-2 sm:justify-start">
                <div className="flex items-center gap-2">
                  <span className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--cyan)]">
                    {item.priority ?? 10}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--muted-2)] sm:hidden">Priority</span>
                </div>
                {/* Mobile TTL Tag */}
                <div className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] sm:hidden">
                  <span className="font-bold uppercase text-[var(--cyan)]">TTL:</span>
                  <span className="font-semibold text-[var(--text)]">{item.ttl ? `${item.ttl}s` : '300s'}</span>
                </div>
              </div>

              {/* Host / Exchange */}
              <div className="col-span-4 flex items-center justify-between gap-2 min-w-0 sm:justify-start">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-medium text-[var(--muted-2)] sm:hidden">Host:</span>
                  <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)] truncate">
                    {item.exchange || item.host || String(item)}
                  </span>
                </div>
                <CopyButton text={item.exchange || item.host} label="Copy" className="sm:hidden flex-none" />
              </div>

              {/* IP Address with Flag */}
              <div className="col-span-2 flex items-center gap-2">
                {displayIp ? (
                  <div className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace]">
                    <span className="text-sm" title={displayCountry.name || 'Country'}>
                      {displayCountry.flag || getFlagEmoji(displayCountry.code)}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--muted-2)] sm:hidden">IP:</span>
                    <span className="font-semibold text-[var(--text)] break-all">{displayIp}</span>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--muted-2)] italic">Resolving IP…</span>
                )}
              </div>

              {/* TTL (Desktop only) */}
              <div className="hidden col-span-2 font-['JetBrains_Mono',monospace] text-[var(--muted-2)] sm:block">
                {item.ttl ? `${item.ttl}s` : '300s'}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex flex-wrap items-center justify-start sm:justify-end gap-1.5 sm:gap-2 pt-1 sm:pt-0">
                {displayIp && <CopyButton text={displayIp} label="Copy IP" />}
                <CopyButton text={item.exchange || item.host} label="Copy Host" className="hidden sm:inline-flex" />
                {displayIp && (
                  <Link
                    to={`${ROUTES.WHOIS}?domain=${encodeURIComponent(displayIp)}`}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
                    title="Lookup IP ownership"
                  >
                    IP Whois
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── A / AAAA Record Table View (Expanded Dropdown) ───────────────────────── */

function AddressRecordView({ type = 'A', records = [], hostname = '' }) {
  if (!records.length) {
    return <EmptyRecordNotice type={type} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden grid-cols-12 items-center gap-3 border-b border-[var(--border)] pb-2 text-[11px] font-semibold tracking-wider text-[var(--muted-2)] uppercase sm:grid">
        <div className="col-span-3">Host</div>
        <div className="col-span-4">{type === 'A' ? 'IPv4 Address' : 'IPv6 Address'}</div>
        <div className="col-span-2">TTL</div>
        <div className="col-span-3 text-right">Actions</div>
      </div>

      <div className="flex flex-col divide-y divide-[var(--border)]">
        {records.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-2.5 py-3 text-xs sm:grid sm:grid-cols-12 sm:items-center sm:gap-3"
          >
            {/* Host & Mobile TTL */}
            <div className="col-span-3 flex items-center justify-between gap-2 min-w-0 sm:justify-start">
              <div className="flex items-center gap-1.5 min-w-0 font-['JetBrains_Mono',monospace]">
                <span className="text-[11px] font-medium text-[var(--muted-2)] sm:hidden">Host:</span>
                <span className="font-semibold text-[var(--text)] truncate">{item.host || hostname || '@'}</span>
              </div>
              {/* Mobile TTL Tag */}
              <div className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] sm:hidden flex-none">
                <span className="font-bold uppercase text-[var(--cyan)]">TTL:</span>
                <span className="font-semibold text-[var(--text)]">{item.ttl ? `${item.ttl}s` : '300s'}</span>
              </div>
            </div>

            <div className="col-span-4 flex items-center gap-2 font-['JetBrains_Mono',monospace]">
              {type === 'A' && (
                <span className="text-sm" title={item.country?.name || 'Country'}>
                  {item.country?.flag || '🇺🇸'}
                </span>
              )}
              <span className="text-[11px] font-medium text-[var(--muted-2)] sm:hidden">IP:</span>
              <span className="break-all font-semibold text-[var(--text)]">{item.address}</span>
            </div>

            {/* Desktop TTL */}
            <div className="hidden col-span-2 font-['JetBrains_Mono',monospace] text-[var(--muted-2)] sm:block">
              {item.ttl ? `${item.ttl}s` : '300s'}
            </div>

            <div className="col-span-3 flex flex-wrap items-center justify-start sm:justify-end gap-1.5 sm:gap-2 pt-1 sm:pt-0">
              <CopyButton text={item.address} label="Copy IP" />
              {type === 'A' && (
                <Link
                  to={`${ROUTES.WHOIS}?domain=${encodeURIComponent(item.address)}`}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
                >
                  IP Whois
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── CNAME Record View (Expanded Dropdown) ────────────────────────────────── */

function CnameRecordView({ records = [], hostname = '' }) {
  if (!records.length) {
    return <EmptyRecordNotice type="CNAME" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden grid-cols-12 items-center gap-3 border-b border-[var(--border)] pb-2 text-[11px] font-semibold tracking-wider text-[var(--muted-2)] uppercase sm:grid">
        <div className="col-span-4">Host / Alias</div>
        <div className="col-span-4">Canonical Target</div>
        <div className="col-span-2">TTL</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className="flex flex-col divide-y divide-[var(--border)]">
        {records.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-2.5 py-3 text-xs sm:grid sm:grid-cols-12 sm:items-center sm:gap-3"
          >
            {/* Host & Mobile TTL */}
            <div className="col-span-4 flex items-center justify-between gap-2 min-w-0 sm:justify-start">
              <div className="flex items-center gap-1.5 min-w-0 font-['JetBrains_Mono',monospace]">
                <span className="text-[11px] font-medium text-[var(--muted-2)] sm:hidden">Host:</span>
                <span className="text-[var(--text)] font-semibold truncate">{item.host || hostname || '@'}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] sm:hidden flex-none">
                <span className="font-bold uppercase text-[var(--cyan)]">TTL:</span>
                <span className="font-semibold text-[var(--text)]">{item.ttl ? `${item.ttl}s` : '300s'}</span>
              </div>
            </div>

            <div className="col-span-4 break-all font-['JetBrains_Mono',monospace] font-semibold text-[var(--cyan)]">
              <span className="text-[11px] font-medium text-[var(--muted-2)] sm:hidden">Target: </span>
              {item.target}
            </div>

            {/* Desktop TTL */}
            <div className="hidden col-span-2 font-['JetBrains_Mono',monospace] text-[var(--muted-2)] sm:block">
              {item.ttl ? `${item.ttl}s` : '300s'}
            </div>

            <div className="col-span-2 flex items-center justify-start sm:justify-end pt-1 sm:pt-0">
              <CopyButton text={item.target} label="Copy Target" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── NS (Nameserver) Record View (Expanded Dropdown) ──────────────────────── */

function NsRecordView({ records = [], hostname = '' }) {
  if (!records.length) {
    return <EmptyRecordNotice type="NS" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden grid-cols-12 items-center gap-3 border-b border-[var(--border)] pb-2 text-[11px] font-semibold tracking-wider text-[var(--muted-2)] uppercase sm:grid">
        <div className="col-span-3">Host</div>
        <div className="col-span-5">Authoritative Nameserver</div>
        <div className="col-span-2">TTL</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className="flex flex-col divide-y divide-[var(--border)]">
        {records.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-2.5 py-3 text-xs sm:grid sm:grid-cols-12 sm:items-center sm:gap-3"
          >
            {/* Host & Mobile TTL */}
            <div className="col-span-3 flex items-center justify-between gap-2 min-w-0 sm:justify-start">
              <div className="flex items-center gap-1.5 min-w-0 font-['JetBrains_Mono',monospace]">
                <span className="text-[11px] font-medium text-[var(--muted-2)] sm:hidden">Host:</span>
                <span className="text-[var(--text)] font-semibold truncate">{item.host || hostname || '@'}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] sm:hidden flex-none">
                <span className="font-bold uppercase text-[var(--cyan)]">TTL:</span>
                <span className="font-semibold text-[var(--text)]">{item.ttl ? `${item.ttl}s` : '300s'}</span>
              </div>
            </div>

            <div className="col-span-5 flex items-center gap-2 font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)] min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] flex-none" />
              <span className="break-all">{item.nameserver}</span>
            </div>

            {/* Desktop TTL */}
            <div className="hidden col-span-2 font-['JetBrains_Mono',monospace] text-[var(--muted-2)] sm:block">
              {item.ttl ? `${item.ttl}s` : '300s'}
            </div>

            <div className="col-span-2 flex items-center justify-start sm:justify-end pt-1 sm:pt-0">
              <CopyButton text={item.nameserver} label="Copy Nameserver" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SOA (Start of Authority) Record View ─────────────────────────────────── */

function SoaRecordView({ soa }) {
  if (!soa) {
    return <EmptyRecordNotice type="SOA" />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
            Primary Nameserver (MNAME)
          </span>
          {soa.nsname && <CopyButton text={soa.nsname} />}
        </div>
        <p className="mt-1 font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)]">
          {soa.nsname || '—'}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
            Hostmaster / Mailbox (RNAME)
          </span>
          {soa.hostmaster && <CopyButton text={formatHostmaster(soa.hostmaster)} />}
        </div>
        <p className="mt-1 font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)]">
          {formatHostmaster(soa.hostmaster)}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
            Zone Serial Number
          </span>
          {soa.serial != null && <CopyButton text={soa.serial} />}
        </div>
        <p className="mt-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)]">
          {soa.serial ?? '—'}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
          Refresh & Retry Timers
        </span>
        <p className="mt-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)]">
          {formatSecondsToTime(soa.refresh)} / {formatSecondsToTime(soa.retry)}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
          Expire Limit
        </span>
        <p className="mt-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)]">
          {formatSecondsToTime(soa.expire)}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
          Minimum TTL (Negative Cache)
        </span>
        <p className="mt-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)]">
          {formatSecondsToTime(soa.minttl)}
        </p>
      </div>
    </div>
  );
}

/* ── SPF Record View (Extracted from TXT) ─────────────────────────────────── */

function SpfRecordView({ spf }) {
  if (!spf || !spf.raw) {
    return <EmptyRecordNotice type="SPF" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Raw SPF Box */}
      <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--green-dim)] px-2 py-0.5 text-[10px] font-bold text-[var(--green)]">
              SPF Record
            </span>
            <span className="text-[11px] text-[var(--muted-2)]">Sender Policy Framework</span>
          </div>
          <CopyButton text={spf.raw} label="Copy Record" />
        </div>
        <div className="break-all font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)]">
          {spf.raw}
        </div>
      </div>

      {/* Mechanism Breakdown */}
      {spf.mechanisms && spf.mechanisms.length > 0 && (
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[var(--muted-2)] uppercase">
            Parsed Directives & Authorized Mechanisms:
          </span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {spf.mechanisms.map((mech, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace]">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded font-bold text-[10px] ${
                      mech.qualifier === '+'
                        ? 'bg-[var(--green-dim)] text-[var(--green)]'
                        : mech.qualifier === '-'
                          ? 'bg-[var(--red)]/20 text-[var(--red)]'
                          : 'bg-[var(--orange)]/20 text-[var(--orange)]'
                    }`}
                  >
                    {mech.qualifier}
                  </span>
                  <span className="font-semibold text-[var(--text)]">{mech.term}</span>
                </div>
                <span className="text-[10px] text-[var(--muted-2)]">{mech.qualifierDesc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TXT Record View (Expanded Dropdown) ──────────────────────────────────── */

function TxtRecordView({ records = [] }) {
  if (!records.length) {
    return <EmptyRecordNotice type="TXT" />;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {records.map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col justify-between gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 text-xs sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="rounded px-2 py-0.5 font-['Outfit',sans-serif] text-[10px] font-bold"
                style={{
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                  border: `1px solid ${item.color}35`,
                }}
              >
                {item.badge}
              </span>
              <span className="text-[10px] text-[var(--muted-2)]">Entry #{idx + 1}</span>
              {item.ttl && <span className="text-[10px] text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">TTL: {item.ttl}s</span>}
            </div>
            <div className="break-all font-['JetBrains_Mono',monospace] text-[var(--text)]">
              {item.text}
            </div>
          </div>
          <div className="flex flex-none items-center">
            <CopyButton text={item.text} label="Copy Text" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── CAA Record View ──────────────────────────────────────────────────────── */

function CaaRecordView({ records = [] }) {
  if (!records.length) {
    return <EmptyRecordNotice type="CAA" />;
  }

  return (
    <div className="flex flex-col gap-2">
      {records.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-xs"
        >
          <div className="flex items-center gap-2.5 font-['JetBrains_Mono',monospace]">
            <span className="rounded bg-[var(--surface-3)] px-2 py-0.5 text-[10px] font-bold text-[var(--cyan)]">
              {item.critical === 0 ? 'Normal (0)' : 'Critical (128)'}
            </span>
            {item.ttl && <span className="text-[10px] text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">TTL: {item.ttl}s</span>}
            <span className="text-[var(--muted-2)]">{item.tag}:</span>
            <span className="font-semibold text-[var(--text)]">{item.value}</span>
          </div>
          <CopyButton text={item.value} label="Copy" />
        </div>
      ))}
    </div>
  );
}

/* ── Empty Record Notice ─────────────────────────────────────────────────── */

function EmptyRecordNotice({ type }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-3 text-xs text-[var(--muted-2)]">
      <div className="flex items-center gap-2">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--muted)]"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>No {type} records configured for this domain host.</span>
      </div>
      <span className="rounded bg-[var(--surface-3)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
        0 Records
      </span>
    </div>
  );
}

/* ── Dynamic Dispatcher for Dropdown Body ────────────────────────────────── */

function RecordDataDispatcher({ type, recordInfo, hostname, extraIps }) {
  switch (type) {
    case 'MX':
      return <MxRecordView records={recordInfo.data} hostname={hostname} extraIps={extraIps} />;
    case 'A':
      return <AddressRecordView type="A" records={recordInfo.data} hostname={hostname} />;
    case 'AAAA':
      return <AddressRecordView type="AAAA" records={recordInfo.data} hostname={hostname} />;
    case 'CNAME':
      return <CnameRecordView records={recordInfo.data} hostname={hostname} />;
    case 'NS':
      return <NsRecordView records={recordInfo.data} hostname={hostname} />;
    case 'SOA':
      return <SoaRecordView soa={recordInfo.data} />;
    case 'SPF':
      return <SpfRecordView spf={recordInfo.data} />;
    case 'TXT':
      return <TxtRecordView records={recordInfo.data} />;
    case 'CAA':
      return <CaaRecordView records={recordInfo.data} />;
    default:
      if (!recordInfo.data || (Array.isArray(recordInfo.data) && !recordInfo.data.length)) {
        return <EmptyRecordNotice type={type} />;
      }
      return (
        <pre className="max-h-48 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 font-['JetBrains_Mono',monospace] text-xs text-[var(--text-2)]">
          {JSON.stringify(recordInfo.data, null, 2)}
        </pre>
      );
  }
}

/* ── DNS Configuration & Security Insights ───────────────────────────────── */

function DnsHealthInsights({ records }) {
  const insights = useMemo(() => {
    const list = [];
    if (!records) return list;

    // IPv6 Check
    const hasAaaa = records.AAAA?.status === 'found';
    list.push({
      title: 'IPv6 Modern Connectivity',
      status: hasAaaa ? 'pass' : 'warn',
      desc: hasAaaa
        ? 'Domain resolves to AAAA IPv6 addresses for modern dual-stack networks.'
        : 'No AAAA record detected. Domain relies solely on legacy IPv4 routing.',
    });

    // Email Security (SPF) Check
    const txtData = records.TXT?.data || [];
    const hasSpf = Array.isArray(txtData) && txtData.some((t) => String(t).includes('v=spf1'));
    const hasMx = records.MX?.status === 'found';

    if (hasMx) {
      list.push({
        title: 'Email Security (SPF Record)',
        status: hasSpf ? 'pass' : 'fail',
        desc: hasSpf
          ? 'Sender Policy Framework (SPF) detected in TXT records to prevent email spoofing.'
          : 'Mail Exchangers (MX) are active, but no SPF TXT record was found. High risk of spoofing.',
      });
    }

    // Name Server Redundancy
    const nsData = records.NS?.data || [];
    const nsCount = Array.isArray(nsData) ? nsData.length : 0;
    list.push({
      title: 'Nameserver Redundancy',
      status: nsCount >= 2 ? 'pass' : 'warn',
      desc:
        nsCount >= 2
          ? `${nsCount} authoritative nameservers configured for high availability.`
          : 'Single nameserver detected. High risk of downtime if the resolver fails.',
    });

    // CAA SSL/TLS Security
    const hasCaa = records.CAA?.status === 'found';
    list.push({
      title: 'Certificate Authority Authorization (CAA)',
      status: hasCaa ? 'pass' : 'info',
      desc: hasCaa
        ? 'CAA records are active, restricting which Certificate Authorities can issue SSL certs.'
        : 'CAA record not set. Any public Certificate Authority can issue certificates for this domain.',
    });

    return list;
  }, [records]);

  if (!insights.length) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="mb-4 font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
        DNS Configuration & Security Insights
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {insights.map((ins, idx) => {
          let badgeColor = 'var(--cyan)';
          let badgeText = 'Notice';
          if (ins.status === 'pass') {
            badgeColor = 'var(--green)';
            badgeText = 'Passed';
          } else if (ins.status === 'warn') {
            badgeColor = 'var(--orange)';
            badgeText = 'Warning';
          } else if (ins.status === 'fail') {
            badgeColor = 'var(--red)';
            badgeText = 'Action Needed';
          }

          return (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-['Outfit',sans-serif] text-xs font-bold text-[var(--text)]">
                    {ins.title}
                  </h4>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: badgeColor,
                      backgroundColor: `${badgeColor}15`,
                    }}
                  >
                    {badgeText}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted-2)]">{ins.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main DNS Result Section (Exactly Matching DNSChecker Accordion UI) ───── */

function DnsResultSection({
  result,
  isScanning,
  error,
  onReRun,
  selectedType = 'ALL',
  onSelectType,
}) {
  // Map of which record type accordion dropdowns are currently open
  const [openMap, setOpenMap] = useState({ MX: true });
  const [filterType, setFilterType] = useState('ALL'); // ALL | CONFIGURED | specific type
  const [extraIps, setExtraIps] = useState({});

  // Parse all 12 record types
  const parsedRecords = useMemo(() => {
    if (!result?.records) return {};
    return extractAllRecordTypes(result.records, result.hostname || '');
  }, [result]);

  // Set default opened accordion when result loads (MX if available, else first found record)
  useEffect(() => {
    if (!result?.records) return;
    const initialMap = {};
    if (parsedRecords.MX?.count > 0) {
      initialMap.MX = true;
    } else {
      const firstFound = DNS_RECORD_ORDER.find((t) => parsedRecords[t]?.count > 0);
      if (firstFound) {
        initialMap[firstFound] = true;
      }
    }
    setOpenMap(initialMap);
  }, [result, parsedRecords]);

  // React to selectedType changes from the top selector buttons
  useEffect(() => {
    if (selectedType && selectedType !== 'ALL') {
      setFilterType('ALL');
      setOpenMap((prev) => ({
        ...prev,
        [selectedType]: true,
      }));
    }
  }, [selectedType]);

  // Asynchronously resolve MX exchange IPs via Google Public DNS DoH if not already provided
  useEffect(() => {
    if (!parsedRecords.MX?.data?.length) return;
    const missing = parsedRecords.MX.data.filter((item) => item.exchange && !item.ip);
    if (!missing.length) return;

    let isMounted = true;
    missing.forEach(async (item) => {
      const resolved = await resolveHostIp(item.exchange);
      if (resolved && isMounted) {
        setExtraIps((prev) => ({
          ...prev,
          [item.exchange]: resolved,
        }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [parsedRecords.MX]);

  // Toggle single accordion dropdown
  const toggleAccordion = useCallback((type) => {
    setOpenMap((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // Expand / Collapse all
  const handleExpandAll = useCallback(() => {
    const nextMap = {};
    DNS_RECORD_ORDER.forEach((t) => {
      nextMap[t] = true;
    });
    setOpenMap(nextMap);
  }, []);

  const handleCollapseAll = useCallback(() => {
    setOpenMap({});
  }, []);

  // Filtered list of record types
  const visibleTypes = useMemo(() => {
    if (filterType === 'ALL') return DNS_RECORD_ORDER;
    if (filterType === 'CONFIGURED') {
      return DNS_RECORD_ORDER.filter((t) => parsedRecords[t]?.count > 0);
    }
    return DNS_RECORD_ORDER.filter((t) => t === filterType);
  }, [filterType, parsedRecords]);

  // Active scanning state
  if (isScanning) {
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
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
          </div>
          <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)]">
            Querying DNS Nameservers…
          </h3>
          <p className="mt-2 max-w-sm text-xs text-[var(--muted-2)]">
            Resolving A, AAAA, MX, TXT, NS, CNAME, SOA, and SPF records across global authoritative roots.
          </p>
          <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[var(--bar-track)]">
            <div className="h-full w-full animate-[marquee_2s_linear_infinite] rounded-full bg-gradient-to-r from-[var(--cyan)] to-blue-500" />
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
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[var(--red)] font-bold text-black">
            !
          </span>
          <div className="flex-1">
            <h3 className="font-['Outfit',sans-serif] font-bold text-[var(--text)]">DNS Resolution Failed</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-2)]">{error}</p>
            {onReRun && (
              <button
                type="button"
                onClick={onReRun}
                className="mt-3 cursor-pointer rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-3)]"
              >
                Retry Query
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="7" rx="2" />
            <rect x="2" y="13" width="20" height="7" rx="2" />
            <line x1="6" y1="7.5" x2="6.01" y2="7.5" />
            <line x1="6" y1="16.5" x2="6.01" y2="16.5" />
          </svg>
        </span>
        <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
          No DNS Records Queried
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs text-[var(--muted-2)]">
          Enter a domain name above to inspect authoritative IPv4/IPv6 addresses, mail exchange priority, nameserver delegation, and security TXT records.
        </p>
      </section>
    );
  }

  const { hostname, durationMs, resolvedAt, resolver, summary } = result;
  const domainExists = summary?.domainExists !== false;
  const totalFound = summary?.found ?? 0;
  const isAllExpanded = visibleTypes.every((t) => openMap[t]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Main Results Card ────────────────────────────────────────────────── */}
      <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-7">
        {/* Top Header Bar Matching Screenshot ("Result for: domain") */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--muted-2)]">Result for:</span>
              <h2 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--cyan)] break-all">
                {hostname}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  domainExists
                    ? 'bg-[var(--green-dim)] text-[var(--green)]'
                    : 'bg-[var(--red)]/15 text-[var(--red)]'
                }`}
              >
                {domainExists ? 'Active' : 'NXDOMAIN'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted-2)]">
              Resolved in <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--cyan)]">{formatDuration(durationMs)}</span> via {Array.isArray(resolver) ? resolver.join(', ') : resolver} ({relativeTime(resolvedAt)})
            </p>
          </div>

          {/* Action Buttons: Share, New Search, Export, Copy */}
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={JSON.stringify(result.records, null, 2)} label="Copy All JSON" />
            <button
              type="button"
              onClick={() => exportDnsReport(result.raw || result)}
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
                <span>New Search</span>
              </button>
            )}
          </div>
        </header>

        {/* Toolbar: Filter Pills + Expand/Collapse All Toggle */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition ${
                filterType === 'ALL'
                  ? 'bg-[var(--cyan)] text-black'
                  : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)]'
              }`}
            >
              All Record Types ({DNS_RECORD_ORDER.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('CONFIGURED')}
              className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition ${
                filterType === 'CONFIGURED'
                  ? 'bg-[var(--cyan)] text-black'
                  : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)]'
              }`}
            >
              Configured ({totalFound})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isAllExpanded ? handleCollapseAll : handleExpandAll}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform duration-200 ${isAllExpanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span>{isAllExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>
          </div>
        </div>

        {/* ── Collapsible Accordion Dropdown List (Matching Screenshot) ───────── */}
        <div className="flex flex-col gap-2.5">
          {visibleTypes.map((type) => {
            const recordInfo = parsedRecords[type] || {
              type,
              count: 0,
              label: type,
              status: 'not_found',
              data: null,
            };
            const isOpen = Boolean(openMap[type]);
            const hasData = recordInfo.count > 0;
            const meta = RECORD_METADATA[type];

            return (
              <div
                key={type}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] transition-colors hover:border-[var(--border-mid)]"
              >
                {/* Accordion Row Button */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(type)}
                  className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-left transition hover:bg-[var(--surface-3)]/60 focus:outline-none sm:px-5 sm:py-4"
                  aria-expanded={isOpen}
                >
                  {/* Left: Record Type Label (e.g. "A (1 Records)" or "AAAA" or "MX (5 Records)") */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className="font-['Outfit',sans-serif] text-sm font-bold tracking-tight sm:text-base"
                      style={{ color: hasData ? 'var(--text)' : 'var(--muted-2)' }}
                    >
                      {recordInfo.label}
                    </span>
                    {hasData && meta?.badge && (
                      <span
                        className="hidden rounded px-2 py-0.5 font-['Outfit',sans-serif] text-[10px] font-bold sm:inline-flex"
                        style={{
                          backgroundColor: `${meta.color}15`,
                          color: meta.color,
                          border: `1px solid ${meta.color}35`,
                        }}
                      >
                        {meta.badge}
                      </span>
                    )}
                  </div>

                  {/* Right: Chevron Arrow (Points right when collapsed, rotates down when open) */}
                  <div className="flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-[var(--muted)] transition-transform duration-200 ${
                        isOpen ? 'rotate-90 text-[var(--cyan)]' : ''
                      }`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                {/* Dropdown / Accordion Body */}
                {isOpen && (
                  <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                    <RecordDataDispatcher
                      type={type}
                      recordInfo={recordInfo}
                      hostname={hostname}
                      extraIps={extraIps}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── DNS Configuration & Security Insights ───────────────────────────── */}
      <DnsHealthInsights records={result.records} />
    </div>
  );
}

export default memo(DnsResultSection);
