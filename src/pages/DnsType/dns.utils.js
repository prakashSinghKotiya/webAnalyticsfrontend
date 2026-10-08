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
  CNAME: {
    name: 'Canonical Name Record',
    desc: 'Maps an alias name to the true, canonical domain name.',
    color: '#ec4899', // pink
    badge: 'Alias',
  },
  MX: {
    name: 'Mail Exchanger Record',
    desc: 'Specifies mail servers responsible for accepting incoming email messages.',
    color: '#00e87a', // green
    badge: 'Mail',
  },
  NS: {
    name: 'Name Server Record',
    desc: 'Delegates a DNS zone to an authoritative name server.',
    color: '#3b82f6', // blue
    badge: 'Nameserver',
  },
  PTR: {
    name: 'Pointer Record (Reverse DNS)',
    desc: 'Maps an IP address back to a canonical hostname for reverse lookups.',
    color: '#6366f1', // indigo
    badge: 'Reverse',
  },
  SOA: {
    name: 'Start of Authority',
    desc: 'Contains primary name server, administrator email, serial number, and zone timers.',
    color: '#eab308', // yellow
    badge: 'Zone Auth',
  },
  SPF: {
    name: 'Sender Policy Framework (SPF)',
    desc: 'Authorizes which mail servers are permitted to send email on behalf of this domain.',
    color: '#10b981', // emerald
    badge: 'Email Auth',
  },
  TXT: {
    name: 'Text Record',
    desc: 'Carries machine-readable data for SPF, DKIM, DMARC, and site ownership verification.',
    color: '#ff9a00', // orange
    badge: 'Text',
  },
  CAA: {
    name: 'Certification Authority Auth',
    desc: 'Controls which Certificate Authorities (CAs) are allowed to issue SSL/TLS certificates.',
    color: '#14b8a6', // teal
    badge: 'Security',
  },
  DS: {
    name: 'Delegation Signer Record',
    desc: 'References a DNSKEY record in a subzone to establish DNSSEC chain of trust.',
    color: '#8b5cf6', // violet
    badge: 'DNSSEC',
  },
  DNSKEY: {
    name: 'DNS Key Record',
    desc: 'Holds public signing keys used by DNSSEC to cryptographically sign DNS zone data.',
    color: '#06b6d4', // cyan-600
    badge: 'DNSSEC Key',
  },
};

/** Standard DNS record types in exact order matching DNSChecker lookup UI */
export const DNS_RECORD_ORDER = [
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'NS',
  'PTR',
  'SOA',
  'SPF',
  'TXT',
  'CAA',
  'DS',
  'DNSKEY',
];

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

export function formatSecondsToTime(seconds) {
  const s = Number(seconds);
  if (seconds == null || Number.isNaN(s)) return '—';
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${s}s (${Math.round(s / 60)}m)`;
  if (s < 86400) return `${s}s (${(s / 3600).toFixed(1)}h)`;
  return `${s}s (${(s / 86400).toFixed(1)}d)`;
}

export function formatHostmaster(hm) {
  if (!hm) return '—';
  const str = String(hm).trim();
  if (str.includes('@')) return str;
  if (str.includes('.')) {
    const idx = str.indexOf('.');
    return `${str.slice(0, idx)}@${str.slice(idx + 1)}`;
  }
  return str;
}

/** Convert ISO 3166-1 alpha-2 country code to emoji flag */
export function getFlagEmoji(countryCode) {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
    return '🌐';
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/** Offline IP / host country heuristic to instantly show country flags */
export function detectIpCountry(ip, hostname = '') {
  const hostStr = String(hostname || '').toLowerCase();
  const ipStr = String(ip || '').trim();

  // Known major US cloud providers & mail exchanges
  if (
    hostStr.includes('google') ||
    hostStr.includes('aspmx') ||
    hostStr.includes('gmail') ||
    hostStr.includes('cloudflare') ||
    hostStr.includes('outlook') ||
    hostStr.includes('microsoft') ||
    hostStr.includes('aws') ||
    hostStr.includes('amazon') ||
    ipStr.startsWith('142.250.') ||
    ipStr.startsWith('172.217.') ||
    ipStr.startsWith('108.177.') ||
    ipStr.startsWith('74.125.') ||
    ipStr.startsWith('64.233.') ||
    ipStr.startsWith('104.') ||
    ipStr.startsWith('172.67.') ||
    ipStr.startsWith('162.159.') ||
    ipStr.startsWith('151.101.') ||
    ipStr.startsWith('52.') ||
    ipStr.startsWith('54.') ||
    ipStr.startsWith('40.') ||
    ipStr.startsWith('20.')
  ) {
    return { code: 'US', flag: '🇺🇸', name: 'United States' };
  }

  // TLD based checks
  if (hostStr.endsWith('.de')) return { code: 'DE', flag: '🇩🇪', name: 'Germany' };
  if (hostStr.endsWith('.uk') || hostStr.endsWith('.co.uk')) return { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' };
  if (hostStr.endsWith('.fr')) return { code: 'FR', flag: '🇫🇷', name: 'France' };
  if (hostStr.endsWith('.in')) return { code: 'IN', flag: '🇮🇳', name: 'India' };
  if (hostStr.endsWith('.nl')) return { code: 'NL', flag: '🇳🇱', name: 'Netherlands' };
  if (hostStr.endsWith('.ca')) return { code: 'CA', flag: '🇨🇦', name: 'Canada' };
  if (hostStr.endsWith('.au')) return { code: 'AU', flag: '🇦🇺', name: 'Australia' };
  if (hostStr.endsWith('.jp')) return { code: 'JP', flag: '🇯🇵', name: 'Japan' };

  return { code: 'US', flag: '🇺🇸', name: 'United States' };
}

/** Extract SPF record string from TXT records */
export function extractSpfRecord(txtRecords) {
  if (!txtRecords) return null;
  const list = Array.isArray(txtRecords) ? txtRecords : [txtRecords];
  for (const item of list) {
    const str = String(item).trim();
    if (/^v=spf1(\s|$)/i.test(str)) {
      return str;
    }
  }
  return null;
}

/** Parse SPF mechanisms into structured tokens */
export function parseSpfMechanisms(spfStr) {
  if (!spfStr) return { valid: false, version: 'spf1', mechanisms: [], raw: '' };
  const parts = spfStr.split(/\s+/).filter(Boolean);
  const version = parts[0] || 'v=spf1';
  const mechanisms = parts.slice(1).map((part) => {
    let qualifier = '+';
    let term = part;
    if (['+', '-', '~', '?'].includes(part[0])) {
      qualifier = part[0];
      term = part.slice(1);
    }
    const qualifierDesc =
      qualifier === '+'
        ? 'Pass (Permitted sender)'
        : qualifier === '-'
          ? 'Fail (Reject unauthorized sender)'
          : qualifier === '~'
            ? 'SoftFail (Accept with warning)'
            : 'Neutral (No policy statement)';
    return {
      raw: part,
      qualifier,
      qualifierDesc,
      term,
    };
  });

  return {
    valid: /^v=spf1/i.test(version),
    version,
    mechanisms,
    raw: spfStr,
  };
}

/** Classify TXT record content */
export function classifyTxtRecord(txt) {
  const s = String(txt || '').trim();
  if (/^v=spf1(\s|$)/i.test(s)) return { type: 'SPF', badge: 'SPF Email Auth', color: 'var(--green)' };
  if (/^v=DMARC1/i.test(s)) return { type: 'DMARC', badge: 'DMARC Policy', color: 'var(--cyan)' };
  if (/google-site-verification=/i.test(s)) return { type: 'Google', badge: 'Google Verification', color: '#4285F4' };
  if (/MS=|MS-/i.test(s)) return { type: 'Microsoft', badge: 'Microsoft 365 Verification', color: '#00a4ef' };
  if (/apple-domain-verification=/i.test(s)) return { type: 'Apple', badge: 'Apple Verification', color: '#a2aaad' };
  if (/atlassian-domain-verification=/i.test(s)) return { type: 'Atlassian', badge: 'Atlassian Verification', color: '#0052cc' };
  if (/stripe-verification=/i.test(s)) return { type: 'Stripe', badge: 'Stripe Verification', color: '#635bff' };
  if (/facebook-domain-verification=/i.test(s)) return { type: 'Facebook', badge: 'Meta Verification', color: '#0668e1' };
  return { type: 'General', badge: 'TXT Record', color: 'var(--muted-2)' };
}

/**
 * Extract, normalize and structure all 12 DNS record types matching the DNSChecker layout.
 * @param {object} records - Raw records object from backend
 * @param {string} hostname - Domain hostname
 * @returns {object} Map of type -> structured record object
 */
export function extractAllRecordTypes(records = {}, hostname = '') {
  const result = {};

  // 1. A Records
  const aRaw = records.A;
  const aFound = aRaw?.status === 'found' && Boolean(aRaw?.data);
  const aData = aFound
    ? (Array.isArray(aRaw.data) ? aRaw.data : [aRaw.data]).map((item) => {
        const address = typeof item === 'object' ? item.address || '' : String(item);
        const ttl = typeof item === 'object' ? item.ttl ?? 300 : 300;
        return {
          host: hostname || '@',
          address,
          ttl,
          class: 'IN',
          type: 'A',
          country: detectIpCountry(address, hostname),
        };
      })
    : [];
  result.A = {
    type: 'A',
    count: aData.length,
    label: aData.length > 0 ? `A (${aData.length} Records)` : 'A',
    status: aFound ? 'found' : aRaw?.status || 'not_found',
    data: aData,
  };

  // 2. AAAA Records
  const aaaaRaw = records.AAAA;
  const aaaaFound = aaaaRaw?.status === 'found' && Boolean(aaaaRaw?.data);
  const aaaaData = aaaaFound
    ? (Array.isArray(aaaaRaw.data) ? aaaaRaw.data : [aaaaRaw.data]).map((item) => {
        const address = typeof item === 'object' ? item.address || '' : String(item);
        const ttl = typeof item === 'object' ? item.ttl ?? 300 : 300;
        return {
          host: hostname || '@',
          address,
          ttl,
          class: 'IN',
          type: 'AAAA',
        };
      })
    : [];
  result.AAAA = {
    type: 'AAAA',
    count: aaaaData.length,
    label: aaaaData.length > 0 ? `AAAA (${aaaaData.length} Records)` : 'AAAA',
    status: aaaaFound ? 'found' : aaaaRaw?.status || 'not_found',
    data: aaaaData,
  };

  // 3. CNAME Records
  const cnameRaw = records.CNAME;
  const cnameFound = cnameRaw?.status === 'found' && Boolean(cnameRaw?.data);
  const cnameList = cnameFound
    ? (Array.isArray(cnameRaw.data) ? cnameRaw.data : [cnameRaw.data]).map((target) => ({
        host: hostname || '@',
        target: String(target),
        ttl: 300,
        class: 'IN',
        type: 'CNAME',
      }))
    : [];
  result.CNAME = {
    type: 'CNAME',
    count: cnameList.length,
    label: cnameList.length > 0 ? `CNAME (${cnameList.length} Records)` : 'CNAME',
    status: cnameFound ? 'found' : cnameRaw?.status || 'not_found',
    data: cnameList,
  };

  // 4. MX Records
  const mxRaw = records.MX;
  const mxFound = mxRaw?.status === 'found' && Boolean(mxRaw?.data);
  const mxList = mxFound
    ? (Array.isArray(mxRaw.data) ? mxRaw.data : [mxRaw.data]).map((item) => {
        const exchange = typeof item === 'object' ? item.exchange || '' : String(item);
        const priority = typeof item === 'object' ? item.priority ?? 10 : 10;
        const ip = typeof item === 'object' ? item.ip || item.address || '' : '';
        const country = detectIpCountry(ip, exchange);
        return {
          priority,
          exchange,
          host: exchange,
          ip,
          ttl: typeof item === 'object' ? item.ttl ?? 300 : 300,
          country,
          class: 'IN',
          type: 'MX',
        };
      })
    : [];
  result.MX = {
    type: 'MX',
    count: mxList.length,
    label: mxList.length > 0 ? `MX (${mxList.length} Records)` : 'MX',
    status: mxFound ? 'found' : mxRaw?.status || 'not_found',
    data: mxList,
  };

  // 5. NS Records
  const nsRaw = records.NS;
  const nsFound = nsRaw?.status === 'found' && Boolean(nsRaw?.data);
  const nsList = nsFound
    ? (Array.isArray(nsRaw.data) ? nsRaw.data : [nsRaw.data]).map((ns) => ({
        host: hostname || '@',
        nameserver: String(ns),
        ttl: 300,
        class: 'IN',
        type: 'NS',
      }))
    : [];
  result.NS = {
    type: 'NS',
    count: nsList.length,
    label: nsList.length > 0 ? `NS (${nsList.length} Records)` : 'NS',
    status: nsFound ? 'found' : nsRaw?.status || 'not_found',
    data: nsList,
  };

  // 6. PTR Records
  const ptrRaw = records.PTR;
  const ptrFound = ptrRaw?.status === 'found' && Boolean(ptrRaw?.data);
  const ptrList = ptrFound
    ? (Array.isArray(ptrRaw.data) ? ptrRaw.data : [ptrRaw.data]).map((target) => ({
        host: hostname || '@',
        target: String(target),
        ttl: 300,
        class: 'IN',
        type: 'PTR',
      }))
    : [];
  result.PTR = {
    type: 'PTR',
    count: ptrList.length,
    label: ptrList.length > 0 ? `PTR (${ptrList.length} Records)` : 'PTR',
    status: ptrFound ? 'found' : ptrRaw?.status || 'not_found',
    data: ptrList,
  };

  // 7. SOA Records
  const soaRaw = records.SOA;
  const soaFound = soaRaw?.status === 'found' && Boolean(soaRaw?.data);
  result.SOA = {
    type: 'SOA',
    count: soaFound ? 1 : 0,
    label: soaFound ? 'SOA (1 Records)' : 'SOA',
    status: soaFound ? 'found' : soaRaw?.status || 'not_found',
    data: soaFound ? soaRaw.data : null,
  };

  // 8. SPF (Extracted from TXT)
  const txtRaw = records.TXT;
  const allTxtList =
    txtRaw?.status === 'found' && Boolean(txtRaw?.data)
      ? (Array.isArray(txtRaw.data) ? txtRaw.data : [txtRaw.data]).map(String)
      : [];
  const spfString = extractSpfRecord(allTxtList);
  const spfParsed = spfString ? parseSpfMechanisms(spfString) : null;
  result.SPF = {
    type: 'SPF',
    count: spfString ? 1 : 0,
    label: spfString ? 'SPF (1 Records)' : 'SPF',
    status: spfString ? 'found' : 'not_found',
    data: spfParsed,
  };

  // 9. TXT Records (remaining non-SPF records, or all TXT records)
  const nonSpfTxtList = allTxtList.filter((t) => !/^v=spf1(\s|$)/i.test(t.trim()));
  const txtDisplayList = nonSpfTxtList.length > 0 ? nonSpfTxtList : allTxtList;
  result.TXT = {
    type: 'TXT',
    count: txtDisplayList.length,
    label: txtDisplayList.length > 0 ? `TXT (${txtDisplayList.length} Records)` : 'TXT',
    status: txtDisplayList.length > 0 ? 'found' : txtRaw?.status || 'not_found',
    data: txtDisplayList.map((txt) => ({
      host: hostname || '@',
      text: txt,
      ...classifyTxtRecord(txt),
    })),
  };

  // 10. CAA Records
  const caaRaw = records.CAA;
  const caaFound = caaRaw?.status === 'found' && Boolean(caaRaw?.data);
  const caaList = caaFound
    ? (Array.isArray(caaRaw.data) ? caaRaw.data : [caaRaw.data]).map((item) => ({
        host: hostname || '@',
        critical: item.critical ?? 0,
        tag: item.issue ? 'issue' : item.issuewild ? 'issuewild' : item.iodef ? 'iodef' : 'tag',
        value: item.issue || item.issuewild || item.iodef || JSON.stringify(item),
        class: 'IN',
        type: 'CAA',
      }))
    : [];
  result.CAA = {
    type: 'CAA',
    count: caaList.length,
    label: caaList.length > 0 ? `CAA (${caaList.length} Records)` : 'CAA',
    status: caaFound ? 'found' : caaRaw?.status || 'not_found',
    data: caaList,
  };

  // 11. DS Records (DNSSEC)
  const dsRaw = records.DS;
  const dsFound = dsRaw?.status === 'found' && Boolean(dsRaw?.data);
  const dsList = dsFound ? (Array.isArray(dsRaw.data) ? dsRaw.data : [dsRaw.data]) : [];
  result.DS = {
    type: 'DS',
    count: dsList.length,
    label: dsList.length > 0 ? `DS (${dsList.length} Records)` : 'DS',
    status: dsFound ? 'found' : 'not_found',
    data: dsList,
  };

  // 12. DNSKEY Records (DNSSEC)
  const dnskeyRaw = records.DNSKEY;
  const dnskeyFound = dnskeyRaw?.status === 'found' && Boolean(dnskeyRaw?.data);
  const dnskeyList = dnskeyFound
    ? (Array.isArray(dnskeyRaw.data) ? dnskeyRaw.data : [dnskeyRaw.data])
    : [];
  result.DNSKEY = {
    type: 'DNSKEY',
    count: dnskeyList.length,
    label: dnskeyList.length > 0 ? `DNSKEY (${dnskeyList.length} Records)` : 'DNSKEY',
    status: dnskeyFound ? 'found' : 'not_found',
    data: dnskeyList,
  };

  return result;
}

/** Optional asynchronous host IP resolver using Google Public DNS DoH */
export async function resolveHostIp(hostname) {
  if (!hostname || typeof hostname !== 'string') return null;
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`, {
      headers: { Accept: 'application/dns-json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const answer = json?.Answer?.find((a) => a.type === 1);
    if (answer?.data) {
      return {
        ip: answer.data,
        ttl: answer.TTL || 300,
        country: detectIpCountry(answer.data, hostname),
      };
    }
    return null;
  } catch {
    return null;
  }
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
