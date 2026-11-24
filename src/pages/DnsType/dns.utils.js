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
    if (item == null) continue;
    const str = typeof item === 'object' ? (item.value || item.text || '') : String(item);
    const trimmed = str.trim();
    if (/^v=spf1(\s|$)/i.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

/** Parse SPF mechanisms into structured tokens */
export function parseSpfMechanisms(spfStr) {
  if (!spfStr || typeof spfStr !== 'string') return { valid: false, version: 'spf1', mechanisms: [], raw: '' };
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

export function normalizeRecordSource(records, type) {
  if (!records || typeof records !== 'object') {
    return { found: false, list: [], status: 'not_found' };
  }
  const upper = String(type).toUpperCase();
  const lower = String(type).toLowerCase();
  const raw = records[upper] !== undefined ? records[upper] : records[lower];

  if (!raw) {
    return { found: false, list: [], status: 'not_found' };
  }

  if (Array.isArray(raw)) {
    const list = raw.filter((item) => item != null);
    return {
      found: list.length > 0,
      list,
      status: list.length > 0 ? 'found' : 'not_found',
    };
  }

  if (typeof raw === 'object' && raw !== null) {
    if (raw.data !== undefined) {
      const rawDataList = Array.isArray(raw.data) ? raw.data : raw.data != null ? [raw.data] : [];
      const list = rawDataList.filter((item) => item != null);
      const found = list.length > 0;
      return {
        found,
        list,
        status: found ? 'found' : (raw.status || 'not_found'),
      };
    }
    // Single object structure (e.g. SOA object or single record)
    if (raw.status && raw.status !== 'found' && !raw.mname && !raw.nsname && !raw.value && !raw.ip && !raw.address) {
      return {
        found: false,
        list: [],
        status: raw.status || 'not_found',
      };
    }
    return {
      found: true,
      list: [raw],
      status: 'found',
    };
  }

  if (typeof raw === 'string' && raw.trim()) {
    return {
      found: true,
      list: [raw.trim()],
      status: 'found',
    };
  }

  return { found: false, list: [], status: 'not_found' };
}

/**
 * Extract, normalize and structure all 12 DNS record types matching the DNSChecker layout.
 * @param {object} records - Raw records object from backend
 * @param {string} hostname - Domain hostname
 * @returns {object} Map of type -> structured record object
 */
export function extractAllRecordTypes(records = {}, hostname = '') {
  const result = {};
  const safeRecords = records && typeof records === 'object' ? records : {};

  // 1. A Records
  try {
    const aSrc = normalizeRecordSource(safeRecords, 'A');
    const aData = aSrc.found
      ? aSrc.list
          .map((item) => {
            if (!item) return null;
            const isObj = typeof item === 'object' && item !== null;
            const address = isObj ? item.address || item.ip || '' : String(item);
            if (!address) return null;
            const ttl = isObj ? (item.ttl ?? 300) : 300;
            const host = isObj ? item.name || hostname || '@' : hostname || '@';
            return {
              host,
              address,
              ttl,
              class: 'IN',
              type: 'A',
              country: detectIpCountry(address, host),
            };
          })
          .filter(Boolean)
      : [];
    result.A = {
      type: 'A',
      count: aData.length,
      label: aData.length > 0 ? `A (${aData.length} Records)` : 'A',
      status: aData.length > 0 ? 'found' : aSrc.status,
      data: aData,
    };
  } catch (err) {
    console.error('[DNS] Error extracting A records:', err);
    result.A = { type: 'A', count: 0, label: 'A', status: 'error', data: [] };
  }

  // 2. AAAA Records
  try {
    const aaaaSrc = normalizeRecordSource(safeRecords, 'AAAA');
    const aaaaData = aaaaSrc.found
      ? aaaaSrc.list
          .map((item) => {
            if (!item) return null;
            const isObj = typeof item === 'object' && item !== null;
            const address = isObj ? item.address || item.ip || '' : String(item);
            if (!address) return null;
            const ttl = isObj ? (item.ttl ?? 300) : 300;
            return {
              host: isObj ? item.name || hostname || '@' : hostname || '@',
              address,
              ttl,
              class: 'IN',
              type: 'AAAA',
            };
          })
          .filter(Boolean)
      : [];
    result.AAAA = {
      type: 'AAAA',
      count: aaaaData.length,
      label: aaaaData.length > 0 ? `AAAA (${aaaaData.length} Records)` : 'AAAA',
      status: aaaaData.length > 0 ? 'found' : aaaaSrc.status,
      data: aaaaData,
    };
  } catch (err) {
    console.error('[DNS] Error extracting AAAA records:', err);
    result.AAAA = { type: 'AAAA', count: 0, label: 'AAAA', status: 'error', data: [] };
  }

  // 3. CNAME Records
  try {
    const cnameSrc = normalizeRecordSource(safeRecords, 'CNAME');
    const cnameList = cnameSrc.found
      ? cnameSrc.list
          .map((item) => {
            if (!item) return null;
            const isObj = typeof item === 'object' && item !== null;
            const target = isObj
              ? item.canonical || item.value || item.target || item.data || ''
              : String(item);
            if (!target) return null;
            const ttl = isObj ? (item.ttl ?? 300) : 300;
            return {
              host: isObj ? item.name || hostname || '@' : hostname || '@',
              target,
              ttl,
              class: 'IN',
              type: 'CNAME',
            };
          })
          .filter(Boolean)
      : [];
    result.CNAME = {
      type: 'CNAME',
      count: cnameList.length,
      label: cnameList.length > 0 ? `CNAME (${cnameList.length} Records)` : 'CNAME',
      status: cnameList.length > 0 ? 'found' : cnameSrc.status,
      data: cnameList,
    };
  } catch (err) {
    console.error('[DNS] Error extracting CNAME records:', err);
    result.CNAME = { type: 'CNAME', count: 0, label: 'CNAME', status: 'error', data: [] };
  }

  // 4. MX Records
  try {
    const mxSrc = normalizeRecordSource(safeRecords, 'MX');
    const mxList = mxSrc.found
      ? mxSrc.list
          .map((item) => {
            if (!item) return null;
            let exchange = '';
            let priority = 10;
            let ip = '';
            let ttl = 300;
            const isObj = typeof item === 'object' && item !== null;
            if (isObj) {
              exchange = item.exchange || item.mx || item.host || '';
              priority = item.priority ?? item.preference ?? 10;
              ip = item.ip || item.address || '';
              ttl = item.ttl ?? item.mxTtl ?? 300;
            } else if (typeof item === 'string') {
              const parts = item.trim().split(/\s+/);
              if (parts.length >= 2 && !isNaN(parts[0])) {
                priority = parseInt(parts[0], 10);
                exchange = parts[1];
              } else {
                exchange = item;
              }
            }
            if (!exchange && !ip) return null;
            const country = detectIpCountry(ip, exchange);
            return {
              priority,
              exchange,
              host: isObj ? item.name || exchange : exchange,
              ip,
              ttl,
              country,
              class: 'IN',
              type: 'MX',
            };
          })
          .filter(Boolean)
      : [];
    result.MX = {
      type: 'MX',
      count: mxList.length,
      label: mxList.length > 0 ? `MX (${mxList.length} Records)` : 'MX',
      status: mxList.length > 0 ? 'found' : mxSrc.status,
      data: mxList,
    };
  } catch (err) {
    console.error('[DNS] Error extracting MX records:', err);
    result.MX = { type: 'MX', count: 0, label: 'MX', status: 'error', data: [] };
  }

  // 5. NS Records
  try {
    const nsSrc = normalizeRecordSource(safeRecords, 'NS');
    const nsList = nsSrc.found
      ? nsSrc.list
          .map((ns) => {
            if (!ns) return null;
            const isObj = typeof ns === 'object' && ns !== null;
            const nameserver = isObj
              ? ns.value || ns.nameserver || ns.target || ns.data || ''
              : String(ns);
            if (!nameserver) return null;
            const ttl = isObj ? (ns.ttl ?? 300) : 300;
            return {
              host: isObj ? ns.name || hostname || '@' : hostname || '@',
              nameserver,
              ttl,
              class: 'IN',
              type: 'NS',
            };
          })
          .filter(Boolean)
      : [];
    result.NS = {
      type: 'NS',
      count: nsList.length,
      label: nsList.length > 0 ? `NS (${nsList.length} Records)` : 'NS',
      status: nsList.length > 0 ? 'found' : nsSrc.status,
      data: nsList,
    };
  } catch (err) {
    console.error('[DNS] Error extracting NS records:', err);
    result.NS = { type: 'NS', count: 0, label: 'NS', status: 'error', data: [] };
  }

  // 6. PTR Records
  try {
    const ptrSrc = normalizeRecordSource(safeRecords, 'PTR');
    const ptrList = ptrSrc.found
      ? ptrSrc.list
          .map((item) => {
            if (!item) return null;
            const isObj = typeof item === 'object' && item !== null;
            const target = isObj
              ? item.value || item.target || item.ptrdname || item.data || ''
              : String(item);
            if (!target) return null;
            const ttl = isObj ? (item.ttl ?? 300) : 300;
            return {
              host: isObj ? item.name || hostname || '@' : hostname || '@',
              target,
              ttl,
              class: 'IN',
              type: 'PTR',
            };
          })
          .filter(Boolean)
      : [];
    result.PTR = {
      type: 'PTR',
      count: ptrList.length,
      label: ptrList.length > 0 ? `PTR (${ptrList.length} Records)` : 'PTR',
      status: ptrList.length > 0 ? 'found' : ptrSrc.status,
      data: ptrList,
    };
  } catch (err) {
    console.error('[DNS] Error extracting PTR records:', err);
    result.PTR = { type: 'PTR', count: 0, label: 'PTR', status: 'error', data: [] };
  }

  // 7. SOA Records
  try {
    const soaSrc = normalizeRecordSource(safeRecords, 'SOA');
    const soaDataRaw = soaSrc.found
      ? (Array.isArray(soaSrc.list)
          ? soaSrc.list.find((x) => x && typeof x === 'object')
          : (soaSrc.list && typeof soaSrc.list === 'object' ? soaSrc.list : null))
      : null;
    const mappedSoa = soaDataRaw
      ? {
          nsname: soaDataRaw.nsname || soaDataRaw.mname || soaDataRaw.primary || '',
          hostmaster: soaDataRaw.hostmaster || soaDataRaw.rname || soaDataRaw.admin || '',
          serial: soaDataRaw.serial ?? null,
          refresh: soaDataRaw.refresh ?? null,
          retry: soaDataRaw.retry ?? null,
          expire: soaDataRaw.expire ?? null,
          minttl: soaDataRaw.minttl ?? soaDataRaw.minimum ?? soaDataRaw.ttl ?? null,
        }
      : null;
    result.SOA = {
      type: 'SOA',
      count: mappedSoa ? 1 : 0,
      label: mappedSoa ? 'SOA (1 Records)' : 'SOA',
      status: mappedSoa ? 'found' : soaSrc.status,
      data: mappedSoa,
    };
  } catch (err) {
    console.error('[DNS] Error extracting SOA records:', err);
    result.SOA = { type: 'SOA', count: 0, label: 'SOA', status: 'error', data: null };
  }

  // 8. SPF (Extracted from TXT or direct)
  let allTxtList = [];
  try {
    const txtSrc = normalizeRecordSource(safeRecords, 'TXT');
    const rawTxtArray = txtSrc.found ? txtSrc.list : [];
    allTxtList = rawTxtArray
      .filter((item) => item != null)
      .map((item) => {
        if (Array.isArray(item)) return item.filter((x) => x != null).join('');
        if (typeof item === 'object' && item !== null) {
          return item.value != null ? String(item.value) : (item.text != null ? String(item.text) : (item.data != null ? String(item.data) : JSON.stringify(item)));
        }
        return String(item ?? '');
      })
      .filter((str) => str.trim().length > 0);

    const spfSrc = normalizeRecordSource(safeRecords, 'SPF');
    const spfDirect = spfSrc.found
      ? (Array.isArray(spfSrc.list) ? spfSrc.list.find((x) => x != null) : spfSrc.list)
      : null;

    let spfDirectValue = '';
    if (spfDirect && typeof spfDirect === 'object') {
      spfDirectValue = spfDirect.value != null ? String(spfDirect.value) : (spfDirect.text != null ? String(spfDirect.text) : (spfDirect.data != null ? String(spfDirect.data) : ''));
    } else if (typeof spfDirect === 'string') {
      spfDirectValue = spfDirect;
    }

    const spfString = extractSpfRecord(allTxtList) || (spfDirectValue ? spfDirectValue.trim() : null);
    const spfParsed = spfString ? parseSpfMechanisms(spfString) : null;
    result.SPF = {
      type: 'SPF',
      count: spfString ? 1 : 0,
      label: spfString ? 'SPF (1 Records)' : 'SPF',
      status: spfString ? 'found' : 'not_found',
      data: spfParsed,
    };
  } catch (err) {
    console.error('[DNS] Error extracting SPF records:', err);
    result.SPF = { type: 'SPF', count: 0, label: 'SPF', status: 'error', data: null };
  }

  // 9. TXT Records (remaining non-SPF records, or all TXT records)
  try {
    const txtSrc = normalizeRecordSource(safeRecords, 'TXT');
    const txtDisplayData = allTxtList.filter((item) => {
      return !/^v=spf1(\s|$)/i.test(String(item).trim());
    });
    const finalTxtList = txtDisplayData.length > 0 ? txtDisplayData : allTxtList;

    const txtData = finalTxtList
      .map((item) => {
        if (item == null) return null;
        const isObj = typeof item === 'object' && item !== null;
        const text = isObj
          ? (item.value != null ? String(item.value) : (item.text != null ? String(item.text) : JSON.stringify(item)))
          : String(item);
        const ttl = isObj ? (item.ttl ?? 300) : 300;
        return {
          host: isObj ? item.name || hostname || '@' : hostname || '@',
          text,
          ttl,
          ...classifyTxtRecord(text),
        };
      })
      .filter(Boolean);

    result.TXT = {
      type: 'TXT',
      count: txtData.length,
      label: txtData.length > 0 ? `TXT (${txtData.length} Records)` : 'TXT',
      status: txtData.length > 0 ? 'found' : txtSrc.status,
      data: txtData,
    };
  } catch (err) {
    console.error('[DNS] Error extracting TXT records:', err);
    result.TXT = { type: 'TXT', count: 0, label: 'TXT', status: 'error', data: [] };
  }

  // 10. CAA Records
  try {
    const caaSrc = normalizeRecordSource(safeRecords, 'CAA');
    const caaList = caaSrc.found
      ? caaSrc.list
          .map((item) => {
            if (!item) return null;
            const isObj = typeof item === 'object' && item !== null;
            if (!isObj) {
              return {
                host: hostname || '@',
                critical: 0,
                tag: 'issue',
                value: String(item),
                ttl: 300,
                class: 'IN',
                type: 'CAA',
              };
            }
            const val =
              item.value ?? item.issue ?? item.issuewild ?? item.iodef ?? '';
            return {
              host: item.name || hostname || '@',
              critical: item.critical ?? item.flags ?? 0,
              tag: item.tag || (item.issue ? 'issue' : item.issuewild ? 'issuewild' : item.iodef ? 'iodef' : 'tag'),
              value: typeof val === 'object' ? JSON.stringify(val) : String(val),
              ttl: item.ttl ?? 300,
              class: 'IN',
              type: 'CAA',
            };
          })
          .filter(Boolean)
      : [];
    result.CAA = {
      type: 'CAA',
      count: caaList.length,
      label: caaList.length > 0 ? `CAA (${caaList.length} Records)` : 'CAA',
      status: caaList.length > 0 ? 'found' : caaSrc.status,
      data: caaList,
    };
  } catch (err) {
    console.error('[DNS] Error extracting CAA records:', err);
    result.CAA = { type: 'CAA', count: 0, label: 'CAA', status: 'error', data: [] };
  }

  // 11. DS Records (DNSSEC)
  try {
    const dsSrc = normalizeRecordSource(safeRecords, 'DS');
    const dsRawList = dsSrc.found ? (Array.isArray(dsSrc.list) ? dsSrc.list : [dsSrc.list]) : [];
    const dsList = dsRawList.filter((item) => item != null);
    result.DS = {
      type: 'DS',
      count: dsList.length,
      label: dsList.length > 0 ? `DS (${dsList.length} Records)` : 'DS',
      status: dsList.length > 0 ? 'found' : 'not_found',
      data: dsList,
    };
  } catch (err) {
    console.error('[DNS] Error extracting DS records:', err);
    result.DS = { type: 'DS', count: 0, label: 'DS', status: 'error', data: [] };
  }

  // 12. DNSKEY Records (DNSSEC)
  try {
    const dnskeySrc = normalizeRecordSource(safeRecords, 'DNSKEY');
    const dnskeyRawList = dnskeySrc.found
      ? (Array.isArray(dnskeySrc.list) ? dnskeySrc.list : [dnskeySrc.list])
      : [];
    const dnskeyList = dnskeyRawList.filter((item) => item != null);
    result.DNSKEY = {
      type: 'DNSKEY',
      count: dnskeyList.length,
      label: dnskeyList.length > 0 ? `DNSKEY (${dnskeyList.length} Records)` : 'DNSKEY',
      status: dnskeyList.length > 0 ? 'found' : 'not_found',
      data: dnskeyList,
    };
  } catch (err) {
    console.error('[DNS] Error extracting DNSKEY records:', err);
    result.DNSKEY = { type: 'DNSKEY', count: 0, label: 'DNSKEY', status: 'error', data: [] };
  }

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
  let raw = entry.result || entry;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = {};
    }
  }
  if (!raw || typeof raw !== 'object') {
    raw = {};
  }

  const id = entry._id != null
    ? String(entry._id)
    : entry.id != null
      ? String(entry.id)
      : entry.jobId != null
        ? String(entry.jobId)
        : createId();

  const dbId = entry._id != null
    ? String(entry._id)
    : entry.dnsRecordId != null
      ? String(entry.dnsRecordId)
      : entry.id != null
        ? String(entry.id)
        : null;

  const hostname = raw.hostname || entry.url || entry.hostname || '';
  const resolver = raw.resolver || 'system';
  const resolvedAt =
    entry.completedAt || entry.createdAt || raw.resolvedAt || new Date().toISOString();
  const durationMs = raw.durationMs ?? 0;

  let records = raw.records || (raw && typeof raw === 'object' && !raw.records ? raw : {});
  if (typeof records === 'string') {
    try {
      records = JSON.parse(records);
    } catch {
      records = {};
    }
  }
  if (!records || typeof records !== 'object') {
    records = {};
  }

  const status = entry.status || raw.status || 'completed';
  const error = entry.error || raw.error || null;

  // Calculate actual found count across record types
  const parsedMap = extractAllRecordTypes(records, hostname);
  const foundCount = Object.values(parsedMap).filter((r) => r.count > 0).length;

  const summary = raw.summary || {
    found: foundCount,
    notFound: DNS_RECORD_ORDER.length - foundCount,
    error: 0,
    domainExists: foundCount > 0,
  };
  if (summary.found === 0 && foundCount > 0) {
    summary.found = foundCount;
    summary.domainExists = true;
  }

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
