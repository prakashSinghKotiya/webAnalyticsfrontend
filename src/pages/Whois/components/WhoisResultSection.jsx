import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import {
  analyzeWhoisSecurity,
  calculateDaysRemaining,
  calculateDomainAge,
  exportWhoisReport,
  extractNormalizedEntities,
  formatAddress,
  formatDate,
  formatEppStatus,
  getRoleInfo,
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

/* ── Expandable / Collapsible Container (Show More / Less) ───────────────── */

function ShowMoreToggle({ isExpanded, onToggle, labelMore = 'Show More', labelLess = 'Show Less' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[var(--cyan)] transition hover:underline focus:outline-none"
    >
      <span>{isExpanded ? labelLess : labelMore}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

/* ── Contact Details (Registrant / Owner, Admin, Tech) ───────────────────── */

/* ── Entity Card (Detailed Domain Ownership & Verified Channels) ───────── */

function WhoisEntityCard({ entity, index = 1, isPrimary = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRawAddress, setShowRawAddress] = useState(false);

  const roleInfo = entity.roleInfo || getRoleInfo(entity.primaryRole);
  const isRedacted = entity.isRedacted;
  const addressText = entity.address || 'REDACTED FOR PRIVACY';
  const formattedAddressText = entity.formattedAddress || formatAddress(addressText);
  const hasEvents = Array.isArray(entity.events) && entity.events.length > 0;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl border p-5 transition ${
        isPrimary
          ? 'border-[var(--cyan-mid)] bg-[var(--surface-2)] shadow-[0_0_24px_var(--cyan-dim)]'
          : 'border-[var(--border)] bg-[var(--surface-2)]/90'
      }`}
    >
      <div>
        {/* Entity Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold ${
                isPrimary
                  ? 'bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-sm'
                  : 'bg-[var(--surface-3)] text-[var(--text-2)]'
              }`}
            >
              {roleInfo.icon || '👤'}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
                  Entity
                </span>
                <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)]">
                  #{index}
                </span>
              </div>
              <span className="text-[10px] text-[var(--muted)]">
                {roleInfo.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase tracking-wider ${
                isRedacted
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green)]/30'
              }`}
            >
              {isRedacted ? '🛡️ Privacy Shield' : '✓ Verified Public'}
            </span>
          </div>
        </div>

        {/* Roles */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
            Roles:
          </span>
          {entity.roles && entity.roles.length > 0 ? (
            entity.roles.map((r, rIdx) => (
              <span
                key={rIdx}
                className="rounded-md border border-[var(--cyan-mid)]/40 bg-[var(--cyan-dim)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[var(--cyan)] lowercase"
              >
                {r}
              </span>
            ))
          ) : (
            <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--text-2)]">registrant</span>
          )}
        </div>

        {/* Contact Information Subheading */}
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between">
            <h4 className="font-['Outfit',sans-serif] text-xs font-bold uppercase tracking-wider text-[var(--cyan)]">
              Contact Information:
            </h4>
            {entity.format && (
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted-2)]">
                Format: <strong className="text-[var(--text)]">{entity.format}</strong>
              </span>
            )}
          </div>

          {/* Row 1 & 2: Primary Identity & Communication Channels (Always visible) */}
          <div className="mt-2.5 space-y-2.5 text-xs">
            {/* Name */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
                Name:
              </span>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="font-semibold text-[var(--text)] break-words">
                  {entity.name || (isRedacted ? 'REDACTED REGISTRANT' : 'Not Disclosed')}
                </span>
                {entity.name && <CopyButton text={entity.name} />}
              </div>
            </div>

            {/* Organization */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
                Organization:
              </span>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="font-semibold text-[var(--text)] break-words">
                  {entity.organization || 'Not Disclosed'}
                </span>
                {entity.organization && <CopyButton text={entity.organization} />}
              </div>
            </div>

            {/* Contact URL */}
            {entity.contactUrl && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
                    Contact URL:
                  </span>
                  <span className="text-[9px] text-[var(--green)]">Official Web Inquiries</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={entity.contactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[11px] font-medium text-[var(--cyan)] hover:underline max-w-[240px] sm:max-w-xs"
                    title={entity.contactUrl}
                  >
                    {entity.contactUrl}
                  </a>
                  <div className="flex items-center gap-1.5 flex-none">
                    <a
                      href={entity.contactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-[var(--cyan-dim)] px-2 py-0.5 text-[10px] font-bold text-[var(--cyan)] transition hover:brightness-110"
                    >
                      <span>Open Form</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                    <CopyButton text={entity.contactUrl} />
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            {entity.email && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-2.5">
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase text-[var(--muted-2)]">Email:</span>
                  <a
                    href={`mailto:${entity.email}`}
                    className="truncate text-[11px] font-medium text-[var(--cyan)] hover:underline"
                  >
                    [{entity.email}](mailto:{encodeURIComponent(entity.email)})
                  </a>
                </div>
                <CopyButton text={entity.email} />
              </div>
            )}
          </div>

          {/* Toggle for Extra Details (Address, Phone, Contact Format, Events) */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[var(--cyan)] transition hover:underline"
            >
              <span>{isExpanded ? 'Show Less Details' : 'Show More (Address, Phone, Format, Events)'}</span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Collapsible Expanded Panel */}
          {isExpanded && (
            <div className="mt-3 space-y-2.5 border-t border-[var(--border)] pt-3 text-xs">
              {/* Address */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
                    Address:
                  </span>
                  {formattedAddressText && formattedAddressText !== addressText && (
                    <button
                      type="button"
                      onClick={() => setShowRawAddress(!showRawAddress)}
                      className="text-[10px] font-semibold text-[var(--cyan)] hover:underline"
                    >
                      {showRawAddress ? 'Show clean' : 'Show raw'}
                    </button>
                  )}
                </div>
                <div className="mt-1 flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--text)] break-words">
                      {showRawAddress ? addressText : (formattedAddressText || addressText)}
                    </p>
                    {!showRawAddress && formattedAddressText && formattedAddressText !== addressText && (
                      <p className="mt-0.5 font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted-2)] truncate">
                        Raw: {addressText}
                      </p>
                    )}
                  </div>
                  {addressText && <CopyButton text={addressText} />}
                </div>
              </div>

              {/* Phone */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
                  Phone:
                </span>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-2.5">
                  <span className="font-['JetBrains_Mono',monospace] text-[11px] font-semibold text-[var(--text)]">
                    {entity.phone || 'REDACTED FOR PRIVACY'}
                  </span>
                  {entity.phone && <CopyButton text={entity.phone} />}
                </div>
              </div>

              {/* Contact format */}
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
                  Contact format:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--cyan)]">
                    {entity.format || 'jCard'}
                  </span>
                  <span className="text-[10px] text-[var(--muted-2)]">(RFC 7095)</span>
                </div>
              </div>

              {/* Events */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
                  Events:
                </span>
                <div className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-2.5">
                  {hasEvents ? (
                    <div className="space-y-1.5 divide-y divide-[var(--border)]">
                      {entity.events.map((ev, evIdx) => (
                        <div key={evIdx} className="pt-1.5 first:pt-0 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-[var(--muted-2)] lowercase">
                            {ev.eventAction}:
                          </span>
                          <span className="font-['JetBrains_Mono',monospace] text-[11px] font-semibold text-[var(--text)]">
                            {ev.formattedDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--muted-2)] italic">
                      No entity-specific lifecycle events published.
                    </p>
                  )}
                </div>
              </div>

              {/* Registry Handle */}
              {entity.handle && (
                <div className="flex items-center justify-between text-[10px] text-[var(--muted)] pt-1">
                  <span>Registry Handle:</span>
                  <span className="font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">{entity.handle}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WhoisEntitiesSection({ result, domain, isDemo = false }) {
  const [activeTab, setActiveTab] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const entities = useMemo(() => {
    return extractNormalizedEntities(result);
  }, [result]);

  const rolesAvailable = useMemo(() => {
    const set = new Set();
    for (const ent of entities) {
      for (const r of ent.roles || []) {
        set.add(r);
      }
    }
    return Array.from(set);
  }, [entities]);

  const filteredEntities = useMemo(() => {
    if (activeTab === 'all') return entities;
    return entities.filter((e) => (e.roles || []).includes(activeTab));
  }, [entities, activeTab]);

  // Show 2 entities by default (keeps within 2 rows on responsive view)
  const visibleEntities = isExpanded ? filteredEntities : filteredEntities.slice(0, 2);

  if (!entities.length) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-6 text-center">
        <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
          Domain Ownership & Contact Information (Entities)
        </h3>
        <p className="mt-1 text-xs text-[var(--muted-2)]">
          Contact records are privacy-masked or omitted by the authoritative RDAP registry.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-6">
      {/* Friendly Main Heading */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--cyan-dim)] text-[var(--cyan)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <h3 className="font-['Outfit',sans-serif] text-base sm:text-lg font-bold text-[var(--text)]">
              Domain Ownership & Contact Information (Entities)
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            Verified records showing who registered and manages this website, their organization, and verified contact channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExplainer(!showExplainer)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-2)] transition hover:text-[var(--cyan)]"
          >
            <span>💡 How Entities Work</span>
          </button>
        </div>
      </div>

      {/* Explainer Banner for Normal People */}
      {showExplainer && (
        <div className="mb-4 rounded-lg border border-[var(--cyan-mid)]/40 bg-[var(--cyan-dim)]/30 p-3.5 text-xs text-[var(--text-2)] leading-relaxed">
          <p className="font-semibold text-[var(--cyan)]">Understanding RDAP Entities & Contact Privacy:</p>
          <ul className="mt-1.5 list-disc pl-4 space-y-1 text-[11px] text-[var(--muted-2)]">
            <li><strong>Entities</strong> represent the individuals, companies, or service providers responsible for registering and maintaining this domain (Registrant, Administrator, Technical Lead, and Abuse Contacts).</li>
            <li><strong>Privacy Redaction (GDPR):</strong> Under ICANN privacy guidelines, personal names, street addresses, and phones are masked with "REDACTED FOR PRIVACY" to safeguard owners from spam and phishing.</li>
            <li><strong>Contact URL:</strong> Registrars provide official web contact forms (Contact URL) allowing inquiries to reach the domain owner securely.</li>
            <li><strong>jCard Format:</strong> RDAP returns contact data in standard RFC 7095 JSON format.</li>
          </ul>
        </div>
      )}

      {/* Role Filter Tabs */}
      {rolesAvailable.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
              activeTab === 'all'
                ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
                : 'text-[var(--muted-2)] hover:text-[var(--text)]'
            }`}
          >
            All Entities ({entities.length})
          </button>
          {rolesAvailable.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setActiveTab(role)}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition capitalize ${
                activeTab === role
                  ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]'
                  : 'text-[var(--muted-2)] hover:text-[var(--text)]'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      )}

      {/* Entity Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {visibleEntities.map((ent, idx) => (
          <WhoisEntityCard
            key={ent.id || idx}
            entity={ent}
            index={idx + 1}
            isPrimary={ent.isPrimary}
          />
        ))}
      </div>

      {/* Show more/less if more than 2 entities */}
      {filteredEntities.length > 2 && (
        <ShowMoreToggle
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          labelMore={`Show all ${filteredEntities.length} entities (${filteredEntities.length - 2} more)`}
          labelLess="Show primary 2 entities only"
        />
      )}

      {/* Actionable domain operations related to this entity record */}
      {domain && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs">
          <span className="text-[var(--muted-2)]">Related infrastructure checks for {domain}:</span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={isDemo ? `${ROUTES.DEMO_DNS}?url=${encodeURIComponent(domain)}` : `${ROUTES.DNS}?domain=${encodeURIComponent(domain)}`}
              className="inline-flex items-center gap-1 rounded bg-[var(--cyan-dim)] px-2.5 py-1 text-[11px] font-semibold text-[var(--cyan)] transition hover:brightness-110"
            >
              <span>Audit DNS Records</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              to={isDemo ? `${ROUTES.DEMO_TTFB}?url=https://${encodeURIComponent(domain)}` : `${ROUTES.TTFB}?url=https://${encodeURIComponent(domain)}`}
              className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface-3)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-2)] transition hover:text-[var(--cyan)]"
            >
              <span>Test Global TTFB</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Registrar Information Card ─────────────────────────────────────────── */

function WhoisRegistrarCard({ registrar }) {
  if (!registrar) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 text-center text-xs text-[var(--muted-2)]">
        Registrar metadata not disclosed by registry.
      </div>
    );
  }

  const ianaId = registrar.publicIds?.find((id) =>
    String(id.type || '').toLowerCase().includes('iana') || id.identifier
  )?.identifier;

  const websiteLink = registrar.links?.find((l) => l.rel === 'related' || l.href)?.href;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div>
          <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[var(--cyan)]">
            ACCREDITED REGISTRAR
          </span>
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            {registrar.name || registrar.organization || 'Official Registrar'}
          </h3>
        </div>

        {ianaId && (
          <a
            href={`https://www.icann.org/en/accredited-registrars?sort-direction=asc&sort-param=name&page=1&views-exposed-form-accredited-registrars-page-1-filter=${ianaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[var(--cyan)] transition hover:brightness-110"
            title="View ICANN Registrar Accreditation"
          >
            <span>IANA ID: {ianaId}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 text-xs">
        {/* Abuse Email */}
        <div className="flex flex-col justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-3">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-2)]">
            Abuse Contact Email:
          </span>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate font-semibold text-[var(--text)]">
              {registrar.email || 'abuse@' + (registrar.name?.toLowerCase().replace(/\s+/g, '') || 'registrar.com')}
            </span>
            <CopyButton text={registrar.email} />
          </div>
          {registrar.email && (
            <a
              href={`mailto:${registrar.email}?subject=Domain%20Abuse%20Notice`}
              className="mt-2 inline-flex w-fit items-center gap-1 text-[11px] font-bold text-[var(--cyan)] hover:underline"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Draft Abuse Report</span>
            </a>
          )}
        </div>

        {/* Abuse Phone */}
        <div className="flex flex-col justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-3">
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted-2)]">
            Abuse Hotline Phone:
          </span>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
              {registrar.phone || '—'}
            </span>
            {registrar.phone && <CopyButton text={registrar.phone} />}
          </div>
          {registrar.phone && (
            <a
              href={`tel:${registrar.phone}`}
              className="mt-2 inline-flex w-fit items-center gap-1 text-[11px] font-bold text-[var(--green)] hover:underline"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Call Hotline</span>
            </a>
          )}
        </div>
      </div>

      {websiteLink && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs">
          <span className="text-[var(--muted-2)]">Registrar Website / Portal:</span>
          <a
            href={websiteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[var(--cyan)] hover:underline"
          >
            <span>{websiteLink.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Domain Status (EPP Security Locks) with Show More / Show Less ──────── */

function WhoisStatusSection({ statusList = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statuses = Array.isArray(statusList) ? statusList : [];
  if (!statuses.length) return null;

  // Show 3 by default (typically 2-3 rows max in responsive flex)
  const visibleStatuses = isExpanded ? statuses : statuses.slice(0, 3);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
        <div>
          <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
            Domain Status & Security Locks ({statuses.length})
          </h3>
          <p className="text-[11px] text-[var(--muted-2)]">
            EPP flags protecting against unauthorized transfers, deletion, or hijacking
          </p>
        </div>
        <CopyButton text={statuses.join(', ')} label="Copy Statuses" />
      </div>

      <div className="space-y-2">
        {visibleStatuses.map((statusCode, idx) => {
          const info = formatEppStatus(statusCode);
          let badgeBg = 'bg-[var(--green-dim)] text-[var(--green)] border-[var(--green)]/30';
          if (info.level === 'warning') badgeBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
          if (info.level === 'danger') badgeBg = 'bg-red-500/15 text-red-400 border-red-500/30';

          return (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">
                    {info.raw}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase border ${badgeBg}`}>
                    {info.label}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted-2)] leading-relaxed">{info.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {statuses.length > 3 && (
        <ShowMoreToggle
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          labelMore={`Show all ${statuses.length} registry status codes (${statuses.length - 3} more)`}
          labelLess="Show fewer status codes"
        />
      )}
    </div>
  );
}

/* ── Authoritative Nameservers with Show More / Show Less ────────────────── */

function WhoisNameserversSection({ nameservers = [], domain, isDemo = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const nsList = Array.isArray(nameservers) ? nameservers : [];

  const visibleNs = isExpanded ? nsList : nsList.slice(0, 3);
  const dnsRoute = isDemo ? `${ROUTES.DEMO_DNS}?url=${encodeURIComponent(domain)}` : `${ROUTES.DNS}?domain=${encodeURIComponent(domain)}`;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div>
          <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
            Authoritative Nameservers ({nsList.length})
          </h3>
          <p className="text-[11px] text-[var(--muted-2)]">
            Responsible for translating domain names into IP addresses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton
            text={nsList.map((n) => n?.ldhName || String(n)).join('\n')}
            label="Copy All"
          />
          <Link
            to={dnsRoute}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--cyan-dim)] px-2.5 py-1 text-[11px] font-semibold text-[var(--cyan)] transition hover:brightness-110"
          >
            <span>Audit DNS Records</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>

      {nsList.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--muted-2)] italic">
          No nameservers found in RDAP response.
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleNs.map((ns, idx) => {
            const nsName = ns?.ldhName || String(ns);
            return (
              <li
                key={idx}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--cyan)]" />
                  <span className="truncate font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
                    {nsName}
                  </span>
                </div>
                <CopyButton text={nsName} />
              </li>
            );
          })}
        </ul>
      )}

      {nsList.length > 3 && (
        <ShowMoreToggle
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          labelMore={`Show all ${nsList.length} nameservers (${nsList.length - 3} more)`}
          labelLess="Show top nameservers only"
        />
      )}
    </div>
  );
}

/* ── Registry Notices with Show More / Show Less ─────────────────────────── */

function WhoisNoticesSection({ notices = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const items = Array.isArray(notices) ? notices : [];
  if (!items.length) return null;

  const visibleNotices = isExpanded ? items : items.slice(0, 2);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
          Registry Notices & Legal Guidelines ({items.length})
        </h3>
        <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)]">
          ICANN RDAP Provisions
        </span>
      </div>

      <div className="space-y-2.5">
        {visibleNotices.map((notice, idx) => (
          <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-3 text-xs">
            <h4 className="font-semibold text-[var(--text)]">{notice.title || 'Registry Policy Notice'}</h4>
            {Array.isArray(notice.description) ? (
              <div className="mt-1 space-y-1 text-[11px] text-[var(--muted-2)]">
                {notice.description.map((line, lIdx) => (
                  <p key={lIdx}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-[var(--muted-2)]">{notice.description || 'Terms of query usage apply.'}</p>
            )}
          </div>
        ))}
      </div>

      {items.length > 2 && (
        <ShowMoreToggle
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          labelMore={`Show all ${items.length} legal notices`}
          labelLess="Show fewer notices"
        />
      )}
    </div>
  );
}

/* ── Actionable Next Steps Hub ───────────────────────────────────────────── */

function WhoisActionHub({ domain, isDemo = false }) {
  const cleanDomain = encodeURIComponent(domain || '');

  const actions = [
    {
      title: 'Audit DNS Records',
      desc: 'Verify A, MX, TXT, SPF, DKIM and mail exchange routing.',
      route: isDemo ? `${ROUTES.DEMO_DNS}?url=${cleanDomain}` : `${ROUTES.DNS}?domain=${cleanDomain}`,
      icon: '🔍',
      badge: 'DNS Routing',
      color: 'var(--cyan)',
    },
    {
      title: 'Test Global TTFB',
      desc: 'Benchmark latency & server time to first byte across 6 worldwide nodes.',
      route: isDemo ? `${ROUTES.DEMO_TTFB}?url=https://${cleanDomain}` : `${ROUTES.TTFB}?url=https://${cleanDomain}`,
      icon: '⚡',
      badge: 'Latency',
      color: 'var(--green)',
    },
    {
      title: 'Trace URL Redirects',
      desc: 'Inspect HTTP to HTTPS protocols, www hops, and 301/302 cascades.',
      route: isDemo ? `${ROUTES.DEMO_REDIRECTS}?url=https://${cleanDomain}` : `${ROUTES.REDIRECTS}?url=https://${cleanDomain}`,
      icon: '🔀',
      badge: 'Redirects',
      color: 'var(--orange)',
    },
    {
      title: '24/7 Uptime Monitor',
      desc: 'Set up real-time alerting via email and webhook for instant downtime alerts.',
      route: isDemo ? ROUTES.LOGIN : ROUTES.UPTIME,
      icon: '📡',
      badge: 'Monitoring',
      color: '#38bdf8',
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="mb-4">
        <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[var(--cyan)]">
          RECOMMENDED NEXT STEPS
        </span>
        <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
          Actions You Can Take for {domain}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted-2)]">
          Quickly verify DNS health, latency bottlenecks, and setup uptime monitoring for this domain
        </p>
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
                <span className="text-xl">{act.icon}</span>
                <span
                  className="rounded-full px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] font-bold uppercase"
                  style={{ color: act.color, backgroundColor: `${act.color}15` }}
                >
                  {act.badge}
                </span>
              </div>
              <h4 className="mt-3 font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)] group-hover:text-[var(--cyan)]">
                {act.title}
              </h4>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-2)]">{act.desc}</p>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--cyan)]">
              <span>Execute Check</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="transition-transform group-hover:translate-x-1"
              >
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

/* ── Domain Security & Diagnostics Insights ──────────────────────────────── */

function WhoisSecurityInsights({ events, nameservers, secureDNS }) {
  const diagnostics = useMemo(
    () => analyzeWhoisSecurity({ events, nameservers, secureDNS }),
    [events, nameservers, secureDNS],
  );

  if (!diagnostics.length) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="mb-4">
        <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[var(--green)]">
          AUTOMATED REPUTATION & HEALTH AUDIT
        </span>
        <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
          Domain Security, Age & Redundancy Analysis
        </h3>
      </div>

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
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
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

/* ── Main WhoisResultSection ─────────────────────────────────────────────── */

function WhoisResultSection({ result, isLookingUp = false, error = null, onReRun = null, isDemo = false }) {
  const [showRawJson, setShowRawJson] = useState(false);

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
            Fetching registrar accreditation, owner contacts, lifecycle events, EPP transfer locks, and DNSSEC keys.
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
          Enter a domain name above to inspect official ICANN RDAP registration dates, owner contacts, registrar details, EPP transfer locks, and DNSSEC keys.
        </p>
      </section>
    );
  }

  const rawData = result.raw || result.result || result;
  const domain = (result.domain || rawData.domain || rawData.ldhName || '').toUpperCase();
  const unicodeDomain = result.unicodeDomain || rawData.unicodeDomain || null;
  const events = Array.isArray(result.events) ? result.events : Array.isArray(rawData.events) ? rawData.events : [];
  const nameservers = Array.isArray(result.nameservers) ? result.nameservers : Array.isArray(rawData.nameservers) ? rawData.nameservers : [];
  const secureDNS = result.secureDNS || rawData.secureDNS || null;
  const registrar = result.registrar || rawData.registrar || null;
  const statusList = result.statusList || result.status || rawData.status || [];
  const notices = result.notices || rawData.notices || [];
  const lookedUpAt = result.lookedUpAt || rawData.lookedUpAt || new Date().toISOString();

  const { registrationDate, expirationDate, lastChangedDate, transferDate } = parseRdapEvents(events);
  const daysRemaining = calculateDaysRemaining(expirationDate);
  const domainAge = calculateDomainAge(registrationDate);
  const isDnssecSigned = Boolean(secureDNS?.delegationSigned);

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
      {/* ── Summary & Headline Card ────────────────────────────────────────── */}
      <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-['Outfit',sans-serif] text-2xl font-extrabold text-[var(--text)]">
                {domain}
              </h2>
              {unicodeDomain && unicodeDomain !== domain && (
                <span className="rounded bg-[var(--surface-3)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-xs text-[var(--cyan)]">
                  IDN: {unicodeDomain}
                </span>
              )}
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
              Retrieved via Official RDAP Protocol ({relativeTime(lookedUpAt)})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={JSON.stringify(rawData, null, 2)} label="Copy All JSON" />
            <button
              type="button"
              onClick={() => exportWhoisReport(rawData)}
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

        {/* 4 Quick Stat Tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Domain Age
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)] sm:text-2xl">
              {domainAge || '—'}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">
              {registrationDate ? `Created ${new Date(registrationDate).getFullYear()}` : 'Date unlisted'}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Expiry Countdown
            </span>
            <p
              className="mt-1 font-['Outfit',sans-serif] text-xl font-bold sm:text-2xl"
              style={{ color: expiryStatusColor }}
            >
              {daysRemaining != null ? `${daysRemaining}d` : '—'}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">
              {expirationDate ? `Until ${new Date(expirationDate).getFullYear()}` : 'Date unlisted'}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Registrar
            </span>
            <p className="mt-1 font-['Outfit',sans-serif] text-lg font-bold text-[var(--cyan)] truncate px-1">
              {registrar?.name || registrar?.organization || 'Listed'}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">
              ICANN Accredited
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              DNSSEC Security
            </span>
            <p
              className={`mt-1 font-['Outfit',sans-serif] text-lg font-bold sm:text-xl ${
                isDnssecSigned ? 'text-[var(--green)]' : 'text-[var(--muted-2)]'
              }`}
            >
              {isDnssecSigned ? 'Signed' : 'Unsigned'}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">
              {isDnssecSigned ? 'Cryptographically secure' : 'No DS record in root'}
            </p>
          </div>
        </div>

        {/* 2-Column Main Details: Registration Lifecycle & Registrar Information */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Block 1: Registration Lifecycle & Timestamps */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
                  Registration Lifecycle
                </h3>
                <p className="text-[11px] text-[var(--muted-2)]">Critical registry timeline milestones</p>
              </div>
              <span className="rounded bg-[var(--cyan-dim)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[var(--cyan)]">
                Timestamps
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
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

          {/* Block 2: Registrar Overview */}
          <WhoisRegistrarCard registrar={registrar} />
        </div>

        {/* Full Domain Ownership & Contact Information (Entities) */}
        <div className="mt-6">
          <WhoisEntitiesSection result={result} domain={domain} isDemo={isDemo} />
        </div>

        {/* Domain Status Locks & Nameservers */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <WhoisStatusSection statusList={statusList} />
          <WhoisNameserversSection nameservers={nameservers} domain={domain} isDemo={isDemo} />
        </div>

        {/* DNSSEC Zone Delegation & Notices */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* DNSSEC Card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
                  DNSSEC Zone Security
                </h3>
                <p className="text-[11px] text-[var(--muted-2)]">Cryptographic authenticity of DNS responses</p>
              </div>
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

            <div className="space-y-2 text-xs">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-3">
                <span className="text-[10px] uppercase text-[var(--muted-2)]">Validation Status:</span>
                <p className="mt-0.5 font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
                  {isDnssecSigned ? 'Secure (Signed by Parent Registry)' : 'Insecure (Unsigned Delegation)'}
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted-2)]">
                  {isDnssecSigned
                    ? 'Protects visitors against DNS spoofing, cache poisoning, and man-in-the-middle attacks.'
                    : 'Enabling DNSSEC at your registrar signs your DNS zone and ensures query integrity.'}
                </p>
              </div>
              {secureDNS?.maxSigLife && (
                <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                  <span className="text-[var(--muted-2)]">Max Signature Life:</span>
                  <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--text)]">
                    {secureDNS.maxSigLife}s
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notices Card */}
          <WhoisNoticesSection notices={notices} />
        </div>

        {/* Collapsible Raw JSON Viewer */}
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--muted-2)] transition hover:text-[var(--cyan)]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform ${showRawJson ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span>{showRawJson ? 'Hide Raw RDAP Response JSON' : 'Inspect Raw RDAP Response JSON'}</span>
          </button>

          {showRawJson && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase text-[var(--muted-2)]">
                  Full RDAP Payload
                </span>
                <CopyButton text={JSON.stringify(rawData, null, 2)} label="Copy JSON" />
              </div>
              <pre className="max-h-80 overflow-y-auto font-['JetBrains_Mono',monospace] text-[11px] text-[var(--text-2)] leading-relaxed">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* ── Actionable Tools Hub ────────────────────────────────────────────── */}
      <WhoisActionHub domain={domain} isDemo={isDemo} />

      {/* ── Security & Lifecycle Insights ────────────────────────────────────── */}
      <WhoisSecurityInsights
        events={events}
        nameservers={nameservers}
        secureDNS={secureDNS}
      />
    </div>
  );
}

export default memo(WhoisResultSection);
