/**
 * Dashboard Uptime Monitoring Utilities
 *
 * Responsibilities:
 *  1. Single mapping function (normalizeCheckRecord) to adapt any backend response shape.
 *  2. Time range filtering (24h, 7d, 30d).
 *  3. Summary statistics calculations (uptime %, avg ms, down count, etc.).
 *  4. Chart data transformations for Recharts (Line/Area, Stacked Bar, Donut, Timeline strip).
 */

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FIELD MAPPINGS CONFIGURATION
 * Edit these property fallbacks if your backend response field names ever change.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const FIELD_MAPPINGS = {
  // Response time candidate fields in priority order
  responseTime: [
    'TotalresponseTime',
    'responseTime',
    'totalResponseTime',
    'total_response_time',
    'latency',
    'duration',
  ],
  // HTTP status candidate fields
  httpCode: [
    'httpStatus',
    'statusCode',
    'status_code',
    'code',
  ],
  // Timestamp candidate fields
  timestamp: [
    'timestamp',
    'checkedAt',
    'checked_at',
    'createdAt',
    'created_at',
    'time',
    'date',
  ],
  // Status string candidate fields
  status: [
    'status',
    'checkStatus',
    'state',
  ],
  // Error message candidate fields
  error: [
    'error',
    'errorMessage',
    'message',
  ],
  // TTFB candidate fields
  ttfb: [
    'ttfb',
    'TTFB',
    'timeToFirstByte',
  ],
  // DNS candidate fields
  dnsTime: [
    'DNSTime',
    'dnsTime',
    'dns',
  ],
  // Next scheduled check candidate fields
  nextCheckAt: [
    'nextCheckAt',
    'next_check_at',
  ],
};

/**
 * Extracts the first matching value from an object given an array of candidate keys.
 */
function extractField(obj, candidateKeys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of candidateKeys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
}

/**
 * Categorizes a check as 'UP', 'SLOW', or 'DOWN'.
 * Slow threshold: >= 1000ms latency or status reported as 'SLOW' / 'DEGRADED'.
 * Down threshold: HTTP >= 500, status 'DOWN' / 'OUTAGE', or fatal probe error.
 */
export function determineStatus(rawStatus, httpCode, responseTime, error) {
  const s = String(rawStatus || '').toUpperCase();
  const code = Number(httpCode);
  const ms = Number(responseTime);

  // 1. Explicit DOWN or HTTP 5xx server error
  if (s === 'DOWN' || s === 'OUTAGE' || (code >= 500 && code <= 599)) {
    return 'DOWN';
  }

  // 2. Fatal client probe error (e.g. DNS_ERROR, TIMEOUT, ECONNREFUSED) when not UP
  const isFatalError =
    error &&
    typeof error === 'string' &&
    !['HTTP_OK', 'OK', 'SUCCESS', '200', '301', '302'].includes(error.trim().toUpperCase());

  if (isFatalError && s !== 'UP' && s !== 'DEGRADED') {
    return 'DOWN';
  }

  // 3. Degraded / Slow check (>= 1000ms or DEGRADED)
  if (s === 'DEGRADED' || s === 'SLOW' || (Number.isFinite(ms) && ms >= 1000)) {
    return 'SLOW';
  }

  // 4. Default to UP
  return 'UP';
}

/**
 * Normalizes a single raw check result record into a consistent structure.
 *
 * @param {Object} rawItem - Check record from API (may be wrapped in .result or flat)
 * @param {number} fallbackIndex - Index used for fallback ID generation
 * @returns {Object} Normalized check object:
 *   { id, time, timestamp, dateObj, responseTime, httpCode, status, rawStatus, error, raw }
 */
export function normalizeCheckRecord(rawItem, fallbackIndex = 0) {
  if (!rawItem || typeof rawItem !== 'object') {
    return null;
  }

  // Unwrap nested `result` property if backend wraps check payload
  const inner = rawItem.result && typeof rawItem.result === 'object' ? rawItem.result : rawItem;

  // 1. Timestamp extraction
  const rawTimestamp =
    extractField(rawItem, FIELD_MAPPINGS.timestamp) ??
    extractField(inner, FIELD_MAPPINGS.timestamp) ??
    Date.now();

  const dateObj = new Date(rawTimestamp);
  const timestamp = Number.isNaN(dateObj.getTime()) ? Date.now() : dateObj.getTime();
  const time = new Date(timestamp).toISOString();

  // 2. Response time extraction
  const rawMs =
    extractField(inner, FIELD_MAPPINGS.responseTime) ??
    extractField(rawItem, FIELD_MAPPINGS.responseTime);
  const responseTime = rawMs != null && !Number.isNaN(Number(rawMs)) ? Math.max(0, Math.round(Number(rawMs))) : 0;

  // 3. HTTP status extraction
  const rawHttp =
    extractField(inner, FIELD_MAPPINGS.httpCode) ??
    extractField(rawItem, FIELD_MAPPINGS.httpCode);
  const httpCode = rawHttp != null && !Number.isNaN(Number(rawHttp)) ? Number(rawHttp) : null;

  // 4. Status extraction
  const rawStatus =
    extractField(inner, FIELD_MAPPINGS.status) ??
    extractField(rawItem, FIELD_MAPPINGS.status) ??
    'UP';

  // 5. Error message
  const error =
    extractField(inner, FIELD_MAPPINGS.error) ??
    extractField(rawItem, FIELD_MAPPINGS.error) ??
    null;

  // 6. TTFB & DNS extraction
  const rawTtfb =
    extractField(inner, FIELD_MAPPINGS.ttfb) ??
    extractField(rawItem, FIELD_MAPPINGS.ttfb);
  const ttfb = rawTtfb != null && !Number.isNaN(Number(rawTtfb)) ? Math.round(Number(rawTtfb)) : null;

  const rawDns =
    extractField(inner, FIELD_MAPPINGS.dnsTime) ??
    extractField(rawItem, FIELD_MAPPINGS.dnsTime);
  const dnsTime = rawDns != null && !Number.isNaN(Number(rawDns)) ? Math.round(Number(rawDns)) : null;

  const rawNextCheck =
    extractField(inner, FIELD_MAPPINGS.nextCheckAt) ??
    extractField(rawItem, FIELD_MAPPINGS.nextCheckAt) ??
    null;

  // Determine normalized status: UP | SLOW | DOWN
  const status = determineStatus(rawStatus, httpCode, responseTime, error);

  // Unique identifier
  const id = rawItem._id || rawItem.id || inner._id || inner.id || `${timestamp}-${fallbackIndex}`;

  return {
    id: String(id),
    time,
    timestamp,
    dateObj: new Date(timestamp),
    responseTime,
    httpCode,
    status,
    rawStatus: String(rawStatus),
    ttfb,
    dnsTime,
    nextCheckAt: rawNextCheck ? String(rawNextCheck) : null,
    error: error ? String(error) : null,
    raw: rawItem,
  };
}

/**
 * Filter checks by time range (24h, 7d, 30d).
 */
export function filterChecksByTimeRange(checks, rangeKey = '24h') {
  if (!Array.isArray(checks)) return [];
  const now = Date.now();
  let msWindow = 24 * 60 * 60 * 1000; // 24h default

  if (rangeKey === '7d') {
    msWindow = 7 * 24 * 60 * 60 * 1000;
  } else if (rangeKey === '30d') {
    msWindow = 30 * 24 * 60 * 60 * 1000;
  }

  const cutoff = now - msWindow;
  return checks.filter((c) => c.timestamp >= cutoff);
}

/**
 * Calculates a 0-100 speed/performance score matching the hosting review formula:
 * 60% availability weighting + 40% latency weighting.
 */
export function calculateSpeedScore(uptimePct, avgRt) {
  if (uptimePct == null || avgRt == null || avgRt <= 0) return 85;
  const availability = Math.min(100, Math.max(0, ((Number(uptimePct) - 95) / 5) * 100));
  const speed = Math.min(100, Math.max(0, (1 - (Number(avgRt) - 200) / 1800) * 100));
  return Math.round(availability * 0.6 + speed * 0.4);
}

/**
 * Computes all summary statistics for a given set of normalized checks.
 * Produces the exact statistics and shape used in Hosting Review telemetry:
 *  - Recorded uptime %
 *  - Avg response time with p95 & sparkline points
 *  - Speed score (0-100)
 *  - Total checks & window days
 *  - Reliability snapshot metrics (incidents, min, max, streak)
 */
export function calculateSummaryStats(checks) {
  if (!Array.isArray(checks) || checks.length === 0) {
    return {
      totalChecks: 0,
      upCount: 0,
      slowCount: 0,
      downCount: 0,
      uptimePercent: '100%',
      uptimePercentNumber: 100,
      pureUpPercent: '100%',
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p95: 0,
      speedScore: 100,
      downIncidents: 0,
      longestStreak: 0,
      windowDays: 1,
      sparklinePoints: '',
      lastCheck: null,
      daily: [],
      hostingStats: {
        uptime: { percentage: 100 },
        responseTime: { avg: 0, min: 0, max: 0, p95: 0 },
        performanceScore: 100,
        checks: { total: 0, up: 0, down: 0, windowDays: 1 },
        incidents: { count: 0, longestUpStreakChecks: 0 },
        daily: [],
      },
    };
  }

  let upCount = 0;
  let slowCount = 0;
  let downCount = 0;
  let totalMs = 0;
  let validMsCount = 0;
  let minMs = Infinity;
  let maxMs = 0;

  // Chronologically sorted (oldest to newest)
  const chronChecks = [...checks].sort((a, b) => a.timestamp - b.timestamp);
  // Last check is the newest check
  const lastCheck = chronChecks[chronChecks.length - 1] || null;

  // Count incidents (distinct state transitions into DOWN) and longest operational streak
  let downIncidents = 0;
  let wasDown = false;
  let currentStreak = 0;
  let longestStreak = 0;

  const validLatencies = [];

  for (const c of chronChecks) {
    if (c.status === 'DOWN') {
      downCount++;
      if (!wasDown) {
        downIncidents++;
        wasDown = true;
      }
      currentStreak = 0;
    } else {
      wasDown = false;
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      if (c.status === 'SLOW') {
        slowCount++;
      } else {
        upCount++;
      }
    }

    // Collect response time
    if (Number.isFinite(c.responseTime) && c.responseTime > 0) {
      validLatencies.push(c.responseTime);
      if (c.status !== 'DOWN') {
        totalMs += c.responseTime;
        validMsCount++;
        if (c.responseTime < minMs) minMs = c.responseTime;
        if (c.responseTime > maxMs) maxMs = c.responseTime;
      }
    }
  }

  const totalChecks = checks.length;
  // Operational uptime: (Up + Slow) / Total
  const operationalCount = upCount + slowCount;
  const uptimeRatio = totalChecks > 0 ? (operationalCount / totalChecks) * 100 : 100;
  const pureUpRatio = totalChecks > 0 ? (upCount / totalChecks) * 100 : 100;

  const avgResponseTime = validMsCount > 0 ? Math.round(totalMs / validMsCount) : 0;

  // 95th percentile response time
  validLatencies.sort((a, b) => a - b);
  const p95 = validLatencies.length > 0
    ? validLatencies[Math.min(validLatencies.length - 1, Math.floor(validLatencies.length * 0.95))]
    : avgResponseTime;

  // Speed score (0-100 composite)
  const speedScore = calculateSpeedScore(uptimeRatio, avgResponseTime);

  // Monitoring window in days
  const firstTimestamp = chronChecks[0]?.timestamp || Date.now();
  const lastTimestamp = chronChecks[chronChecks.length - 1]?.timestamp || Date.now();
  const windowDays = Math.max(
    1,
    Math.round((lastTimestamp - firstTimestamp) / (24 * 60 * 60 * 1000)) || 1
  );

  // Daily points for PerformanceChart
  const dailySeries = groupChecksByDay(checks).map((b) => ({
    date: b.dateKey,
    uptime: Number(b.uptimePercent),
    avgResponseTime: b.avgMs,
    checks: b.total,
  }));

  // Sparkline points for Avg Response Time card (56x20 viewBox)
  let sparklinePoints = '';
  if (dailySeries.length >= 2) {
    const vals = dailySeries.map((d) => d.avgResponseTime).filter((v) => typeof v === 'number' && v > 0);
    if (vals.length >= 2) {
      const minV = Math.min(...vals);
      const maxV = Math.max(...vals);
      const rangeV = Math.max(1, maxV - minV);
      const w = 54;
      const h = 18;
      sparklinePoints = vals
        .map((v, i) => {
          const x = (i / (vals.length - 1)) * w;
          const y = h - ((v - minV) / rangeV) * (h - 4) - 2;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    }
  } else if (chronChecks.length >= 2) {
    // If fewer than 2 days, sample up to 10 points from recent checks
    const sampleStep = Math.max(1, Math.floor(chronChecks.length / 10));
    const sampled = [];
    for (let i = 0; i < chronChecks.length; i += sampleStep) {
      if (chronChecks[i].responseTime > 0) {
        sampled.push(chronChecks[i].responseTime);
      }
    }
    if (sampled.length >= 2) {
      const minV = Math.min(...sampled);
      const maxV = Math.max(...sampled);
      const rangeV = Math.max(1, maxV - minV);
      const w = 54;
      const h = 18;
      sparklinePoints = sampled
        .map((v, i) => {
          const x = (i / (sampled.length - 1)) * w;
          const y = h - ((v - minV) / rangeV) * (h - 4) - 2;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    }
  }

  // Canonical Hosting Review style stats bundle
  const hostingStats = {
    uptime: {
      percentage: Number(uptimeRatio.toFixed(3)),
    },
    responseTime: {
      avg: avgResponseTime,
      min: minMs === Infinity ? 0 : minMs,
      max: maxMs,
      p95,
    },
    performanceScore: speedScore,
    checks: {
      total: totalChecks,
      up: operationalCount,
      down: downCount,
      windowDays,
    },
    incidents: {
      count: downIncidents,
      longestUpStreakChecks: longestStreak || operationalCount,
    },
    daily: dailySeries,
  };

  return {
    totalChecks,
    upCount,
    slowCount,
    downCount,
    uptimePercent: uptimeRatio >= 100 ? '100%' : uptimeRatio.toFixed(3) + '%',
    uptimePercentNumber: Number(uptimeRatio.toFixed(3)),
    pureUpPercent: pureUpRatio.toFixed(3),
    avgResponseTime,
    minResponseTime: minMs === Infinity ? 0 : minMs,
    maxResponseTime: maxMs,
    p95,
    speedScore,
    downIncidents,
    longestStreak: longestStreak || operationalCount,
    windowDays,
    sparklinePoints,
    lastCheck,
    daily: dailySeries,
    hostingStats,
  };
}

/**
 * Groups checks by calendar day for the stacked bar chart.
 * Ensures the chart shows a logical chronological sequence.
 */
export function groupChecksByDay(checks) {
  if (!Array.isArray(checks) || checks.length === 0) {
    return [];
  }

  const dayBuckets = new Map();

  // Sort chronological (oldest to newest)
  const sorted = [...checks].sort((a, b) => a.timestamp - b.timestamp);

  for (const c of sorted) {
    const d = c.dateObj;
    // YYYY-MM-DD
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    if (!dayBuckets.has(dateKey)) {
      dayBuckets.set(dateKey, {
        dateKey,
        day: label,
        UP: 0,
        SLOW: 0,
        DOWN: 0,
        total: 0,
        totalMs: 0,
        msCount: 0,
      });
    }

    const bucket = dayBuckets.get(dateKey);
    bucket.total++;
    if (c.status === 'DOWN') {
      bucket.DOWN++;
    } else if (c.status === 'SLOW') {
      bucket.SLOW++;
    } else {
      bucket.UP++;
    }

    if (c.status !== 'DOWN' && c.responseTime > 0) {
      bucket.totalMs += c.responseTime;
      bucket.msCount++;
    }
  }

  return Array.from(dayBuckets.values()).map((b) => ({
    day: b.day,
    dateKey: b.dateKey,
    UP: b.UP,
    SLOW: b.SLOW,
    DOWN: b.DOWN,
    total: b.total,
    avgMs: b.msCount > 0 ? Math.round(b.totalMs / b.msCount) : 0,
    uptimePercent: b.total > 0 ? (((b.UP + b.SLOW) / b.total) * 100).toFixed(1) : '100.0',
  }));
}

/**
 * Prepares chronological data for the Response-Time Line/Area Chart.
 */
export function prepareResponseTimeSeries(checks, rangeKey = '24h') {
  if (!Array.isArray(checks) || checks.length === 0) {
    return [];
  }

  // Sort chronologically (oldest -> newest)
  const sorted = [...checks].sort((a, b) => a.timestamp - b.timestamp);

  return sorted.map((c) => {
    const d = c.dateObj;
    const label =
      rangeKey === '24h'
        ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
        : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`;

    const fullDate = d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return {
      id: c.id,
      timestamp: c.timestamp,
      label,
      fullDate,
      responseTime:
        Number.isFinite(c.responseTime) && c.responseTime > 0
          ? c.responseTime
          : c.status === 'DOWN'
          ? 0
          : 0,
      status: c.status,
      httpCode: c.httpCode,
      ttfb: c.ttfb ?? null,
      dnsTime: c.dnsTime ?? null,
      error: c.error,
    };
  });
}

/**
 * Prepares data for Donut Chart (Up vs Slow vs Down share).
 */
export function prepareDonutData(stats) {
  const { upCount = 0, slowCount = 0, downCount = 0, totalChecks = 0 } = stats || {};

  if (totalChecks === 0) {
    return [
      { name: 'Up', value: 1, count: 0, percent: '100%', color: '#10b981' },
      { name: 'Slow', value: 0, count: 0, percent: '0%', color: '#f59e0b' },
      { name: 'Down', value: 0, count: 0, percent: '0%', color: '#ef4444' },
    ];
  }

  const upPct = ((upCount / totalChecks) * 100).toFixed(1);
  const slowPct = ((slowCount / totalChecks) * 100).toFixed(1);
  const downPct = ((downCount / totalChecks) * 100).toFixed(1);

  return [
    { name: 'Up', value: upCount, count: upCount, percent: `${upPct}%`, color: '#10b981' },
    { name: 'Slow', value: slowCount, count: slowCount, percent: `${slowPct}%`, color: '#f59e0b' },
    { name: 'Down', value: downCount, count: downCount, percent: `${downPct}%`, color: '#ef4444' },
  ];
}

/**
 * Prepares blocks for the compact status-page style timeline strip.
 * Maps checks into ~40-60 visual discrete blocks across the selected time range.
 */
export function prepareTimelineBlocks(checks, rangeKey = '24h', maxBlocks = 48) {
  if (!Array.isArray(checks) || checks.length === 0) {
    return [];
  }

  const now = Date.now();
  let msWindow = 24 * 60 * 60 * 1000;
  if (rangeKey === '7d') msWindow = 7 * 24 * 60 * 60 * 1000;
  if (rangeKey === '30d') msWindow = 30 * 24 * 60 * 60 * 1000;

  const startTime = now - msWindow;
  const bucketDuration = msWindow / maxBlocks;

  const buckets = Array.from({ length: maxBlocks }, (_, idx) => {
    const bStart = startTime + idx * bucketDuration;
    const bEnd = bStart + bucketDuration;
    return {
      index: idx,
      start: bStart,
      end: bEnd,
      checks: [],
    };
  });

  // Assign each check to a bucket
  for (const c of checks) {
    if (c.timestamp >= startTime && c.timestamp <= now) {
      const idx = Math.min(
        maxBlocks - 1,
        Math.max(0, Math.floor((c.timestamp - startTime) / bucketDuration))
      );
      buckets[idx].checks.push(c);
    }
  }

  return buckets.map((b) => {
    const bDateStart = new Date(b.start);
    const bDateEnd = new Date(b.end);
    const timeLabel =
      rangeKey === '24h'
        ? `${bDateStart.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })} - ${bDateEnd.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`
        : `${bDateStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

    if (b.checks.length === 0) {
      return {
        id: `block-${b.index}`,
        hasData: false,
        status: 'NONE',
        color: 'var(--border-mid)',
        timeLabel,
        count: 0,
        avgMs: null,
        tooltip: `${timeLabel} · No checks recorded`,
      };
    }

    // Determine worst status in bucket: DOWN > SLOW > UP
    const hasDown = b.checks.some((c) => c.status === 'DOWN');
    const hasSlow = b.checks.some((c) => c.status === 'SLOW');
    const status = hasDown ? 'DOWN' : hasSlow ? 'SLOW' : 'UP';

    const color = hasDown ? '#ef4444' : hasSlow ? '#f59e0b' : '#10b981';

    let totalMs = 0;
    let msCount = 0;
    for (const c of b.checks) {
      if (c.status !== 'DOWN' && c.responseTime > 0) {
        totalMs += c.responseTime;
        msCount++;
      }
    }
    const avgMs = msCount > 0 ? Math.round(totalMs / msCount) : null;

    const statusLabel = hasDown ? 'Outage detected' : hasSlow ? 'Degraded response' : 'Operational';
    const latencyText = avgMs != null ? ` · Avg: ${avgMs} ms` : '';

    return {
      id: `block-${b.index}`,
      hasData: true,
      status,
      color,
      timeLabel,
      count: b.checks.length,
      avgMs,
      tooltip: `${timeLabel} · ${statusLabel} (${b.checks.length} check${b.checks.length === 1 ? '' : 's'}${latencyText})`,
    };
  });
}

/**
 * Format milliseconds into human string
 */
export function formatMs(value) {
  const n = Number(value);
  if (value == null || !Number.isFinite(n) || n === 0) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`;
}

/**
 * Relative time formatter (e.g. "Just now", "4 min ago", "2 hours ago")
 */
export function relativeTime(isoOrTimestamp) {
  if (!isoOrTimestamp) return '—';
  const then = new Date(isoOrTimestamp).getTime();
  if (Number.isNaN(then)) return '—';

  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MONTHLY STATISTICS UTILITIES (GATE 4)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Returns consistent color tokens for uptime percentages
 * >= 99.5%: Green (#10b981)
 * >= 99.0%: Amber (#f59e0b)
 * < 99.0%: Red (#ef4444)
 */
export function getUptimeColor(pct) {
  if (pct === null || pct === undefined || Number.isNaN(Number(pct))) return 'var(--muted-2)';
  const val = Number(pct);
  if (val >= 99.5) return '#10b981';
  if (val >= 99.0) return '#f59e0b';
  return '#ef4444';
}

/**
 * Calculate month-over-month deltas with polarity
 */
export function calculateMonthDelta(current, previous) {
  if (!current || !previous) return null;

  const uptimeDiff =
    current.uptimePercent != null && previous.uptimePercent != null
      ? Number((current.uptimePercent - previous.uptimePercent).toFixed(2))
      : null;

  const latencyDiff =
    current.avgResponseTime != null && previous.avgResponseTime != null
      ? Number((current.avgResponseTime - previous.avgResponseTime).toFixed(1))
      : null;

  const incidentsDiff =
    current.incidentCount != null && previous.incidentCount != null
      ? current.incidentCount - previous.incidentCount
      : null;

  const downChecksDiff =
    current.downChecks != null && previous.downChecks != null
      ? current.downChecks - previous.downChecks
      : null;

  return {
    uptimeDiff,
    uptimePercent: uptimeDiff,
    latencyDiff,
    avgResponseTime: latencyDiff,
    incidentsDiff,
    incidentCount: incidentsDiff,
    downChecksDiff,
    downChecks: downChecksDiff,
  };
}

/**
 * Formats a localized number with commas
 */
export function formatNumber(val) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '0';
  return Number(val).toLocaleString();
}
