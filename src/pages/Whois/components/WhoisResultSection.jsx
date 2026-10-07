import { memo, useMemo, useState } from 'react';
import {
  analyzeWhoisSecurity,
  calculateDaysRemaining,
  calculateDomainAge,
  exportWhoisReport,
  formatDate,
  parseRdapEvents,
  relativeTime,
} from '../whois.utils';

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

/* ── Whois Security & Health Diagnostics ──────────────────────────────────── */

function WhoisSecurityInsights({ events, nameservers, secureDNS }) {
  const diagnostics = useMemo(
    () => analyzeWhoisSecurity({ events, nameservers, secureDNS }),
    [events, nameservers, secureDNS],
  );

  if (!diagnostics.length) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="mb-4 font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
        Domain Health, Lifecycle & Security Insights
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

function WhoisResultSection({ result, isLookingUp, error, onReRun }) {
  // Active lookup state
  if (isLookingUp) {
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
            Querying ICANN RDAP Registry…
          </h3>
          <p className="mt-2 max-w-sm text-xs text-[var(--muted-2)]">
            Fetching official registrar records, event timestamps, authoritative nameservers, and DNSSEC keys.
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
            <h3 className="font-['Outfit',sans-serif] font-bold text-[var(--text)]">WHOIS Lookup Failed</h3>
            <p className="mt-1 text-xs text-[var(--muted-2)] leading-relaxed">{error}</p>
            {onReRun && (
              <button
                type="button"
                onClick={onReRun}
                className="mt-3 cursor-pointer rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-3)]"
              >
                Retry Lookup
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
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </span>
        <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
          No WHOIS Records Queried
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs text-[var(--muted-2)]">
          Enter a domain name above to inspect official ICANN RDAP registration dates, expiry countdown, DNSSEC signatures, and assigned nameservers.
        </p>
      </section>
    );
  }

  const { domain, events, nameservers, secureDNS, lookedUpAt } = result;
  const { registrationDate, expirationDate, lastChangedDate, transferDate } = parseRdapEvents(events);
  const daysRemaining = calculateDaysRemaining(expirationDate);
  const domainAge = calculateDomainAge(registrationDate);
  const isDnssecSigned = Boolean(secureDNS?.delegationSigned);

  const nsList = Array.isArray(nameservers) ? nameservers : [];

  let expiryStatusColor = 'var(--green)';
  let expiryStatusText = 'Valid & Active';
  if (daysRemaining != null) {
    if (daysRemaining < 0) {
      expiryStatusColor = 'var(--red)';
      expiryStatusText = 'Expired';
    } else if (daysRemaining <= 30) {
      expiryStatusColor = 'var(--red)';
      expiryStatusText = `Expiring Soon (${daysRemaining}d)`;
    } else if (daysRemaining <= 90) {
      expiryStatusColor = 'var(--orange)';
      expiryStatusText = `Renew Soon (${daysRemaining}d)`;
    } else {
      expiryStatusColor = 'var(--green)';
      expiryStatusText = `${daysRemaining} Days Left`;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Summary Card ────────────────────────────────────────────────────── */}
      <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)]">
                {domain}
              </h2>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${expiryStatusColor}18`,
                  color: expiryStatusColor,
                  border: `1px solid ${expiryStatusColor}40`,
                }}
              >
                {expiryStatusText}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-2)]">
              Retrieved via RDAP Protocol ({relativeTime(lookedUpAt)})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={JSON.stringify(result.raw || result, null, 2)} label="Copy All JSON" />
            <button
              type="button"
              onClick={() => exportWhoisReport(result.raw || result)}
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
              Domain Age
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold text-[var(--text)]">
              {domainAge || '—'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Expiry Countdown
            </span>
            <p
              className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold"
              style={{ color: expiryStatusColor }}
            >
              {daysRemaining != null ? `${daysRemaining}d` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Nameservers
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-2xl font-bold text-[var(--cyan)]">
              {nsList.length}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              DNSSEC Security
            </span>
            <p
              className={`mt-1 font-['Outfit',sans-serif] text-xl font-bold ${
                isDnssecSigned ? 'text-[var(--green)]' : 'text-[var(--muted-2)]'
              }`}
            >
              {isDnssecSigned ? 'Signed' : 'Unsigned'}
            </p>
          </div>
        </div>

        {/* 3 Detail Blocks */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Block 1: Registry Lifecycle & Timestamps */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
                Registration Lifecycle
              </h3>
              <span className="rounded bg-[var(--cyan-dim)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[var(--cyan)]">
                Timestamps
              </span>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                <span className="text-[var(--muted-2)]">Registered On:</span>
                <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
                  {formatDate(registrationDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                <span className="text-[var(--muted-2)]">Expires On:</span>
                <span
                  className="font-['JetBrains_Mono',monospace] font-semibold"
                  style={{ color: expiryStatusColor }}
                >
                  {formatDate(expirationDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                <span className="text-[var(--muted-2)]">Last Updated:</span>
                <span className="font-['JetBrains_Mono',monospace] text-[var(--text-2)]">
                  {formatDate(lastChangedDate)}
                </span>
              </div>
              {transferDate && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                  <span className="text-[var(--muted-2)]">Transferred On:</span>
                  <span className="font-['JetBrains_Mono',monospace] text-[var(--text-2)]">
                    {formatDate(transferDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Block 2: Authoritative Nameservers */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
                Authoritative Nameservers ({nsList.length})
              </h3>
              <CopyButton
                text={nsList.map((n) => n?.ldhName || String(n)).join('\n')}
                label="Copy All"
              />
            </div>

            {nsList.length === 0 ? (
              <p className="py-4 text-center text-xs text-[var(--muted-2)] italic">
                No nameservers found in RDAP response.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {nsList.map((ns, idx) => {
                  const nsName = ns?.ldhName || String(ns);
                  return (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
                        <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
                          {nsName}
                        </span>
                      </div>
                      <CopyButton text={nsName} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Block 3: DNSSEC Security Details */}
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
              DNSSEC Zone Delegation
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isDnssecSigned
                  ? 'bg-[var(--green-dim)] text-[var(--green)]'
                  : 'bg-[var(--surface-3)] text-[var(--muted)]'
              }`}
            >
              {isDnssecSigned ? 'Delegation Signed' : 'Delegation Unsigned'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-3">
              <span className="text-[10px] uppercase text-[var(--muted-2)]">Delegation Status:</span>
              <p className="mt-0.5 font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
                {isDnssecSigned ? 'Secure (Signed)' : 'Insecure (Unsigned)'}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-3">
              <span className="text-[10px] uppercase text-[var(--muted-2)]">MaxSigLife:</span>
              <p className="mt-0.5 font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
                {secureDNS?.maxSigLife ?? 'Default / Not Specified'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Whois Security & Lifecycle Diagnostics ───────────────────────────── */}
      <WhoisSecurityInsights
        events={events}
        nameservers={nameservers}
        secureDNS={secureDNS}
      />
    </div>
  );
}

export default memo(WhoisResultSection);
