/**
 * redirects.utils.js
 *
 * Utilities, formatters, status code metadata, and diagnostic helpers for Redirect Check.
 */

export const REDIRECTS_PAGE_LIMIT = 10;
export const REDIRECTS_SCAN_TIMEOUT_MS = 25_000;
export const REDIRECTS_SOCKET_TIMEOUT_MS = 10_000;

export const STATUS_CODE_META = {
  200: {
    label: '200 OK',
    type: 'success',
    color: '#00e87a',
    badge: 'Destination',
    desc: 'Target URL successfully loaded with standard HTTP 200 response.',
  },
  301: {
    label: '301 Moved Permanently',
    type: 'permanent',
    color: '#00d4ff',
    badge: 'Permanent',
    desc: 'Permanent redirect. Passes link equity and updates search engine indexes.',
  },
  302: {
    label: '302 Found (Temporary)',
    type: 'temporary',
    color: '#ff9a00',
    badge: 'Temporary',
    desc: 'Temporary redirect. Does not transfer canonical link equity permanently.',
  },
  303: {
    label: '303 See Other',
    type: 'temporary',
    color: '#ff9a00',
    badge: 'See Other',
    desc: 'Directs client to retrieve resource with a GET request.',
  },
  307: {
    label: '307 Temporary Redirect',
    type: 'temporary',
    color: '#ff9a00',
    badge: 'Temporary',
    desc: 'Temporary redirect maintaining original HTTP method and body.',
  },
  308: {
    label: '308 Permanent Redirect',
    type: 'permanent',
    color: '#00d4ff',
    badge: 'Permanent',
    desc: 'Permanent redirect maintaining original HTTP method and body.',
  },
  403: {
    label: '403 Forbidden',
    type: 'error',
    color: '#ff4d4d',
    badge: 'Forbidden',
    desc: 'Access denied by destination server or web application firewall.',
  },
  404: {
    label: '404 Not Found',
    type: 'error',
    color: '#ff4d4d',
    badge: 'Not Found',
    desc: 'Destination URL does not exist on the host server.',
  },
  500: {
    label: '500 Internal Error',
    type: 'error',
    color: '#ff4d4d',
    badge: 'Server Error',
    desc: 'Destination server encountered an unhandled internal exception.',
  },
  502: {
    label: '502 Bad Gateway',
    type: 'error',
    color: '#ff4d4d',
    badge: 'Bad Gateway',
    desc: 'Reverse proxy received an invalid response from upstream.',
  },
  503: {
    label: '503 Service Unavailable',
    type: 'error',
    color: '#ff4d4d',
    badge: 'Unavailable',
    desc: 'Server temporarily unavailable or overloaded.',
  },
};

export function getStatusMeta(statusCode) {
  if (STATUS_CODE_META[statusCode]) {
    return STATUS_CODE_META[statusCode];
  }
  if (statusCode >= 200 && statusCode < 300) {
    return {
      label: `${statusCode} Success`,
      type: 'success',
      color: '#00e87a',
      badge: 'Success',
      desc: 'Successful HTTP response.',
    };
  }
  if (statusCode >= 300 && statusCode < 400) {
    return {
      label: `${statusCode} Redirect`,
      type: 'redirect',
      color: '#00d4ff',
      badge: 'Redirect',
      desc: 'HTTP Redirection response.',
    };
  }
  if (statusCode >= 400 && statusCode < 500) {
    return {
      label: `${statusCode} Client Error`,
      type: 'error',
      color: '#ff4d4d',
      badge: 'Client Error',
      desc: 'Target URL resulted in a client HTTP error.',
    };
  }
  return {
    label: `${statusCode} Error`,
    type: 'error',
    color: '#ff4d4d',
    badge: 'Server Error',
    desc: 'HTTP Server Error.',
  };
}

export function normalizeRedirectUrl(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return trimmed;
}

export function isValidHttpUrl(input) {
  if (!input || typeof input !== 'string') return false;
  try {
    const url = new URL(input.trim());
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `red_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

export function analyzeRedirectChain(chain = [], inputUrl = '', finalUrl = '') {
  const diagnostics = [];

  const hopCount = Math.max(chain.length - 1, 0);

  // 1. Chain Length Analysis
  if (hopCount === 0) {
    diagnostics.push({
      title: 'Direct Destination (Zero Redirects)',
      status: 'pass',
      badge: 'Optimal',
      desc: 'The URL connects directly to the final resource with zero hop overhead.',
    });
  } else if (hopCount === 1) {
    diagnostics.push({
      title: 'Single Canonical Hop',
      status: 'pass',
      badge: 'Healthy',
      desc: '1 clean redirect hop. Standard practice for domain or protocol canonicalization.',
    });
  } else if (hopCount === 2) {
    diagnostics.push({
      title: 'Moderate Redirect Chain (2 Hops)',
      status: 'warn',
      badge: 'Moderate',
      desc: '2 redirects occurred. Consider pointing directly to the final URL to save latency.',
    });
  } else {
    diagnostics.push({
      title: `Excessive Redirect Chain (${hopCount} Hops)`,
      status: 'fail',
      badge: 'SEO Risk',
      desc: `Chain contains ${hopCount} redirects. Long chains dilute PageRank link equity and add round-trip latency.`,
    });
  }

  // 2. HTTPS Protocol Upgrade Check
  try {
    const startProto = new URL(inputUrl || chain[0]?.url || 'http://localhost').protocol;
    const endProto = new URL(finalUrl || chain.at(-1)?.url || 'http://localhost').protocol;

    if (startProto === 'http:' && endProto === 'https:') {
      diagnostics.push({
        title: 'HTTPS Encryption Upgrade',
        status: 'pass',
        badge: 'Secure',
        desc: 'Insecure HTTP request successfully upgraded to encrypted HTTPS transport.',
      });
    } else if (startProto === 'https:' && endProto === 'http:') {
      diagnostics.push({
        title: 'Insecure HTTPS Downgrade',
        status: 'fail',
        badge: 'Critical',
        desc: 'Request originated over HTTPS but was redirected to unencrypted HTTP.',
      });
    } else if (endProto === 'https:') {
      diagnostics.push({
        title: 'HTTPS Secure Destination',
        status: 'pass',
        badge: 'Secure',
        desc: 'Destination URL is served securely over TLS/HTTPS.',
      });
    }
  } catch {
    // Ignore URL parse edge cases
  }

  // 3. Permanent vs Temporary Check
  const permanentHops = chain.filter((c) => [301, 308].includes(c.statusCode)).length;
  const temporaryHops = chain.filter((c) => [302, 303, 307].includes(c.statusCode)).length;

  if (temporaryHops > 0) {
    diagnostics.push({
      title: 'Temporary Redirect (302/307) Detected',
      status: 'warn',
      badge: 'Notice',
      desc: `${temporaryHops} temporary redirect hop(s) found. Use 301/308 if the move is permanent for SEO equity transfer.`,
    });
  } else if (permanentHops > 0) {
    diagnostics.push({
      title: 'Permanent Redirect (301/308)',
      status: 'pass',
      badge: 'SEO Friendly',
      desc: 'All redirect hops use permanent status codes, signaling search engines to transfer rankings.',
    });
  }

  // 4. Response Status Check
  const finalStatus = chain.at(-1)?.statusCode;
  if (finalStatus && finalStatus >= 400) {
    diagnostics.push({
      title: `Destination Error (${finalStatus})`,
      status: 'fail',
      badge: 'Broken Chain',
      desc: `The redirect chain ended with HTTP status ${finalStatus}. The destination is unreachable or broken.`,
    });
  }

  return diagnostics;
}

export function exportRedirectReport(report) {
  if (!report) return;
  const fileName = `redirect-chain-${new Date().toISOString().slice(0, 10)}.json`;
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
 * Standardize MongoDB record, socket response, or raw redirect result into a unified UI report object.
 * @param {object} entry - Raw document or socket payload
 * @returns {object|null}
 */
export function normalizeRedirectEntry(entry) {
  if (!entry) return null;
  const raw = entry.result || entry;
  const id = entry._id ? String(entry._id) : entry.id || entry.jobId || createId();
  const dbId = entry._id ? String(entry._id) : entry.redirectCheckId ? String(entry.redirectCheckId) : null;

  const inputUrl = raw.inputUrl || entry.url || '';
  const finalUrl = raw.finalUrl || inputUrl;
  const chain = Array.isArray(raw.chain) ? raw.chain : [];
  const finalStatus = raw.finalStatus ?? (chain.at(-1)?.statusCode ?? 200);
  const redirectCount = raw.redirectCount ?? Math.max(chain.length - 1, 0);
  const totalTimeMs = raw.totalTimeMs ?? 0;
  const checkedAt =
    entry.completedAt || entry.createdAt || raw.checkedAt || new Date().toISOString();
  const status = entry.status || raw.status || 'completed';
  const error = entry.error || raw.error || raw.message || null;

  return {
    id,
    dbId,
    inputUrl,
    url: inputUrl,
    finalUrl,
    finalStatus,
    redirectCount,
    totalTimeMs,
    chain,
    checkedAt,
    status,
    error,
    success: status === 'completed' && !error,
    raw,
  };
}
