/**
 * whois.utils.js
 *
 * Utilities, RDAP event parsers, domain age/expiry calculators, and diagnostics for WHOIS / RDAP Lookups.
 */

export const WHOIS_PAGE_LIMIT = 10;
export const WHOIS_SCAN_TIMEOUT_MS = 25_000;
export const WHOIS_SOCKET_TIMEOUT_MS = 10_000;

const LABEL_RE = /^(?!-)[a-z0-9_-]{1,63}(?<!-)$/;

export function normalizeDomain(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/\.$/, '');
}

export function isValidDomain(input) {
  const cleaned = normalizeDomain(input);
  if (!cleaned || cleaned.length > 253) return false;
  if (!cleaned.includes('.')) return false;
  const parts = cleaned.split('.');
  return parts.every((label) => LABEL_RE.test(label));
}

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `whois_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

export function relativeTime(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'just now';

  const s = Math.floor(diffMs / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function parseRdapEvents(events = []) {
  if (!Array.isArray(events)) {
    return {
      registrationDate: null,
      expirationDate: null,
      lastChangedDate: null,
      transferDate: null,
    };
  }

  let registrationDate = null;
  let expirationDate = null;
  let lastChangedDate = null;
  let transferDate = null;

  for (const item of events) {
    const action = String(item.eventAction || '').toLowerCase();
    const date = item.eventDate;

    if (action === 'registration') {
      registrationDate = date;
    } else if (action === 'expiration') {
      expirationDate = date;
    } else if (action === 'last changed' || action === 'last update') {
      lastChangedDate = date;
    } else if (action === 'transfer') {
      transferDate = date;
    }
  }

  return {
    registrationDate,
    expirationDate,
    lastChangedDate,
    transferDate,
  };
}

export function calculateDaysRemaining(expirationDate) {
  if (!expirationDate) return null;
  const target = new Date(expirationDate).getTime();
  if (Number.isNaN(target)) return null;

  const now = Date.now();
  const diffMs = target - now;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return days;
}

export function calculateDomainAge(registrationDate) {
  if (!registrationDate) return null;
  const created = new Date(registrationDate).getTime();
  if (Number.isNaN(created)) return null;

  const now = Date.now();
  const diffMs = now - created;
  if (diffMs < 0) return 'Recently registered';

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);

  if (years > 0) {
    return `${years} yr${years === 1 ? '' : 's'}${months > 0 ? ` ${months} mo` : ''}`;
  }
  if (months > 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  return `${totalDays} day${totalDays === 1 ? '' : 's'}`;
}

export function analyzeWhoisSecurity({ events, nameservers, secureDNS }) {
  const diagnostics = [];
  const { registrationDate, expirationDate } = parseRdapEvents(events);

  // 1. Expiration Risk
  const daysRemaining = calculateDaysRemaining(expirationDate);
  if (daysRemaining != null) {
    if (daysRemaining < 0) {
      diagnostics.push({
        title: 'Domain Expired',
        status: 'fail',
        badge: 'Critical',
        desc: `Domain expired ${Math.abs(daysRemaining)} days ago. Services and routing may stop working at any time.`,
      });
    } else if (daysRemaining <= 30) {
      diagnostics.push({
        title: 'Expiring Soon (Under 30 Days)',
        status: 'fail',
        badge: 'Renew Immediately',
        desc: `Domain registration expires in only ${daysRemaining} days. Immediate renewal required to prevent service disruption.`,
      });
    } else if (daysRemaining <= 90) {
      diagnostics.push({
        title: 'Renewal Recommended (<90 Days)',
        status: 'warn',
        badge: 'Expiring Soon',
        desc: `Domain expires in ${daysRemaining} days. Plan renewal with your registrar to ensure continuous uptime.`,
      });
    } else {
      diagnostics.push({
        title: 'Registration Term Healthy',
        status: 'pass',
        badge: 'Active & Valid',
        desc: `Domain is securely registered for another ${daysRemaining} days (${Math.floor(daysRemaining / 365)} years).`,
      });
    }
  }

  // 2. Domain Age / Reputation
  const age = calculateDomainAge(registrationDate);
  if (registrationDate) {
    const createdTime = new Date(registrationDate).getTime();
    const ageDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);

    if (ageDays >= 365 * 2) {
      diagnostics.push({
        title: 'Established Domain Reputation',
        status: 'pass',
        badge: 'Established',
        desc: `Registered over ${age}. Long domain history positively impacts email deliverability and search authority.`,
      });
    } else {
      diagnostics.push({
        title: 'Young Domain (<2 Years)',
        status: 'warn',
        badge: 'Young Domain',
        desc: `Domain was created ${age} ago. Newly registered domains can undergo scrutiny by spam filters and anti-abuse systems.`,
      });
    }
  }

  // 3. Nameserver Redundancy
  const nsList = Array.isArray(nameservers) ? nameservers : [];
  if (nsList.length >= 2) {
    diagnostics.push({
      title: 'Authoritative Nameserver Redundancy',
      status: 'pass',
      badge: 'High Availability',
      desc: `${nsList.length} authoritative nameservers configured across redundant network clusters.`,
    });
  } else if (nsList.length === 1) {
    diagnostics.push({
      title: 'Single Nameserver Risk',
      status: 'warn',
      badge: 'No Redundancy',
      desc: 'Only 1 nameserver found. Lack of secondary nameservers creates a single point of failure.',
    });
  } else {
    diagnostics.push({
      title: 'No Nameservers Reported',
      status: 'warn',
      badge: 'Notice',
      desc: 'No nameservers found in RDAP response. Verify delegation in DNS zone.',
    });
  }

  // 4. DNSSEC Security
  const isSigned = Boolean(secureDNS?.delegationSigned);
  diagnostics.push({
    title: 'DNSSEC Cryptographic Validation',
    status: isSigned ? 'pass' : 'info',
    badge: isSigned ? 'DNSSEC Active' : 'Unsigned',
    desc: isSigned
      ? 'Delegation signed with DNSSEC. Protects against DNS cache poisoning and malicious spoofing.'
      : 'DNSSEC delegation is not signed. Consider enabling DNSSEC at your registrar for authenticated resolution.',
  });

  return diagnostics;
}

export function exportWhoisReport(report) {
  if (!report) return;
  const fileName = `whois-${report.domain || 'lookup'}-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Standardize MongoDB record, socket response, or raw RDAP result into a unified UI report object.
 * @param {object} entry - Raw document or socket payload
 * @returns {object|null}
 */
export function normalizeWhoisEntry(entry) {
  if (!entry) return null;
  const raw = entry.result || entry;
  const id = entry._id ? String(entry._id) : entry.id || entry.jobId || createId();
  const dbId = entry._id ? String(entry._id) : entry.whoisDbId ? String(entry.whoisDbId) : null;

  const domain = raw.domain || entry.url || entry.domain || '';
  const events = Array.isArray(raw.events) ? raw.events : [];
  const nameservers = Array.isArray(raw.nameservers) ? raw.nameservers : [];
  const secureDNS = raw.secureDNS || null;
  const lookedUpAt =
    entry.completedAt || entry.createdAt || raw.lookedUpAt || new Date().toISOString();
  const status = entry.status || raw.status || 'completed';
  const error = entry.error || raw.error?.message || raw.error || null;

  return {
    id,
    dbId,
    domain,
    url: entry.url || domain,
    events,
    nameservers,
    secureDNS,
    lookedUpAt,
    status,
    error,
    success: status === 'completed' && !error,
    raw,
  };
}
