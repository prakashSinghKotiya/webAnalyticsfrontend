/**
 * lighthouse.utils.js
 *
 * Domain utilities, formatters, and scoring thresholds for Google Lighthouse /
 * PageSpeed Insights audits.
 */

export const LIGHTHOUSE_PAGE_LIMIT = 10;
export const LIGHTHOUSE_SCAN_TIMEOUT_MS = 90_000;
export const LIGHTHOUSE_SOCKET_TIMEOUT_MS = 10_000;

/* ── Category definitions ─────────────────────────────────────────────────── */

export const AUDIT_CATEGORIES = [
  {
    key: 'performance',
    label: 'Performance',
    description: 'Metrics for page load speed, responsiveness, and visual stability.',
  },
  {
    key: 'accessibility',
    label: 'Accessibility',
    description: 'Opportunities to improve user experience for assistive technology.',
  },
  {
    key: 'best-practices',
    label: 'Best Practices',
    description: 'Security, modern web standards, and developer best practices.',
  },
  {
    key: 'seo',
    label: 'SEO',
    description: 'Search engine discoverability and metadata optimization.',
  },
];

/* ── Lab Metrics definitions ──────────────────────────────────────────────── */

export const LAB_METRICS_INFO = {
  FCP: {
    name: 'First Contentful Paint',
    short: 'FCP',
    unit: 's',
    good: 1800,
    poor: 3000,
    description: 'Marks the time at which the first text or image is painted.',
  },
  LCP: {
    name: 'Largest Contentful Paint',
    short: 'LCP',
    unit: 's',
    good: 2500,
    poor: 4000,
    description: 'Marks the time at which the largest text or image is painted.',
  },
  TBT: {
    name: 'Total Blocking Time',
    short: 'TBT',
    unit: 'ms',
    good: 200,
    poor: 600,
    description: 'Sum of all time periods between FCP and Time to Interactive when task length exceeded 50ms.',
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    short: 'CLS',
    unit: '',
    good: 0.1,
    poor: 0.25,
    description: 'Measures the movement of visible elements within the viewport.',
  },
  SpeedIndex: {
    name: 'Speed Index',
    short: 'SI',
    unit: 's',
    good: 3400,
    poor: 5800,
    description: 'Shows how quickly the contents of a page are visibly populated.',
  },
  TTI: {
    name: 'Time to Interactive',
    short: 'TTI',
    unit: 's',
    good: 3800,
    poor: 7300,
    description: 'Amount of time it takes for the page to become fully interactive.',
  },
  TTFB: {
    name: 'Time to First Byte',
    short: 'TTFB',
    unit: 'ms',
    good: 800,
    poor: 1800,
    description: 'Time taken for the network to respond to the initial HTML document request.',
  },
};

/* ── Score color & rating helper ─────────────────────────────────────────── */

export function rateScore(score) {
  if (score == null || Number.isNaN(Number(score))) {
    return {
      label: 'N/A',
      rating: 'unknown',
      color: 'var(--muted-2)',
      bg: 'rgba(148, 153, 168, 0.12)',
      border: 'rgba(148, 153, 168, 0.25)',
    };
  }

  const num = Math.round(Number(score));
  if (num >= 90) {
    return {
      label: 'Good',
      rating: 'good',
      color: 'var(--green)',
      bg: 'var(--green-dim)',
      border: 'rgba(0, 232, 122, 0.3)',
    };
  }
  if (num >= 50) {
    return {
      label: 'Needs Work',
      rating: 'average',
      color: 'var(--orange)',
      bg: 'var(--orange-dim)',
      border: 'rgba(255, 154, 0, 0.3)',
    };
  }
  return {
    label: 'Poor',
    rating: 'poor',
    color: 'var(--red)',
    bg: 'rgba(255, 77, 106, 0.12)',
    border: 'rgba(255, 77, 106, 0.3)',
  };
}

export function rateMetricValue(metricKey, rawValue) {
  if (rawValue == null || Number.isNaN(Number(rawValue))) {
    return { label: 'N/A', rating: 'unknown', color: 'var(--muted-2)' };
  }

  const info = LAB_METRICS_INFO[metricKey];
  if (!info) return { label: 'OK', rating: 'good', color: 'var(--green)' };

  const val = Number(rawValue);

  if (val <= info.good) {
    return { label: 'Good', rating: 'good', color: 'var(--green)' };
  }
  if (val <= info.poor) {
    return { label: 'Needs Improvement', rating: 'average', color: 'var(--orange)' };
  }
  return { label: 'Poor', rating: 'poor', color: 'var(--red)' };
}

/* ── URL utilities ────────────────────────────────────────────────────────── */

export function normalizeUrl(input) {
  if (!input) return '';
  const trimmed = String(input).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidUrl(input) {
  if (!input) return false;
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/* ── ID & Relative time ──────────────────────────────────────────────────── */

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `lh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

export function formatMs(ms) {
  if (ms == null) return '—';
  const val = Number(ms);
  if (val >= 1000) return `${(val / 1000).toFixed(2)}s`;
  return `${Math.round(val)}ms`;
}

export function exportJsonReport(report) {
  if (!report) return;
  const fileName = `lighthouse-${new URL(report.url || 'https://site.com').hostname}-${new Date().toISOString().slice(0, 10)}.json`;
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
 * Standardize MongoDB record, socket response, or raw result into a unified UI report object.
 * @param {object} entry - Raw document or socket payload
 * @returns {object|null}
 */
export function normalizeLighthouseEntry(entry) {
  if (!entry) return null;
  const raw = entry.result || entry;
  const id = entry._id ? String(entry._id) : entry.id || entry.jobId || createId();
  const dbId = entry._id ? String(entry._id) : entry.lighthousedbId ? String(entry.lighthousedbId) : null;

  const fallbackUrl = entry.url || raw.url || raw.finalUrl || '';
  const finalUrl = raw.finalUrl || raw.url || fallbackUrl;

  return {
    id,
    dbId,
    targetUrl: entry.url || raw.url || finalUrl,
    url: raw.url || entry.url || finalUrl,
    finalUrl,
    strategy: raw.strategy || entry.strategy || 'mobile',
    status: entry.status || raw.status || 'completed',
    analyzedAt: raw.analyzedAt || entry.completedAt || entry.createdAt || new Date().toISOString(),
    lighthouseVersion: raw.lighthouseVersion || '12.0',
    scores: raw.scores || {},
    coreWebVitals: raw.coreWebVitals || null,
    labMetrics: raw.labMetrics || {},
    issues: raw.issues || {},
    screenshot: raw.screenshot || null,
    warnings: raw.warnings || [],
    raw,
  };
}

