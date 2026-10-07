import { memo, useMemo, useState } from 'react';
import {
  RECORD_METADATA,
  exportDnsReport,
  formatDuration,
  relativeTime,
} from '../dns.utils';

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

/* ── Record Type Item Viewers ────────────────────────────────────────────── */

function RenderRecordData({ type, data }) {
  if (!data) return <span className="text-xs text-[var(--muted-2)]">No data returned</span>;

  // A or AAAA records (array of { address, ttl })
  if (type === 'A' || type === 'AAAA') {
    if (Array.isArray(data)) {
      return (
        <ul className="flex flex-col gap-2">
          {data.map((item, idx) => (
            <li
              key={idx}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
                  {item.address || item}
                </span>
                {item.ttl != null && (
                  <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted-2)]">
                    TTL: {item.ttl}s
                  </span>
                )}
              </div>
              <CopyButton text={item.address || item} label="Copy IP" />
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs">
        <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
          {String(data)}
        </span>
        <CopyButton text={String(data)} />
      </div>
    );
  }

  // MX records (array of { exchange, priority })
  if (type === 'MX') {
    if (Array.isArray(data)) {
      return (
        <ul className="flex flex-col gap-2">
          {data.map((item, idx) => (
            <li
              key={idx}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-[var(--cyan-dim)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[var(--cyan)]">
                  Prio {item.priority ?? 0}
                </span>
                <span className="font-['JetBrains_Mono',monospace] text-[var(--text)]">
                  {item.exchange || String(item)}
                </span>
              </div>
              <CopyButton text={item.exchange || String(item)} />
            </li>
          ))}
        </ul>
      );
    }
  }

  // TXT records (array of strings)
  if (type === 'TXT') {
    if (Array.isArray(data)) {
      return (
        <ul className="flex flex-col gap-2">
          {data.map((item, idx) => (
            <li
              key={idx}
              className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="break-all font-['JetBrains_Mono',monospace] text-[var(--text-2)]">
                {String(item)}
              </span>
              <div className="flex-none">
                <CopyButton text={String(item)} />
              </div>
            </li>
          ))}
        </ul>
      );
    }
  }

  // NS records (array of strings)
  if (type === 'NS') {
    if (Array.isArray(data)) {
      return (
        <ul className="flex flex-col gap-2">
          {data.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
                <span className="font-['JetBrains_Mono',monospace] text-[var(--text)]">
                  {String(item)}
                </span>
              </div>
              <CopyButton text={String(item)} />
            </li>
          ))}
        </ul>
      );
    }
  }

  // CNAME records
  if (type === 'CNAME') {
    const val = Array.isArray(data) ? data.join(', ') : String(data);
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs">
        <span className="font-['JetBrains_Mono',monospace] text-[var(--text)]">{val}</span>
        <CopyButton text={val} />
      </div>
    );
  }

  // SOA record (object)
  if (type === 'SOA' && typeof data === 'object') {
    return (
      <div className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-3 text-xs sm:grid-cols-2">
        <div>
          <span className="text-[10px] uppercase text-[var(--muted-2)]">Primary Nameserver:</span>
          <p className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
            {data.nsname || '—'}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--muted-2)]">Hostmaster:</span>
          <p className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
            {data.hostmaster || '—'}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--muted-2)]">Serial:</span>
          <p className="font-['JetBrains_Mono',monospace] text-[var(--text-2)]">{data.serial ?? '—'}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--muted-2)]">Refresh / Retry:</span>
          <p className="font-['JetBrains_Mono',monospace] text-[var(--text-2)]">
            {data.refresh ?? '—'}s / {data.retry ?? '—'}s
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--muted-2)]">Expire:</span>
          <p className="font-['JetBrains_Mono',monospace] text-[var(--text-2)]">{data.expire ?? '—'}s</p>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--muted-2)]">Minimum TTL:</span>
          <p className="font-['JetBrains_Mono',monospace] text-[var(--text-2)]">{data.minttl ?? '—'}s</p>
        </div>
      </div>
    );
  }

  // CAA records
  if (type === 'CAA' && Array.isArray(data)) {
    return (
      <ul className="flex flex-col gap-2">
        {data.map((item, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace]">
              <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--cyan)]">
                {item.critical === 0 ? 'Normal' : 'Critical'}
              </span>
              <span>
                {item.issue ? `issue "${item.issue}"` : item.issuewild ? `issuewild "${item.issuewild}"` : JSON.stringify(item)}
              </span>
            </div>
            <CopyButton text={JSON.stringify(item)} />
          </li>
        ))}
      </ul>
    );
  }

  // Generic fallback
  return (
    <pre className="max-h-40 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text-2)]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

/* ── Single Record Type Card ─────────────────────────────────────────────── */

function RecordCard({ type, record }) {
  const meta = RECORD_METADATA[type] || {
    name: `${type} Record`,
    desc: 'Domain Name System record type.',
    color: '#00d4ff',
    badge: type,
  };

  const isFound = record?.status === 'found';
  const isNotFound = record?.status === 'not_found';
  const isError = record?.status === 'error';

  return (
    <div
      className={`flex flex-col rounded-xl border p-5 transition ${
        isFound
          ? 'border-[var(--border-mid)] bg-[var(--surface-2)] shadow-sm'
          : 'border-[var(--border)] bg-[var(--surface-2)]/60 opacity-80'
      }`}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="rounded-lg px-2.5 py-1 font-['Outfit',sans-serif] text-xs font-bold"
            style={{
              backgroundColor: `${meta.color}18`,
              color: meta.color,
              border: `1px solid ${meta.color}40`,
            }}
          >
            {type}
          </span>
          <div>
            <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
              {meta.name}
            </h3>
            <p className="text-[11px] text-[var(--muted-2)]">{meta.desc}</p>
          </div>
        </div>

        {/* Status Tag */}
        <div>
          {isFound && (
            <span className="rounded-full bg-[var(--green-dim)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--green)]">
              Configured
            </span>
          )}
          {isNotFound && (
            <span className="rounded-full bg-[var(--surface-3)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted)]">
              Not Configured
            </span>
          )}
          {isError && (
            <span className="rounded-full bg-[var(--red)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--red)]">
              Lookup Error
            </span>
          )}
        </div>
      </header>

      {/* Body Data */}
      <div className="mt-1 flex-1">
        {isFound && <RenderRecordData type={type} data={record.data} />}
        {isNotFound && (
          <p className="py-2 text-xs text-[var(--muted-2)] italic">
            No {type} records found for this domain host.
          </p>
        )}
        {isError && (
          <p className="py-2 text-xs text-[var(--red)]">
            Error resolving {type}: {record.message || record.code || 'Query failed'}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── DNS Health Insights ──────────────────────────────────────────────────── */

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
                <p className="mt-2 text-xs text-[var(--muted-2)] leading-relaxed">{ins.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Result Section (Section 2) ─────────────────────────────────────── */

function DnsResultSection({ result, isScanning, error, onReRun }) {
  const [filter, setFilter] = useState('all'); // all | found | not_found

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
            Resolving A, AAAA, MX, TXT, NS, CNAME, SOA, and CAA records across global authoritative roots.
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
            <h3 className="font-['Outfit',sans-serif] font-bold text-[var(--text)]">DNS Resolution Failed</h3>
            <p className="mt-1 text-xs text-[var(--muted-2)] leading-relaxed">{error}</p>
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

  const { hostname, durationMs, resolvedAt, resolver, summary, records } = result;
  const recordEntries = Object.entries(records || {});

  const filteredEntries = recordEntries.filter(([, rec]) => {
    if (filter === 'found') return rec?.status === 'found';
    if (filter === 'not_found') return rec?.status === 'not_found';
    return true;
  });

  const domainExists = summary?.domainExists !== false;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Summary Card ────────────────────────────────────────────────────── */}
      <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)]">
                {hostname}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  domainExists
                    ? 'bg-[var(--green-dim)] text-[var(--green)]'
                    : 'bg-[var(--red)]/15 text-[var(--red)]'
                }`}
              >
                {domainExists ? 'Active Domain' : 'NXDOMAIN (Not Found)'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-2)]">
              Resolved in <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--cyan)]">{formatDuration(durationMs)}</span> via {Array.isArray(resolver) ? resolver.join(', ') : resolver} ({relativeTime(resolvedAt)})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={JSON.stringify(records, null, 2)} label="Copy All JSON" />
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
                <span>Re-query</span>
              </button>
            )}
          </div>
        </header>

        {/* Headline Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Found Records
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold text-[var(--green)]">
              {summary?.found ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Not Configured
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold text-[var(--muted-2)]">
              {summary?.notFound ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Query Latency
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold text-[var(--cyan)]">
              {formatDuration(durationMs)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Queried Types
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold text-[var(--text)]">
              {recordEntries.length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-3">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-[var(--cyan)] text-black'
                : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)]'
            }`}
          >
            All Types ({recordEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('found')}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === 'found'
                ? 'bg-[var(--cyan)] text-black'
                : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)]'
            }`}
          >
            Configured ({summary?.found ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setFilter('not_found')}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === 'not_found'
                ? 'bg-[var(--cyan)] text-black'
                : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)]'
            }`}
          >
            Not Configured ({summary?.notFound ?? 0})
          </button>
        </div>

        {/* Record Type Cards - Full horizontal width, stacked vertically (up and down) */}
        <div className="mt-6 flex w-full flex-col gap-4">
          {filteredEntries.map(([type, record]) => (
            <RecordCard key={type} type={type} record={record} />
          ))}
        </div>
      </section>

      {/* ── DNS Configuration & Security Insights ───────────────────────────── */}
      <DnsHealthInsights records={records} />
    </div>
  );
}

export default memo(DnsResultSection);
