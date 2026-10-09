import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import {
  calculateDaysRemaining,
  calculateDomainAge,
  cleanNameserverString,
  cleanStatusString,
  exportWhoisReport,
  extractNameservers,
  extractRegistrarInfo,
  extractStatusList,
  extractStructuredContacts,
  formatCleanDate,
  generateRawWhoisText,
  parseRdapEvents,
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

/* ── Destructured Field Row ──────────────────────────────────────────────── */

function WhoisField({ label, value, isMono = true, copyable = true }) {
  const displayVal = value && String(value).trim() ? String(value).trim() : '—';
  const hasValue = displayVal !== '—';
  const isUrl = hasValue && /^https?:\/\//i.test(displayVal);
  const isEmail = hasValue && /^[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(displayVal);
  const isPhone = hasValue && !isUrl && !isEmail && /^\+?[\d\s\-().]{7,}$/.test(displayVal);

  return (
    <div className="group flex flex-col py-2.5 border-b border-[var(--border)] last:border-b-0 min-w-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
        {label}:
      </span>
      <div className="mt-1 flex items-start sm:items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          {isUrl ? (
            <a
              href={displayVal}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-semibold text-[var(--cyan)] hover:underline break-all"
              title={displayVal}
            >
              {displayVal}
            </a>
          ) : isEmail ? (
            <a
              href={`mailto:${displayVal}`}
              className="text-xs sm:text-sm font-semibold text-[var(--cyan)] hover:underline break-all font-['JetBrains_Mono',monospace]"
            >
              {displayVal}
            </a>
          ) : isPhone ? (
            <a
              href={`tel:${displayVal.replace(/[^\d+]/g, '')}`}
              className="text-xs sm:text-sm font-semibold text-[var(--text)] hover:text-[var(--cyan)] transition break-all font-['JetBrains_Mono',monospace]"
            >
              {displayVal}
            </a>
          ) : (
            <span
              className={`text-xs sm:text-sm font-semibold text-[var(--text)] break-all sm:break-words ${
                isMono ? "font-['JetBrains_Mono',monospace]" : "font-['Outfit',sans-serif]"
              }`}
            >
              {displayVal}
            </span>
          )}
        </div>

        {copyable && hasValue && (
          <CopyButton text={displayVal} className="opacity-75 group-hover:opacity-100 flex-none self-start sm:self-center" />
        )}
      </div>
    </div>
  );
}

/* ── Section 1: Domain Information Card ─────────────────────────────────── */

function DomainInfoCard({
  domain,
  registryDomainId,
  registrationDate,
  expirationDate,
  lastChangedDate,
  domainAge,
  daysRemaining,
  dnssecStatus,
  statuses = [],
  nameServers = [],
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--cyan-dim)] text-[var(--cyan)] text-sm">
            🌐
          </span>
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            Domain Information
          </h3>
        </div>
        {daysRemaining != null && (
          <span className="font-['JetBrains_Mono',monospace] text-[11px] font-semibold text-[var(--cyan)]">
            {daysRemaining > 0 ? `${daysRemaining}d remaining` : 'Expired'}
          </span>
        )}
      </div>

      <div className="divide-y divide-[var(--border)]">
        <WhoisField label="Domain" value={domain} />
        {registryDomainId && <WhoisField label="Registry Domain ID" value={registryDomainId} />}
        <WhoisField label="Registered On" value={formatCleanDate(registrationDate)} />
        <WhoisField label="Expires On" value={formatCleanDate(expirationDate)} />
        <WhoisField label="Updated On" value={formatCleanDate(lastChangedDate)} />
        {domainAge && <WhoisField label="Domain Age" value={domainAge} isMono={false} />}
        {dnssecStatus && <WhoisField label="DNSSEC" value={dnssecStatus} isMono={false} />}

        {/* Status List */}
        <div className="py-2.5 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
              Status:
            </span>
            {statuses.length > 0 && (
              <CopyButton text={statuses.join('\n')} label="Copy All" />
            )}
          </div>
          <div className="mt-2 space-y-1.5">
            {statuses.length > 0 ? (
              statuses.map((st, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-['JetBrains_Mono',monospace] text-[var(--text)] break-all">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--green)]" />
                  <span>{st}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
                active
              </span>
            )}
          </div>
        </div>

        {/* Name Servers List */}
        <div className="py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
              Name Servers:
            </span>
            {nameServers.length > 0 && (
              <CopyButton text={nameServers.join('\n')} label="Copy All" />
            )}
          </div>
          <div className="mt-2 space-y-1.5">
            {nameServers.length > 0 ? (
              nameServers.map((ns, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-3)] px-3 py-2 text-xs font-['JetBrains_Mono',monospace]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--cyan)]" />
                    <span className="truncate break-all text-[var(--text)]">{ns}</span>
                  </div>
                  <CopyButton text={ns} className="flex-none" />
                </div>
              ))
            ) : (
              <span className="text-xs text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
                —
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section 2: Registrar Information Card ───────────────────────────────── */

function RegistrarInfoCard({ registrar }) {
  const r = registrar || {};

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--cyan-dim)] text-[var(--cyan)] text-sm">
            🏢
          </span>
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            Registrar Information
          </h3>
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        <WhoisField label="Registrar" value={r.name || '—'} isMono={false} />
        <WhoisField label="IANA ID" value={r.ianaId || '—'} />
        <WhoisField label="Email" value={r.email || r.abuseEmail || '—'} />
        <WhoisField label="Abuse Email" value={r.abuseEmail || r.email || '—'} />
        <WhoisField label="Abuse Phone" value={r.abusePhone || '—'} />
        {r.whoisServer && <WhoisField label="WHOIS Server" value={r.whoisServer} />}
        {r.url && <WhoisField label="Registrar URL" value={r.url} />}
      </div>
    </div>
  );
}

/* ── Sections 3 & 4: Contact Card (Registrant / Technical) ───────────────── */

function ContactCard({ title, icon = '👤', contact }) {
  const c = contact || {};
  const isRedacted = Boolean(c.isRedacted);

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--cyan-dim)] text-[var(--cyan)] text-sm">
            {icon}
          </span>
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            {title}
          </h3>
        </div>
        {isRedacted && (
          <span className="rounded-full bg-[var(--cyan-dim)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--cyan)]">
            Privacy Protected
          </span>
        )}
      </div>

      <div className="divide-y divide-[var(--border)]">
        <WhoisField
          label="Name"
          value={c.name || (isRedacted ? 'Registration Private' : '—')}
          isMono={false}
        />
        <WhoisField label="Organization" value={c.organization || (isRedacted ? 'Privacy Shield' : '—')} isMono={false} />
        <WhoisField label="Street" value={c.street || '—'} isMono={false} />
        <WhoisField label="City" value={c.city || '—'} isMono={false} />
        <WhoisField label="State" value={c.state || '—'} isMono={false} />
        <WhoisField label="Postal Code" value={c.postalCode || '—'} />
        <WhoisField label="Country" value={c.country || '—'} />
        <WhoisField label="Phone" value={c.phone || (isRedacted ? 'Private' : '—')} />
        <WhoisField label="Email" value={c.email || c.contactUrl || (isRedacted ? 'Private / Contact Form' : '—')} />
      </div>
    </div>
  );
}

/* ── Section 5: Raw WHOIS Record (Interactive Dropdown / Accordion) ─────── */

function RawWhoisDropdown({ rawText, rawData, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'json'

  const lineCount = useMemo(() => {
    return rawText ? rawText.split('\n').length : 0;
  }, [rawText]);

  const jsonString = useMemo(() => {
    return rawData ? JSON.stringify(rawData, null, 2) : '';
  }, [rawData]);

  const activeContent = activeTab === 'text' ? rawText : jsonString;

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden transition-all duration-200">
      {/* Accordion Dropdown Trigger Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
        className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5 sm:p-6 transition select-none hover:bg-[var(--surface-2)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cyan-dim)] text-[var(--cyan)] font-mono text-sm font-bold">
            &gt;_
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-['Outfit',sans-serif] text-base sm:text-lg font-bold text-[var(--text)]">
                Raw WHOIS record
              </h3>
              <span className="rounded-full bg-[var(--surface-3)] px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-semibold text-[var(--cyan)]">
                {lineCount} lines
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--muted-2)]">
              {isOpen ? 'Click to close raw record' : 'Click to open and inspect the full raw WHOIS database record'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <CopyButton text={activeContent} label="Copy Record" />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-2)] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--cyan)] border-[var(--border-bright)]' : ''
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-6">
          {/* Format Sub-tab buttons */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`cursor-pointer rounded-md px-3 py-1 font-semibold transition ${
                  activeTab === 'text'
                    ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-sm'
                    : 'text-[var(--muted-2)] hover:text-[var(--text)]'
                }`}
              >
                WHOIS Record (Text)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`cursor-pointer rounded-md px-3 py-1 font-semibold transition ${
                  activeTab === 'json'
                    ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-sm'
                    : 'text-[var(--muted-2)] hover:text-[var(--text)]'
                }`}
              >
                Raw RDAP (JSON)
              </button>
            </div>

            <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted-2)]">
              Authoritative Registry Response
            </span>
          </div>

          {/* Monospace Code Container */}
          <div className="relative rounded-xl border border-[var(--border)] bg-[#12141a] p-4 text-xs font-['JetBrains_Mono',monospace] leading-relaxed shadow-inner">
            <pre className="max-h-[500px] overflow-x-auto overflow-y-auto whitespace-pre text-[var(--text-2)] select-text">
              {activeContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section 6: Actionable Next Steps Hub ────────────────────────────────── */

function WhoisActionHub({ domain, isDemo = false }) {
  const cleanDomain = encodeURIComponent(domain || '');

  const actions = [
    {
      title: 'Audit DNS Records',
      desc: 'Verify A, MX, TXT, SPF, DKIM, and mail exchange records.',
      route: isDemo ? `${ROUTES.DEMO_DNS}?url=${cleanDomain}` : `${ROUTES.DNS}?domain=${cleanDomain}`,
      icon: '🔍',
      badge: 'DNS',
    },
    {
      title: 'Test Global TTFB',
      desc: 'Benchmark latency & server time to first byte worldwide.',
      route: isDemo ? `${ROUTES.DEMO_TTFB}?url=https://${cleanDomain}` : `${ROUTES.TTFB}?url=https://${cleanDomain}`,
      icon: '⚡',
      badge: 'Latency',
    },
    {
      title: 'Trace URL Redirects',
      desc: 'Inspect HTTPS protocols, www hops, and 301/302 cascades.',
      route: isDemo ? `${ROUTES.DEMO_REDIRECTS}?url=https://${cleanDomain}` : `${ROUTES.REDIRECTS}?url=https://${cleanDomain}`,
      icon: '🔀',
      badge: 'Redirects',
    },
    {
      title: '24/7 Uptime Monitor',
      desc: 'Set up real-time monitoring and instant downtime alerts.',
      route: isDemo ? ROUTES.LOGIN : ROUTES.UPTIME,
      icon: '📡',
      badge: 'Uptime',
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            Related Tools for {domain}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted-2)]">
            Quickly audit DNS propagation, server latency, and URL redirects
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((act, idx) => (
          <Link
            key={idx}
            to={act.route}
            className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition duration-200 hover:border-[var(--cyan-mid)] hover:shadow-md motion-safe:hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-lg">{act.icon}</span>
                <span className="rounded-full bg-[var(--cyan-dim)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase text-[var(--cyan)]">
                  {act.badge}
                </span>
              </div>
              <h4 className="mt-2.5 font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)] group-hover:text-[var(--cyan)]">
                {act.title}
              </h4>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-2)]">{act.desc}</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--cyan)]">
              <span>Run Check</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Main WhoisResultSection ─────────────────────────────────────────────── */

function WhoisResultSection({ result, isLookingUp = false, error = null, onReRun = null, isDemo = false }) {
  // Active lookup loading state
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
            Querying ICANN WHOIS / RDAP Registry…
          </h3>
          <p className="mt-2 max-w-sm text-xs text-[var(--muted-2)]">
            Fetching registrar accreditation, owner contacts, lifecycle events, and authoritative nameservers.
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
            <h3 className="font-['Outfit',sans-serif] font-bold text-[var(--text)]">WHOIS / RDAP Lookup Failed</h3>
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
          Enter a domain name above to inspect official ICANN RDAP registration dates, owner contacts, registrar details, and raw WHOIS record.
        </p>
      </section>
    );
  }

  const rawData = result.raw || result.result || result;
  const domain = (result.domain || rawData.domain || rawData.domainName || rawData.ldhName || result.url || '').toLowerCase();
  const events = parseRdapEvents(result.events || rawData.events, rawData);
  const registrar = extractRegistrarInfo(result);
  const contacts = extractStructuredContacts(result);
  const statuses = extractStatusList(result);
  const nameServers = extractNameservers(result);
  const registryDomainId = rawData.handle || rawData.registryDomainId || rawData.domainId || null;
  const secureDNS = result.secureDNS || rawData.secureDNS;
  const dnssecStatus = secureDNS?.delegationSigned ? 'Signed / Active' : rawData.dnssec ? String(rawData.dnssec) : 'Unsigned';

  const rawWhoisText = generateRawWhoisText(result);

  const daysRemaining = calculateDaysRemaining(events.expirationDate);
  const domainAge = calculateDomainAge(events.registrationDate);

  let expiryBadgeColor = 'var(--green)';
  let expiryBadgeText = 'Active & Valid';
  if (daysRemaining != null) {
    if (daysRemaining < 0) {
      expiryBadgeColor = 'var(--red)';
      expiryBadgeText = 'Expired';
    } else if (daysRemaining <= 30) {
      expiryBadgeColor = 'var(--red)';
      expiryBadgeText = `Expires in ${daysRemaining}d`;
    } else if (daysRemaining <= 90) {
      expiryBadgeColor = 'var(--orange)';
      expiryBadgeText = `Expires in ${daysRemaining}d`;
    } else {
      expiryBadgeColor = 'var(--green)';
      expiryBadgeText = `${daysRemaining} Days Left`;
    }
  }

  return (
    <div className="flex flex-col gap-6 fade-up">
      {/* ── Top Bar: Domain Headline, Expiry Badge, Quick Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 sm:p-6 shadow-[var(--shadow-card)]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-['Outfit',sans-serif] text-xl sm:text-2xl font-extrabold text-[var(--text)] break-all">
              {domain}
            </h2>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider flex-none"
              style={{
                backgroundColor: `${expiryBadgeColor}18`,
                color: expiryBadgeColor,
                border: `1px solid ${expiryBadgeColor}40`,
              }}
            >
              {expiryBadgeText}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted-2)]">
            Registered: {formatCleanDate(events.registrationDate)} {domainAge ? `(${domainAge} old)` : ''} • Checked via ICANN Protocol
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <CopyButton text={rawWhoisText} label="Copy WHOIS" className="flex-1 sm:flex-initial justify-center" />
          <button
            type="button"
            onClick={() => exportWhoisReport(rawData)}
            className="flex-1 sm:flex-initial inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
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
              className="flex-1 sm:flex-initial inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[var(--cyan-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--cyan)] transition hover:bg-[var(--cyan-mid)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Re-query</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Destructured Grid: 2 Columns ────────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Card 1: Domain Information */}
        <DomainInfoCard
          domain={domain}
          registryDomainId={registryDomainId}
          registrationDate={events.registrationDate}
          expirationDate={events.expirationDate}
          lastChangedDate={events.lastChangedDate}
          domainAge={domainAge}
          daysRemaining={daysRemaining}
          dnssecStatus={dnssecStatus}
          statuses={statuses}
          nameServers={nameServers}
        />

        {/* Card 2: Registrar Information */}
        <RegistrarInfoCard registrar={registrar} />

        {/* Card 3: Registrant Contact */}
        <ContactCard
          title="Registrant Contact"
          icon="👑"
          contact={contacts.registrant}
        />

        {/* Card 4: Technical Contact */}
        <ContactCard
          title="Technical Contact"
          icon="⚙️"
          contact={contacts.technical}
        />

        {/* Card 5 (if Administrative Contact is present and distinct from Registrant/Tech) */}
        {contacts.administrative && (contacts.administrative.name || contacts.administrative.organization || contacts.administrative.email) && (
          <ContactCard
            title="Administrative Contact"
            icon="👤"
            contact={contacts.administrative}
          />
        )}
      </div>

      {/* ── Section 5: Raw WHOIS Record (Collapsible Dropdown Accordion) ──── */}
      <RawWhoisDropdown
        rawText={rawWhoisText}
        rawData={rawData}
        defaultOpen={false}
      />

      {/* ── Section 6: Actionable Tools Hub ──────────────────────────────── */}
      <WhoisActionHub domain={domain} isDemo={isDemo} />
    </div>
  );
}

export default memo(WhoisResultSection);
