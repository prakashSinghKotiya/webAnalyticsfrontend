/**
 * Uptime feature — pure helpers, formatting, and constants.
 * Deliberately side-effect free so it is fast, portable, and easily testable.
 */

export const DEFAULT_PAGE_SIZE = 6;
export const PAGE_SIZE_OPTIONS = Object.freeze([6, 12, 24]);
export const DEFAULT_RESULTS_LIMIT = 6;

/** Standard HTTP status code text mapping */
export const HTTP_STATUS_TEXT = Object.freeze({
  100: 'Continue',
  101: 'Switching protocols',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No content',
  301: 'Moved permanently',
  302: 'Found',
  303: 'See other',
  304: 'Not modified',
  307: 'Temporary redirect',
  308: 'Permanent redirect',
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  405: 'Method not allowed',
  408: 'Request timeout',
  429: 'Too many requests',
  500: 'Internal server error',
  502: 'Bad gateway',
  503: 'Service unavailable',
  504: 'Gateway timeout',
});

/**
 * Normalizes user-entered URL (adds https:// if missing).
 */
export function normalizeUrl(input) {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Validates absolute http/https URL.
 */
export function isValidUrl(candidate) {
  try {
    const parsed = new URL(candidate);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Formats milliseconds into clean string with unit.
 * >= 1000ms -> "1.36 s"
 * < 1000ms -> "101 ms"
 */
export function formatMs(value) {
  const n = Number(value);
  if (value == null || !Number.isFinite(n)) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`;
}

/**
 * Formats interval tokens ("1m", "5m", "1h") into human-friendly text.
 */
export function formatInterval(interval) {
  switch (interval) {
    case '1m':
      return 'Every 1 min';
    case '5m':
      return 'Every 5 mins';
    case '10m':
    case '15m':
      return 'Every 15 mins';
    case '30m':
      return 'Every 30 mins';
    case '1h':
      return 'Every 1 hour';
    default:
      return interval || '—';
  }
}

/**
 * Formats interval tokens into lowercase "checked every X min"
 */
export function formatCheckedInterval(interval) {
  switch (interval) {
    case '1m':
      return 'checked every 1 min';
    case '5m':
      return 'checked every 5 min';
    case '10m':
    case '15m':
      return 'checked every 15 min';
    case '30m':
      return 'checked every 30 min';
    case '1h':
      return 'checked every 1 hr';
    default:
      return `checked ${interval || 'regularly'}`;
  }
}

/**
 * Parses runner execution string from check result, detecting automatic fallback.
 * e.g., "AWS Lambda Mumbai->local-fallback" or "Secondary VPS Runner" or "Main Server"
 */
export function parseRunnerInfo(runnerStr) {
  if (!runnerStr || typeof runnerStr !== 'string') {
    return {
      name: 'Main Server',
      displayName: 'Main Server',
      type: 'local',
      isFallback: false,
      fallbackOriginal: null,
      badgeText: 'Local Runner',
    };
  }

  const isFallback = runnerStr.includes('->local-fallback');
  const fallbackOriginal = isFallback ? runnerStr.replace('->local-fallback', '').trim() : null;
  const displayName = isFallback ? `${fallbackOriginal} (Local Fallback)` : runnerStr.trim();

  let type = 'local';
  const lower = runnerStr.toLowerCase();
  if (lower.includes('lambda')) {
    type = 'lambda';
  } else if (lower.includes('http') || lower.includes('vps') || lower.includes('remote')) {
    type = 'http';
  }

  const badgeText = isFallback ? 'Local Fallback' : runnerStr;

  return {
    name: runnerStr,
    displayName,
    type,
    isFallback,
    fallbackOriginal,
    badgeText,
  };
}

/**
 * Determines whether a check is UP, SLOW, or DOWN.
 */
export function getCheckCategory(check) {
  if (!check) return 'UP';
  const status = String(check.status || '').toUpperCase();
  const httpStatus = Number(check.httpStatus);
  const totalMs = Number(check.TotalresponseTime ?? check.responseTime ?? 0);

  if (status === 'DOWN' || (httpStatus >= 500 && httpStatus <= 599) || check.error) {
    return 'DOWN';
  }
  if (status === 'DEGRADED' || status === 'SLOW' || totalMs >= 1000) {
    return 'SLOW';
  }
  return 'UP';
}

/**
 * Status tokens, labels, and badges.
 * status: "UP" | "DEGRADED" | "DOWN" | "SLOW" | "active" | "paused"
 */
export function getStatusMeta(status, latencyMs) {
  const s = String(status || '').toUpperCase();
  const isSlow = latencyMs != null && Number(latencyMs) >= 1000;

  if (s === 'DOWN' || s === 'OUTAGE') {
    return {
      label: 'Website is down',
      historyLabel: 'Down',
      color: '#ef4444',
      dotColor: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.10)',
      borderColor: 'rgba(239, 68, 68, 0.25)',
      textColor: 'text-red-600 dark:text-red-400',
      isOperational: false,
    };
  }

  if (s === 'DEGRADED' || s === 'SLOW') {
    return {
      label: 'Website is slow',
      historyLabel: 'Slow',
      color: '#f59e0b',
      dotColor: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.30)',
      textColor: 'text-amber-600 dark:text-amber-400',
      isOperational: true,
    };
  }

  if (s === 'PAUSED') {
    return {
      label: 'Paused',
      historyLabel: 'Paused',
      color: 'var(--muted-2)',
      dotColor: '#9ca3af',
      bgColor: 'rgba(156, 163, 175, 0.10)',
      borderColor: 'rgba(156, 163, 175, 0.25)',
      textColor: 'text-gray-500 dark:text-gray-400',
      isOperational: false,
    };
  }

  return {
    label: 'Website is up',
    historyLabel: isSlow ? 'Slow' : 'Up',
    color: '#10b981',
    dotColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.10)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    isOperational: true,
  };
}

/**
 * Gets human-readable HTTP code description.
 */
export function getHttpStatusText(statusCode) {
  if (!statusCode) return '';
  return HTTP_STATUS_TEXT[statusCode] || (statusCode < 400 ? 'OK' : 'Error');
}

/**
 * Explains check failure / health reasons.
 */
export function formatReason(reason) {
  switch (reason) {
    case 'HTTP_OK':
      return 'HTTP ok';
    case 'HIGH_RESPONSE_TIME':
      return 'High response time';
    case 'HTTP_ERROR':
      return 'HTTP error';
    case 'TIMEOUT':
      return 'Connection timed out';
    case 'DNS_ERROR':
      return 'DNS resolution failed';
    case 'CONNECTION_REFUSED':
      return 'Connection refused';
    case 'CONNECTION_RESET':
      return 'Connection reset';
    case 'CONNECTION_TIMEOUT':
      return 'Socket timeout';
    case 'INVALID_URL':
      return 'Invalid URL target';
    default:
      if (!reason) return 'HTTP ok';
      return String(reason).replace(/_/g, ' ').toLowerCase();
  }
}

/**
 * Relative timestamp formatter matching the screenshot style:
 * "Just now", "5 min ago", "10 min ago", "15 min ago", "20 min ago"
 */
export function relativeTime(iso) {
  if (!iso) return 'Just now';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Just now';

  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Formats checked timestamp for footer (e.g. "Checked Oct 23, 2026, 9:26 PM").
 */
export function formatCheckedTimestamp(iso) {
  if (!iso) return 'Checked just now';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Checked just now';

  const datePart = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `Checked ${datePart}, ${timePart}`;
}

/**
 * Formats monitor creation date into a clean, human-readable string:
 * e.g. "7 Nov 2026, 10:30 PM"
 */
export function formatCreationDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  const day = d.getDate();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${day} ${month} ${year}, ${timePart}`;
}

/**
 * Generates an array of page numbers and ellipses for modern numbered pagination:
 * e.g. [1, 2, 3, 4, 5, '...', 20] or [1, '...', 4, 5, 6, '...', 20]
 */
export function getPaginationRange(currentPage, totalPages) {
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.max(1, Math.min(Number(currentPage) || 1, total));

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }

  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, '...', current - 1, current, current + 1, '...', total];
}

/**
 * Constructs user-friendly summary sentence as seen in Image 1:
 * "Responded in 1.36 s (slow) and redirects to another address, which is normal."
 */
export function buildResponseSummary(result) {
  if (!result) {
    return {
      timeText: '—',
      speedTag: '',
      followUp: 'Standing by for live telemetry…',
      fullText: 'Standing by for live telemetry…',
    };
  }

  const unwrap = (obj) => (obj && typeof obj === 'object' && obj.result ? obj.result : obj);
  const data = unwrap(result);

  const totalMs = Number(data.TotalresponseTime ?? data.responseTime ?? data.totalResponseTime ?? 0);
  const formattedTime = formatMs(totalMs);
  const httpCode = Number(data.httpStatus);
  const isRedirect = [301, 302, 303, 307, 308].includes(httpCode);
  const isSuccess = [200, 201, 202, 204].includes(httpCode);
  const isClientError = httpCode >= 400 && httpCode < 500;
  const isServerError = httpCode >= 500 && httpCode < 600;

  if (data.error || String(data.status).toUpperCase() === 'DOWN') {
    const errorMsg = data.error || formatReason(data.reason);
    return {
      timeText: formattedTime !== '—' ? formattedTime : '',
      speedTag: '',
      followUp: `failed to connect: ${errorMsg}.`,
      fullText: `Probe failed to connect: ${errorMsg}.`,
    };
  }

  let speedTag = '';
  if (totalMs >= 1000) {
    speedTag = ' (slow)';
  } else if (totalMs > 0 && totalMs < 300) {
    speedTag = ' (fast)';
  }

  let followUp;
  if (isRedirect) {
    followUp = ' and redirects to another address, which is normal.';
  } else if (isSuccess) {
    followUp = ' and returned a valid response, which is normal.';
  } else if (isClientError) {
    followUp = ` and returned a client status (HTTP ${httpCode}).`;
  } else if (isServerError) {
    followUp = ` and returned an upstream server error (HTTP ${httpCode}).`;
  } else {
    followUp = ', connection completed successfully.';
  }

  return {
    timeText: formattedTime,
    speedTag,
    followUp,
    fullText: `Responded in ${formattedTime}${speedTag}${followUp}`,
  };
}

/**
 * Extracts domain name for cleaner display.
 */
export function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Calculates accurate latency decomposition breakdown:
 *  - DNS lookup (DNSTime)
 *  - Connecting / TCP (tcpConnectTime)
 *  - Server wait (ttfb - (DNS + TCP))
 *  - Download (TotalresponseTime - ttfb)
 */
export function calculateLatencyBreakdown(result) {
  if (!result) {
    return {
      totalMs: 0,
      dns: 0,
      connecting: 0,
      serverWait: 0,
      download: 0,
      dnsPct: 0,
      connectingPct: 0,
      serverWaitPct: 0,
      downloadPct: 0,
    };
  }

  const unwrap = (obj) => (obj && typeof obj === 'object' && obj.result ? obj.result : obj);
  const data = unwrap(result);

  const totalMs = Math.max(0, Number(data.TotalresponseTime ?? data.responseTime ?? data.totalResponseTime ?? 0));
  const ttfb = Math.max(0, Number(data.ttfb ?? data.timeToFirstByte ?? 0));
  const dns = Math.max(0, Number(data.DNSTime ?? data.dnsTime ?? data.dnsLookup ?? 0));
  const connecting = Math.max(
    0,
    Number(
      data.tcpConnectTime ??
      data.tcpTime ??
      data.tcpConnection ??
      data.tcpConnectionTime ??
      data.connectingTime ??
      0
    )
  );

  // Server wait = TTFB minus DNS and TCP connect time
  const serverWait = Math.max(0, ttfb - (dns + connecting));

  // Download = Total response time minus TTFB
  const download = Math.max(0, totalMs - ttfb);

  const sum = dns + connecting + serverWait + download || totalMs || 1;

  return {
    totalMs,
    dns,
    connecting,
    serverWait,
    download,
    dnsPct: Math.max(0, (dns / sum) * 100),
    connectingPct: Math.max(0, (connecting / sum) * 100),
    serverWaitPct: Math.max(0, (serverWait / sum) * 100),
    downloadPct: Math.max(0, (download / sum) * 100),
  };
}

/**
 * Formats location text (e.g. "Boston, Massachusetts, United States" -> "Boston, Massachusetts")
 */
export function formatLocation(location) {
  if (!location || location === 'Not Found' || location === '—') return '—';
  // If location has 3 parts like "Boston, Massachusetts, United States", pick the first two for short display
  const parts = String(location)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return location;
}

/**
 * Safely parses and destructures IP address and IP family (IPv4 / IPv6)
 */
export function parseDnsInfo(dnsAddress) {
  if (!dnsAddress || dnsAddress === 'Not Found' || dnsAddress === '—') {
    return { ip: '—', family: null, label: '—' };
  }

  const entry = Array.isArray(dnsAddress) ? dnsAddress[0] : dnsAddress;

  if (entry && typeof entry === 'object') {
    const ip = entry.address || entry.ip || '—';
    const family = entry.family ? `IPv${entry.family}` : null;
    return {
      ip,
      family,
      label: family ? `${ip} (${family})` : ip,
    };
  }

  const str = String(entry || '—').trim();
  if (!str || str === '—' || str === 'Not Found') {
    return { ip: '—', family: null, label: '—' };
  }
  const isIpv6 = str.includes(':');
  return {
    ip: str,
    family: isIpv6 ? 'IPv6' : 'IPv4',
    label: str,
  };
}

export function formatIp(dnsAddress) {
  return parseDnsInfo(dnsAddress).ip;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Converts a 2-letter ISO country code (e.g. "US", "DE", "GB") into its full English name.
 */
export function formatCountryName(codeOrName) {
  if (!codeOrName) return '';
  const str = String(codeOrName).trim();
  if (!str || str === '—' || str === 'Not Found' || str === 'null' || str === 'undefined') return '';

  if (/^[A-Za-z]{2}$/.test(str)) {
    try {
      if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
        const dn = new Intl.DisplayNames(['en'], { type: 'region' });
        const name = dn.of(str.toUpperCase());
        if (name) return name;
      }
    } catch {
      // Fallback below
    }
    const map = {
      US: 'United States',
      GB: 'United Kingdom',
      DE: 'Germany',
      FR: 'France',
      CA: 'Canada',
      AU: 'Australia',
      JP: 'Japan',
      IN: 'India',
      NL: 'Netherlands',
      IE: 'Ireland',
      SG: 'Singapore',
      CH: 'Switzerland',
      SE: 'Sweden',
      BR: 'Brazil',
      ES: 'Spain',
      IT: 'Italy',
      PL: 'Poland',
      RU: 'Russia',
      KR: 'South Korea',
      CN: 'China',
    };
    if (map[str.toUpperCase()]) {
      return map[str.toUpperCase()];
    }
  }
  return str;
}

/**
 * Formats raw provider/host string for clean UI display.
 * e.g.:
 *  "CLOUDFLARENET - Cloudflare, Inc., US" -> "Cloudflare, Inc."
 *  "MICROSOFT-CORP-MSN-AS-BLOCK - Microsoft Corporation" -> "Microsoft Corporation"
 *  "Cloudflare, Inc." -> "Cloudflare, Inc."
 */
export function formatProviderName(raw) {
  if (!raw) return '—';
  const str = String(raw).trim();
  if (!str || str === '—' || str === 'Not Found' || str === 'null' || str === 'undefined') {
    return '—';
  }

  // If format is "NET-HANDLE - Organization Name, CC" or "NET-HANDLE - Organization Name"
  if (str.includes(' - ')) {
    const parts = str.split(' - ').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const org = parts.slice(1).join(' - ').replace(/,\s*[A-Z]{2}$/i, '').trim();
      if (org) return org;
    }
  }

  // Strip trailing country code if present (e.g. "Cloudflare, Inc., US" -> "Cloudflare, Inc.")
  return str.replace(/,\s*[A-Z]{2}$/i, '').trim() || str;
}

/**
 * Safely extracts the AS Name from backend hostinginfo payload.
 * Matches DB fields: "hostedBy", "AS Name", "asName", "isp", "org", etc.
 * Explicitly ignores pure ASN values (e.g. "AS13335") so the AS number is never used as the name.
 */
export function extractHostingAsName(hostinginfo) {
  if (!hostinginfo) return null;

  let info = hostinginfo;
  if (typeof info === 'string') {
    const trimmed = info.trim();
    if (!trimmed || trimmed === '—' || trimmed === 'Not Found' || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }
    try {
      info = JSON.parse(trimmed);
    } catch {
      if (/^AS\d+$/i.test(trimmed)) return null;
      return trimmed;
    }
  }

  if (!info || typeof info !== 'object') return null;

  // 1. Check exact MongoDB field "hostedBy" FIRST (matching backend DB document)
  const hostedByCandidate =
    info.hostedBy ??
    info.hosted_by ??
    info['Hosted By'] ??
    null;

  if (hostedByCandidate != null) {
    const str = String(hostedByCandidate).trim();
    if (str && str !== '—' && str !== 'Not Found' && str !== 'null' && str !== 'undefined') {
      if (!/^AS\d+$/i.test(str)) {
        return str;
      }
    }
  }

  // 2. Exact / direct variants of "AS Name" from whois query / socket
  const asNameCandidate =
    info['AS Name'] ??
    info['asName'] ??
    info['as_name'] ??
    info['asname'] ??
    info['AS name'] ??
    info['AsName'] ??
    info['asn_name'] ??
    info['asnName'] ??
    null;

  if (asNameCandidate != null) {
    const str = String(asNameCandidate).trim();
    if (str && str !== '—' && str !== 'Not Found' && str !== 'null' && str !== 'undefined') {
      if (!/^AS\d+$/i.test(str)) {
        return str;
      }
    }
  }

  // 3. Fallback to org / isp / organization
  const orgField =
    info.isp ??
    info.org ??
    info.organization ??
    null;

  if (orgField != null) {
    const str = String(orgField).trim();
    if (str && str !== '—' && str !== 'Not Found' && str !== 'null' && str !== 'undefined') {
      if (!/^AS\d+$/i.test(str)) {
        return str;
      }
    }
  }

  // 4. Nested object in "as" (e.g. { name: "Cloudflare" })
  if (info.as && typeof info.as === 'object') {
    const nested =
      info.as['AS Name'] ??
      info.as.name ??
      info.as.asName ??
      info.as.as_name ??
      info.as.asname ??
      info.as.org ??
      info.as.organization ??
      null;
    if (nested != null) {
      const str = String(nested).trim();
      if (str && str !== '—' && str !== 'Not Found' && str !== 'null' && str !== 'undefined') {
        if (!/^AS\d+$/i.test(str)) {
          return str;
        }
      }
    }
  }

  return null;
}

/**
 * Safely extracts and formats location information from backend hostinginfo payload.
 * Prioritizes DB fields: registryCountry, country, city, region, location.
 */
export function extractHostingLocation(hostinginfo) {
  if (!hostinginfo) return null;

  let info = hostinginfo;
  if (typeof info === 'string') {
    const trimmed = info.trim();
    if (!trimmed || trimmed === '—' || trimmed === 'Not Found' || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }
    try {
      info = JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if (!info || typeof info !== 'object') return null;

  // 1. Direct location string
  const directLoc =
    info.location ??
    info.Location ??
    info.loc ??
    null;

  if (typeof directLoc === 'string') {
    const s = directLoc.trim();
    if (s && s !== '—' && s !== 'Not Found' && s !== 'null' && s !== 'undefined') {
      return s;
    }
  }

  // 2. Components from DB object: city, region, registryCountry / country
  const locObj = directLoc && typeof directLoc === 'object' ? directLoc : info;
  const city = locObj.city || locObj.cityName;
  const region = locObj.region || locObj.regionName || locObj.state || locObj.stateName;

  // Check DB country fields: registryCountry (from DB screenshot), country, countryCode, etc.
  const rawCountry =
    locObj.registryCountry ??
    locObj.registry_country ??
    locObj.country ??
    locObj.countryName ??
    locObj.country_name ??
    locObj.countryCode ??
    null;

  let country = '';
  if (rawCountry) {
    country = formatCountryName(rawCountry);
  } else if (info.hostedBy || info['AS Name']) {
    // Fallback: extract country from trailing ", US" if present
    const match = String(info.hostedBy || info['AS Name']).match(/,\s*([A-Za-z]{2})$/);
    if (match && match[1]) {
      country = formatCountryName(match[1]);
    }
  }

  const parts = [city, region, country]
    .map((p) => (p != null ? String(p).trim() : ''))
    .filter((p) => p && p !== '—' && p !== 'Not Found' && p !== 'null' && p !== 'undefined');

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return null;
}

/**
 * Resolves all backend hosting, ISP, location, and DNS fields with priority
 * given to backend hostinginfo data emitted via socket / monitor document.
 */
export function resolveHostingDetails({ result, activeMonitor, rawResult } = {}) {
  const hostinginfo =
    result?.hostinginfo ??
    result?.hostingInfo ??
    rawResult?.hostinginfo ??
    rawResult?.hostingInfo ??
    activeMonitor?.hostinginfo ??
    activeMonitor?.hostingInfo ??
    activeMonitor?.lastResult?.hostinginfo ??
    activeMonitor?.lastCheck?.hostinginfo ??
    null;

  // 1. Raw AS Name from DB field "hostedBy" or "AS Name"
  const rawAsName = extractHostingAsName(hostinginfo);

  const rawHostedBy =
    rawAsName ||
    result?.hostedBy ||
    result?.hostingDetails?.hostedBy ||
    result?.hostingDetails?.isp ||
    result?.isp ||
    null;

  // Clean friendly name (e.g. "Cloudflare, Inc." or "Microsoft Corporation")
  const cleanHostedBy = rawHostedBy ? formatProviderName(rawHostedBy) : null;

  const hostedBy =
    cleanHostedBy && cleanHostedBy !== 'Not Found' && cleanHostedBy !== '—'
      ? cleanHostedBy
      : rawHostedBy && rawHostedBy !== 'Not Found' && rawHostedBy !== '—'
      ? String(rawHostedBy).trim()
      : '—';

  // 2. Internet provider (SERVER column)
  const rawIsp =
    rawAsName ||
    result?.hostingDetails?.isp ||
    result?.isp ||
    result?.hostedBy ||
    result?.hostingDetails?.hostedBy ||
    null;

  const cleanIsp = rawIsp ? formatProviderName(rawIsp) : null;
  const isp =
    cleanIsp && cleanIsp !== 'Not Found' && cleanIsp !== '—'
      ? cleanIsp
      : rawIsp && rawIsp !== 'Not Found' && rawIsp !== '—'
      ? String(rawIsp).trim()
      : hostedBy;

  // 3. Autonomous System Number (e.g. "AS13335" or "AS8075")
  const rawAsn =
    hostinginfo?.asn ??
    hostinginfo?.as ??
    result?.asn ??
    null;
  const asn = rawAsn ? String(rawAsn).trim() : null;

  // 4. Location (from registryCountry, country, city, etc.)
  const backendLocation = extractHostingLocation(hostinginfo);
  const rawLocation =
    backendLocation ||
    result?.hostingDetails?.location ||
    result?.location ||
    '';
  const fullLocation =
    rawLocation && rawLocation !== 'Not Found' && rawLocation !== '—'
      ? String(rawLocation).trim()
      : '';
  const shortLocation = fullLocation ? formatLocation(fullLocation) : '—';

  // 5. IP / DNS lookup info with fallback to hostinginfo.ip and hostinginfo.ipVersion
  const rawIpCandidate =
    result?.dnsAddress ||
    result?.ip ||
    result?.ipAddress ||
    hostinginfo?.ip ||
    hostinginfo?.query ||
    hostinginfo?.ipAddress ||
    null;

  const dnsInfo = parseDnsInfo(rawIpCandidate);
  if ((!dnsInfo.family || dnsInfo.family === 'null') && hostinginfo?.ipVersion) {
    dnsInfo.family = String(hostinginfo.ipVersion);
    dnsInfo.label = `${dnsInfo.ip} (${dnsInfo.family})`;
  }

  return {
    hostinginfo,
    rawHostedBy,
    hostedBy,
    isp,
    asn,
    fullLocation,
    shortLocation,
    dnsInfo,
  };
}



