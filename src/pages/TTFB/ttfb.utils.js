import { TTFB_REGIONS, ALL_REGIONS } from '../../api/ttfb';

/**
 * TTFB feature — pure helpers and constants.
 *
 * Deliberately side-effect free (no React, no network) so the logic is trivial
 * to unit test and safe to import from anywhere in the feature.
 */

/* ── Configuration ────────────────────────────────────────────────────── */

/** localStorage key — `wp-` prefixed to match the STORAGE_KEYS convention. */
export const TTFB_HISTORY_KEY = 'wp-ttfb-history';

/** Maximum number of scans retained in history. */
export const TTFB_HISTORY_LIMIT = 25;

/** How long to wait for the `ttfbCompleted` socket event before giving up. */
export const TTFB_SCAN_TIMEOUT_MS = 45_000;

/** How long to wait for the socket to connect before sending the job id. */
export const TTFB_SOCKET_TIMEOUT_MS = 10_000;

/** Latency quality buckets, in milliseconds. */
export const RATING_THRESHOLDS = Object.freeze({ good: 100, fair: 300, slow: 600 });

/* ── URL helpers ──────────────────────────────────────────────────────── */

/** Prepend `https://` when the user omits the scheme. */
export function normalizeUrl(input) {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** True only for absolute http(s) URLs that have a host. */
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

/* ── Formatting ───────────────────────────────────────────────────────── */

/** `123` → `"123 ms"`, `1500` → `"1.50 s"`, nullish → `"—"`. */
export function formatMs(value) {
  const n = Number(value);
  if (value == null || !Number.isFinite(n)) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`;
}

/** Quality bucket + CSS colour token for a latency value. */
export function rateLatency(ms) {
  const n = Number(ms);
  if (ms == null || !Number.isFinite(n)) {
    return { label: 'Unknown', token: 'var(--muted)' };
  }
  if (n <= RATING_THRESHOLDS.good) return { label: 'Excellent', token: 'var(--green)' };
  if (n <= RATING_THRESHOLDS.fair) return { label: 'Good', token: 'var(--cyan)' };
  if (n <= RATING_THRESHOLDS.slow) return { label: 'Needs work', token: 'var(--orange)' };
  return { label: 'Slow', token: 'var(--red)' };
}

/** Human relative time from an ISO string. */
export function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Collision-resistant id that doesn't depend on a secure context. */
export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ── Metrics ──────────────────────────────────────────────────────────── */

/** Average / fastest / slowest across a set of `{ region, ms }` readings. */
export function summarize(readings = []) {
  const values = readings
    .map((r) => Number(r?.ms))
    .filter((n) => Number.isFinite(n));

  if (!values.length) return { avg: null, fastest: null, slowest: null };

  const total = values.reduce((sum, n) => sum + n, 0);
  return {
    avg: Math.round(total / values.length),
    fastest: Math.round(Math.min(...values)),
    slowest: Math.round(Math.max(...values)),
  };
}

/* ── Socket payload normalization ─────────────────────────────────────── */

/** Keys the worker may use for the latency value, most specific first. */
const MS_KEYS = [
  'ttfb',
  'ttfbMs',
  'ttfbTime',
  'firstByte',
  'firstByteTime',
  'responseTime',
  'latency',
  'duration',
  'time',
  'ms',
];

/** Keys the worker may use for the probe region. */
const REGION_KEYS = ['region', 'probe', 'location', 'workerRegion', 'node', 'zone', 'name'];

/** First numeric latency value found on an object (numbers or numeric strings). */
function pickMs(source) {
  if (!source || typeof source !== 'object') return null;
  for (const key of MS_KEYS) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

/** First non-empty region string found on an object. */
function pickRegion(source, fallback = 'Unknown') {
  if (source && typeof source === 'object') {
    for (const key of REGION_KEYS) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return fallback;
}

/** Location of the readings array inside a payload, wherever it was nested. */
function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;
  for (const key of ['results', 'readings', 'regions', 'data', 'result', 'payload']) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return null;
}

/** Extracts detailed metrics from an object. */
function extractMetrics(source) {
  if (!source || typeof source !== 'object') return {};
  // Probe responses may wrap the detailed timing fields under `result` or
  // `data`, while keeping only the region and headline TTFB on the outer row.
  const details = source.result ?? source.data ?? source.metrics ?? source;
  const fields = [
    'totalToFirstByte', 'dns', 'tcp', 'tls', 'min', 'max', 'samples',
    'reliable', 'statusCode',
  ];
  return Object.fromEntries(
    fields
      .filter((key) => details[key] !== undefined)
      .map((key) => [key, details[key]]),
  );
}

/**
 * Normalize a `ttfbCompleted` socket payload into `[{ region, ms, ...metrics }]`.
 *
 * Intentionally defensive: the backend emits once per probe for `find`, and
 * once (or once per queue) for `findAll`, so the shape varies. Unknown shapes
 * resolve to an empty array and are ignored by the caller.
 */
export function extractReadings(payload) {

 // console.log("rAW TTFB PAYLOAD ", payload)
  const list = pickArray(payload);
  if (list) {
    const readings = [];
    for (const item of list) {
      const ms = pickMs(item);
      if (ms != null) {
        const detailSource = item?.result ?? item?.data ?? item?.metrics ?? item;
        readings.push({ region: pickRegion(item), ms, ...extractMetrics(detailSource) });
      }
    }
    if (readings.length) return readings;
  }

  const nested = payload?.data ?? payload?.result ?? payload?.payload;
  const ms = pickMs(payload) ?? pickMs(nested);
  if (ms != null) {
    const region = pickRegion(payload, pickRegion(nested));
    const metrics = { ...extractMetrics(nested), ...extractMetrics(payload) };
    return [{ region, ms, ...metrics }];
  }

  return [];
}

/** True when a single payload already carries more than one reading. */
export function isAggregatePayload(payload) {
  const list = pickArray(payload);
  return Boolean(list && list.length > 1);
}

/* ── Region labels ────────────────────────────────────────────────────── */

const REGION_LABELS = new Map(
  TTFB_REGIONS.map((region) => [region.value.toLowerCase(), region.label]),
);

/** Display label for a backend region key (`india` → `India`). */
export function regionLabel(region) {
  if (!region) return 'Unknown';
  if (region === ALL_REGIONS) return 'All regions';
  return REGION_LABELS.get(String(region).toLowerCase()) || String(region);
}

/* ── DB Record Normalization ─────────────────────────────────────────── */

/** Convert a raw MongoDB TTFB document into a UI measurement entry. */
export function normalizeDbEntry(doc) {
  if (!doc) return null;
  const ms = doc.result?.ttfb != null ? Number(doc.result.ttfb) : null;
  const metrics = doc.result ? {
    totalToFirstByte: doc.result.totalToFirstByte,
    dns: doc.result.dns,
    tcp: doc.result.tcp,
    tls: doc.result.tls,
    min: doc.result.min,
    max: doc.result.max,
    samples: doc.result.samples,
    reliable: doc.result.reliable,
  } : {};
  const readings = ms != null ? [{ region: doc.region, ms, statusCode: doc.result?.statusCode, ...metrics }] : [];
  return {
    id: doc._id,
    dbId: doc._id,
    url: doc.url,
    region: doc.region,
    readings,
    avg: ms,
    fastest: ms,
    slowest: ms,
    status: doc.status || 'completed',
    statusCode: doc.result?.statusCode ?? null,
    error: doc.error ?? null,
    createdAt: doc.createdAt || new Date().toISOString(),
  };
}

/** Group regional MongoDB records into unified multi-probe sessions. */
export function groupDbRecords(records = []) {
  if (!Array.isArray(records) || !records.length) return [];
  const groups = [];
  for (const doc of records) {
    if (!doc) continue;
    const docTime = new Date(doc.createdAt).getTime();
    const existing = groups.find((g) => {
      if (g.url !== doc.url) return false;
      const groupTime = new Date(g.createdAt).getTime();
      if (Math.abs(docTime - groupTime) > 25_000) return false;
      return !g.readings.some((r) => r.region?.toLowerCase() === doc.region?.toLowerCase());
    });

    const ms = doc.result?.ttfb != null ? Number(doc.result.ttfb) : null;
    const metrics = doc.result ? {
      totalToFirstByte: doc.result.totalToFirstByte,
      dns: doc.result.dns,
      tcp: doc.result.tcp,
      tls: doc.result.tls,
      min: doc.result.min,
      max: doc.result.max,
      samples: doc.result.samples,
      reliable: doc.result.reliable,
    } : {};
    const reading = ms != null ? { region: doc.region, ms, statusCode: doc.result?.statusCode, ...metrics } : null;

    if (existing) {
      if (reading) existing.readings.push(reading);
      existing.region = ALL_REGIONS;
      const sums = summarize(existing.readings);
      existing.avg = sums.avg;
      existing.fastest = sums.fastest;
      existing.slowest = sums.slowest;
      existing.docIds.push(doc._id);
      if (doc.status === 'failed') existing.status = 'failed';
    } else {
      const readings = reading ? [reading] : [];
      groups.push({
        id: doc._id,
        dbId: doc._id,
        docIds: [doc._id],
        url: doc.url,
        region: doc.region,
        readings,
        avg: ms,
        fastest: ms,
        slowest: ms,
        status: doc.status || 'completed',
        statusCode: doc.result?.statusCode ?? null,
        error: doc.error ?? null,
        createdAt: doc.createdAt || new Date().toISOString(),
      });
    }
  }
  return groups;
}

