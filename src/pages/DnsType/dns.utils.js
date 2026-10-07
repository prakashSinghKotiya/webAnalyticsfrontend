/**
 * dns.utils.js
 *
 * Domain utilities, record definitions, validation, and formatters for DNS Lookups.
 */

export const DNS_PAGE_LIMIT = 10;
export const DNS_SCAN_TIMEOUT_MS = 20_000;
export const DNS_SOCKET_TIMEOUT_MS = 10_000;

export const RECORD_METADATA = {
  A: {
    name: 'Address Record (IPv4)',
    desc: 'Maps the hostname directly to 32-bit IPv4 addresses.',
    color: '#00d4ff', // cyan
    badge: 'IPv4',
  },
  AAAA: {
    name: 'IPv6 Address Record',
    desc: 'Maps the hostname to 128-bit modern IPv6 addresses.',
    color: '#a855f7', // purple
    badge: 'IPv6',
  },
  MX: {
    name: 'Mail Exchanger Record',
    desc: 'Specifies mail servers responsible for accepting incoming email messages.',
    color: '#00e87a', // green
    badge: 'Mail',
  },
  TXT: {
    name: 'Text Record',
    desc: 'Carries machine-readable data for SPF, DKIM, DMARC, and site ownership verification.',
    color: '#ff9a00', // orange
    badge: 'Text',
  },
  NS: {
    name: 'Name Server Record',
    desc: 'Delegates a DNS zone to an authoritative name server.',
    color: '#3b82f6', // blue
    badge: 'Nameserver',
  },
  CNAME: {
    name: 'Canonical Name Record',
    desc: 'Maps an alias name to the true, canonical domain name.',
    color: '#ec4899', // pink
    badge: 'Alias',
  },
  SOA: {
    name: 'Start of Authority',
    desc: 'Contains primary name server, administrator email, serial number, and zone timers.',
    color: '#eab308', // yellow
    badge: 'Zone Auth',
  },
  CAA: {
    name: 'Certification Authority Auth',
    desc: 'Controls which Certificate Authorities (CAs) are allowed to issue SSL/TLS certificates.',
    color: '#14b8a6', // teal
    badge: 'Security',
  },
};

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
  return `dns_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

export function formatDuration(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function exportDnsReport(report) {
  if (!report) return;
  const fileName = `dns-${report.hostname || 'report'}-${new Date().toISOString().slice(0, 10)}.json`;
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
 * Standardize MongoDB record, socket response, or raw DNS result into a unified UI report object.
 * @param {object} entry - Raw document or socket payload
 * @returns {object|null}
 */
export function normalizeDnsEntry(entry) {
  if (!entry) return null;
  const raw = entry.result || entry;
  const id = entry._id ? String(entry._id) : entry.id || entry.jobId || createId();
  const dbId = entry._id ? String(entry._id) : entry.dnsRecordId ? String(entry.dnsRecordId) : null;

  const hostname = raw.hostname || entry.url || entry.hostname || '';
  const resolver = raw.resolver || 'system';
  const resolvedAt =
    entry.completedAt || entry.createdAt || raw.resolvedAt || new Date().toISOString();
  const durationMs = raw.durationMs ?? 0;
  const summary = raw.summary || { found: 0, notFound: 0, error: 0, domainExists: true };
  const records = raw.records || {};
  const status = entry.status || raw.status || 'completed';
  const error = entry.error || raw.error || null;

  return {
    id,
    dbId,
    hostname,
    url: entry.url || hostname,
    resolver,
    resolvedAt,
    durationMs,
    summary,
    records,
    status,
    error,
    success: status === 'completed' && !error,
    raw,
  };
}
