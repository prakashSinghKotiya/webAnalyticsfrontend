import { memo, useMemo, useState } from 'react';
import {
  buildWhoisSentenceSummary,
  calculateDaysRemaining,
  calculateDomainAge,
  exportWhoisReport,
  extractAbuseInfo,
  extractNameservers,
  extractRegistrarInfo,
  extractStatusList,
  formatEppStatus,
  formatMediumDate,
  generateRawWhoisText,
  parseRdapEvents,
  relativeTime,
} from '../whois.utils';

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
      className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--text)] ${className}`}
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

/* ── Aligned Data Row Matching Design ────────────────────────────────────── */

function DataRow({ label, value, isGreen = false, isMono = false, href = null, copyable = false }) {
  if (value == null) return null;
  const displayVal = String(value).trim();
  if (!displayVal || displayVal === '—' || displayVal === '-' || displayVal === 'null' || displayVal === 'undefined') {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[var(--border)]/70 text-sm">
      <span className="text-[var(--muted-2)] font-normal sm:w-1/3 shrink-0">{label}</span>
      <div className="flex items-center gap-2 sm:justify-end sm:w-2/3">
        {href ? (
          <a
            href={href.startsWith('http') ? href : `https://${href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-[var(--text)] hover:text-[var(--cyan)] hover:underline font-medium"
          >
            {displayVal}
          </a>
        ) : (
          <span
            className={`truncate font-medium ${
              isGreen
                ? 'text-[#059669] dark:text-[#34d399]'
                : isMono
                  ? 'font-["JetBrains_Mono",monospace] text-[var(--text)]'
                  : 'text-[var(--text)]'
            }`}
          >
            {displayVal}
          </span>
        )}
        {copyable && <CopyButton text={displayVal} />}
      </div>
    </div>
  );
}

/* ── Section Title ───────────────────────────────────────────────────────── */

function SectionHeading({ title }) {
  return (
    <h3 className="mt-8 mb-2 font-['Outfit',sans-serif] text-sm font-semibold tracking-tight text-[var(--text)]">
      {title}
    </h3>
  );
}

/* ── Main WhoisResultSection Component ───────────────────────────────────── */

function WhoisResultSection({ result, isLookingUp = false, error = null, onReRun = null, isDemo = false }) {
  const [showRaw, setShowRaw] = useState(false);

  // Parse RDAP payload and extract all intelligence
  const data = useMemo(() => {
    if (!result) return null;
    const raw = result.raw || result.result || result;
    const domainName = (result.domain || raw.domain || raw.domainName || raw.ldhName || '').toLowerCase().trim();
    const events = parseRdapEvents(result.events || raw.events, raw);
    const registrar = extractRegistrarInfo(result);
    const abuse = extractAbuseInfo(result);
    const nameservers = extractNameservers(result);
    const statusList = extractStatusList(result);
    const daysRemaining = calculateDaysRemaining(events.expirationDate);
    const domainAge = calculateDomainAge(events.registrationDate);

    const secureDNS = result.secureDNS || raw.secureDNS;
    const isDnssecSigned = Boolean(secureDNS?.delegationSigned || result.isDnssec || raw.dnssec);

    const sentence = buildWhoisSentenceSummary({
      domainAge,
      registrarName: registrar?.name,
      daysRemaining,
      expirationDate: events.expirationDate,
      statuses: statusList,
      isDnssecSigned,
    });

    const rawText = generateRawWhoisText(result);

    return {
      domainName,
      events,
      registrar,
      abuse,
      nameservers,
      statusList,
      daysRemaining,
      domainAge,
      isDnssecSigned,
      sentence,
      rawText,
      createdAt: result.createdAt || result.updatedAt || raw.createdAt || null,
    };
  }, [result]);

  // Loading State
  if (isLookingUp) {
    return (
      <section className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--cyan)] border-t-transparent" />
          <div>
            <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
              Querying Authoritative RDAP &amp; WHOIS Servers…
            </h3>
            <p className="text-xs text-[var(--muted-2)]">
              Parsing registry events, cryptographic DNSSEC records, and accredited registrar data.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-8 w-2/5 animate-pulse rounded-lg bg-[var(--surface-2)]" />
          <div className="h-4 w-4/5 animate-pulse rounded-md bg-[var(--surface-2)]" />
          <div className="h-4 w-3/5 animate-pulse rounded-md bg-[var(--surface-2)]" />
          <div className="mt-6 divide-y divide-[var(--border)]">
            <div className="h-10 animate-pulse bg-[var(--surface-2)]/40" />
            <div className="h-10 animate-pulse bg-[var(--surface-2)]/40" />
            <div className="h-10 animate-pulse bg-[var(--surface-2)]/40" />
          </div>
        </div>
      </section>
    );
  }

  // Error State
  if (error) {
    return (
      <section className="rounded-3xl border border-[var(--red)]/30 bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--red)]/30 bg-[var(--red)]/10 text-sm font-bold text-[var(--red)]">
            !
          </span>
          <div className="flex-1">
            <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">WHOIS Query Failed</h3>
            <p className="mt-1 text-sm text-[var(--muted-2)]">{error}</p>
            {onReRun && (
              <button
                type="button"
                onClick={onReRun}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
              >
                Retry Lookup
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Idle / Empty State (only when not in demo mode with no result)
  if (!data) {
    return (
      <section className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-10 sm:p-12 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <h3 className="mt-4 font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
          No domain inspected yet
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-[var(--muted-2)] max-w-sm mx-auto">
          Enter a domain name above to inspect registration dates, accredited registrar, and DNSSEC security.
        </p>
      </section>
    );
  }

  const {
    domainName,
    events,
    registrar,
    abuse,
    nameservers,
    statusList,
    domainAge,
    isDnssecSigned,
    sentence,
    rawText,
    createdAt,
  } = data;

  const relTime = relativeTime(createdAt);
  const metaText = `Checked via official RDAP · ${relTime || 'just now'}`;

  // Formatted registrar website
  const regWebsite = registrar?.url
    ? registrar.url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
    : null;

  return (
    <section className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 sm:p-10 shadow-[var(--shadow-card)]">
      {/* ── Top Meta Bar & Action Buttons ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-2)]">
        <span>{metaText}</span>
        <div className="flex items-center gap-2">
          {onReRun && (
            <button
              type="button"
              onClick={onReRun}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--text)] hover:border-[var(--border-bright)] hover:text-[var(--cyan)] transition"
              title="Refresh WHOIS record"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Re-run</span>
            </button>
          )}
          {!isDemo && (
            <button
              type="button"
              onClick={() => exportWhoisReport(result)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--text)] hover:border-[var(--border-bright)] hover:text-[var(--cyan)] transition"
              title="Export WHOIS JSON report"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Domain Title ──────────────────────────────────────────────── */}
      <h2 className="mt-3 font-['Outfit',sans-serif] text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text)] break-all">
        {domainName}
      </h2>

      {/* ── Dynamic Sentence Summary Matching Image 2 ───────────────────────── */}
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted-2)]">
        {sentence.agePart} with {sentence.registrarName}
        {sentence.renewalDays != null && sentence.renewalDate ? (
          <>
            {' '}Renews in{' '}
            <span className="font-semibold text-[#059669] dark:text-[#34d399]">
              {sentence.renewalDays} days
            </span>{' '}
            ({sentence.renewalDate}).
          </>
        ) : null}{' '}
        {sentence.securitySummary}
      </p>

      {/* ── Domain Section ─────────────────────────────────────────────────── */}
      <div className="mt-4">
        <SectionHeading title="Domain" />
        <div className="divide-y-0">
          <DataRow
            label="Registered"
            value={formatMediumDate(events.registrationDate)}
          />
          <DataRow
            label="Expires"
            value={formatMediumDate(events.expirationDate)}
          />
          <DataRow
            label="Last updated"
            value={formatMediumDate(events.lastChangedDate)}
          />
          <DataRow
            label="Age"
            value={domainAge || calculateDomainAge(events.registrationDate)}
          />
          <DataRow
            label="DNSSEC"
            value={isDnssecSigned ? 'Signed' : 'Unsigned'}
            isGreen={isDnssecSigned}
          />
        </div>
      </div>

      {/* ── Registrar Section ──────────────────────────────────────────────── */}
      {(registrar?.name || registrar?.ianaId || regWebsite) && (
        <div className="mt-2">
          <SectionHeading title="Registrar" />
          <div className="divide-y-0">
            <DataRow
              label="Name"
              value={registrar?.name}
              copyable={Boolean(registrar?.name)}
            />
            <DataRow
              label="IANA ID"
              value={registrar?.ianaId}
              isMono={true}
            />
            <DataRow
              label="Website"
              value={regWebsite || registrar?.url}
              href={registrar?.url || (regWebsite ? `https://${regWebsite}` : null)}
            />
          </div>
        </div>
      )}

      {/* ── Name Servers Section ───────────────────────────────────────────── */}
      {nameservers.length > 0 && (
        <div className="mt-2">
          <SectionHeading title="Name Servers" />
          <div className="divide-y-0">
            {nameservers.map((ns, idx) => (
              <DataRow
                key={idx}
                label={idx === 0 ? 'Primary' : `Secondary ${idx}`}
                value={ns}
                isMono={true}
                copyable={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Domain Status (EPP Flags) Section ──────────────────────────────── */}
      {statusList.length > 0 && (
        <div className="mt-2">
          <SectionHeading title="Domain Status" />
          <div className="divide-y-0">
            {statusList.map((st, idx) => {
              const info = formatEppStatus(st);
              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-[var(--border)]/70 text-sm">
                  <span className="text-[var(--muted-2)] font-normal">{info.label}</span>
                  <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)] truncate">
                    {info.raw}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Abuse Contact Section (If Available) ───────────────────────────── */}
      {(abuse?.email || abuse?.phone) && (
        <div className="mt-2">
          <SectionHeading title="Abuse Contact" />
          <div className="divide-y-0">
            <DataRow
              label="Email"
              value={abuse.email}
              href={abuse.email ? `mailto:${abuse.email}` : null}
              copyable={Boolean(abuse.email)}
            />
            <DataRow
              label="Phone"
              value={abuse.phone}
              href={abuse.phone ? `tel:${abuse.phone}` : null}
              copyable={Boolean(abuse.phone)}
            />
          </div>
        </div>
      )}

      {/* ── Collapsible Raw WHOIS / RDAP Output ─────────────────────────────── */}
      {rawText && (
        <div className="mt-8 border-t border-[var(--border)] pt-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowRaw((prev) => !prev)}
              className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--text)] hover:text-[var(--cyan)] transition"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-xs">
                {showRaw ? '−' : '+'}
              </span>
              <span>Raw WHOIS / RDAP output</span>
            </button>
            {showRaw && <CopyButton text={rawText} label="Copy Raw Record" />}
          </div>

          {showRaw && (
            <div className="mt-4 max-h-96 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <pre className="font-['JetBrains_Mono',monospace] text-[11px] leading-relaxed text-[var(--muted-2)] whitespace-pre-wrap break-all select-all">
                {rawText}
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default memo(WhoisResultSection);
