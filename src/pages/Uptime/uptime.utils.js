/**
 * Uptime feature — pure helpers, formatting, and constants.
 * Deliberately side-effect free so it is fast, portable, and easily testable.
 */

export const DEFAULT_PAGE_SIZE = 6;
export const PAGE_SIZE_OPTIONS = Object.freeze([6, 12, 24]);
export const DEFAULT_RESULTS_LIMIT = 6;

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
      return 'Every 10 mins';
    case '30m':
      return 'Every 30 mins';
    case '1h':
      return 'Every 1 hour';
    default:
      return interval || '—';
  }
}

/**
 * Status tokens, labels, and badges.
 * status: "UP" | "DEGRADED" | "DOWN" | "active" | "paused"
 */
export function getStatusMeta(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'UP' || s === 'ACTIVE') {
    return {
      label: s === 'ACTIVE' ? 'Active' : 'Operational (UP)',
      color: 'var(--green)',
      bgColor: 'var(--green-dim)',
      borderColor: 'rgba(0, 232, 122, 0.3)',
      isOperational: true,
    };
  }
  if (s === 'DEGRADED') {
    return {
      label: 'Degraded Speed',
      color: 'var(--orange)',
      bgColor: 'var(--orange-dim)',
      borderColor: 'rgba(255, 154, 0, 0.3)',
      isOperational: true,
    };
  }
  if (s === 'PAUSED') {
    return {
      label: 'Paused',
      color: 'var(--muted-2)',
      bgColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'var(--border-mid)',
      isOperational: false,
    };
  }
  return {
    label: 'Downtime (DOWN)',
    color: 'var(--red)',
    bgColor: 'rgba(255, 77, 106, 0.12)',
    borderColor: 'rgba(255, 77, 106, 0.3)',
    isOperational: false,
  };
}

/**
 * Explains check failure / health reasons.
 */
export function formatReason(reason) {
  switch (reason) {
    case 'HTTP_OK':
      return 'HTTP 2xx/3xx Successful';
    case 'HIGH_RESPONSE_TIME':
      return 'Latency exceeded threshold (>= 3000ms)';
    case 'HTTP_ERROR':
      return 'HTTP Status Error (4xx/5xx)';
    case 'TIMEOUT':
      return 'Connection timed out';
    case 'DNS_ERROR':
      return 'DNS Resolution Failed';
    case 'CONNECTION_REFUSED':
      return 'Connection Refused by Host';
    case 'CONNECTION_RESET':
      return 'Connection Reset';
    case 'CONNECTION_TIMEOUT':
      return 'Socket Connection Timeout';
    case 'INVALID_URL':
      return 'Invalid URL Target';
    default:
      return reason || 'Check Completed';
  }
}

/**
 * Relative timestamp formatter ("Just now", "2m ago", "1d ago").
 */
export function relativeTime(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';

  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
 * Safely parses and destructures IP address and IP family (IPv4 / IPv6)
 * Handles:
 *  - Array: [{ address: '77.68.116.61', family: 4 }]
 *  - Object: { address: '77.68.116.61', family: 4 }
 *  - String: '77.68.116.61'
 * Returns: { ip: string, family: string, label: string }
 */
export function parseDnsInfo(dnsAddress) {
  if (!dnsAddress) {
    return { ip: '—', family: null, label: '—' };
  }

  // If it's an array, pick the first entry
  const entry = Array.isArray(dnsAddress) ? dnsAddress[0] : dnsAddress;

  if (entry && typeof entry === 'object') {
    const ip = entry.address || '—';
    const family = entry.family ? `IPv${entry.family}` : null;
    return {
      ip,
      family,
      label: family ? `${ip} (${family})` : ip,
    };
  }

  const str = String(entry || '—').trim();
  // Guess family if standard IPv6 contains ':'
  const isIpv6 = str.includes(':');
  return {
    ip: str,
    family: str !== '—' ? (isIpv6 ? 'IPv6' : 'IPv4') : null,
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

