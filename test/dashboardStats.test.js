import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  determineStatus,
  normalizeCheckRecord,
  calculateSummaryStats,
  calculateMonthDelta,
  getUptimeColor,
  filterChecksByTimeRange,
  formatMs,
} from '../src/pages/Dashboard/dashboard.utils.js';

describe('Dashboard Uptime & Monthly Stats Utilities', () => {
  describe('1. determineStatus logic', () => {
    it('categorizes UP correctly for healthy HTTP 200 with low latency', () => {
      assert.equal(determineStatus('UP', 200, 150, null), 'UP');
      assert.equal(determineStatus('operational', 200, 200, null), 'UP');
    });

    it('categorizes SLOW for latency >= 1000ms or DEGRADED/SLOW status', () => {
      assert.equal(determineStatus('UP', 200, 1200, null), 'SLOW');
      assert.equal(determineStatus('DEGRADED', 200, 300, null), 'SLOW');
      assert.equal(determineStatus('SLOW', 200, 400, null), 'SLOW');
    });

    it('categorizes DOWN for status DOWN/OUTAGE, HTTP >= 500, or error message', () => {
      assert.equal(determineStatus('DOWN', 200, 0, null), 'DOWN');
      assert.equal(determineStatus('UP', 502, 100, null), 'DOWN');
      assert.equal(determineStatus('UP', 500, 200, null), 'DOWN');
      assert.equal(determineStatus('UP', 200, 0, 'Connection timeout'), 'DOWN');
    });
  });

  describe('2. normalizeCheckRecord with diverse backend payload shapes', () => {
    it('normalizes flat record with legacy names', () => {
      const raw = {
        _id: 'check-1',
        TotalresponseTime: 180,
        httpStatus: 200,
        status: 'UP',
        ttfb: 65,
        DNSTime: 22,
        checkedAt: '2026-11-18T10:00:00.000Z',
      };
      const norm = normalizeCheckRecord(raw);
      assert.equal(norm.id, 'check-1');
      assert.equal(norm.responseTime, 180);
      assert.equal(norm.httpCode, 200);
      assert.equal(norm.status, 'UP');
      assert.equal(norm.ttfb, 65);
      assert.equal(norm.dnsTime, 22);
    });

    it('normalizes nested payload wrapped inside result (Socket.IO event shape)', () => {
      const raw = {
        monitorId: 42,
        result: {
          id: 'sock-100',
          responseTime: 210,
          httpStatus: 200,
          status: 'UP',
          ttfb: 80,
          dnsTime: 30,
          timestamp: '2026-11-18T11:00:00.000Z',
        },
      };
      const norm = normalizeCheckRecord(raw);
      assert.equal(norm.responseTime, 210);
      assert.equal(norm.httpCode, 200);
      assert.equal(norm.status, 'UP');
      assert.equal(norm.ttfb, 80);
      assert.equal(norm.dnsTime, 30);
    });
  });

  describe('3. calculateSummaryStats operational calculations', () => {
    it('counts both UP and SLOW as operational availability', () => {
      const checks = [
        { status: 'UP', responseTime: 100, timestamp: 1000 },
        { status: 'UP', responseTime: 150, timestamp: 2000 },
        { status: 'SLOW', responseTime: 1200, timestamp: 3000 },
        { status: 'DOWN', responseTime: 0, timestamp: 4000 },
      ];
      const stats = calculateSummaryStats(checks);

      assert.equal(stats.totalChecks, 4);
      assert.equal(stats.upCount, 2);
      assert.equal(stats.slowCount, 1);
      assert.equal(stats.downCount, 1);
      // (2 + 1) / 4 = 75.0%
      assert.equal(stats.uptimePercent, '75.0');
      // Only non-down checks count toward avg ms: (100 + 150 + 1200) / 3 = 483 ms
      assert.equal(stats.avgResponseTime, 483);
      assert.equal(stats.minResponseTime, 100);
      assert.equal(stats.maxResponseTime, 1200);
    });

    it('handles empty checks gracefully', () => {
      const stats = calculateSummaryStats([]);
      assert.equal(stats.totalChecks, 0);
      assert.equal(stats.uptimePercent, '100.0');
      assert.equal(stats.avgResponseTime, 0);
    });
  });

  describe('4. Month-over-Month Delta Calculations & Polarity (Gate 4)', () => {
    it('computes correct delta values between current and previous month', () => {
      const current = {
        uptimePercent: 99.85,
        avgResponseTime: 185.4,
        incidentCount: 1,
      };
      const previous = {
        uptimePercent: 99.50,
        avgResponseTime: 220.0,
        incidentCount: 3,
      };

      const delta = calculateMonthDelta(current, previous);
      assert.ok(delta);
      // Uptime increased by +0.35% (good)
      assert.equal(delta.uptimeDiff, 0.35);
      // Latency decreased by -34.6 ms (good - lower latency)
      assert.equal(delta.latencyDiff, -34.6);
      // Outages decreased by -2 (good - fewer outages)
      assert.equal(delta.incidentsDiff, -2);
    });

    it('returns null if either month is missing', () => {
      assert.equal(calculateMonthDelta(null, { uptimePercent: 99 }), null);
      assert.equal(calculateMonthDelta({ uptimePercent: 99 }, null), null);
    });
  });

  describe('5. getUptimeColor threshold badges', () => {
    it('returns Green (#10b981) for >= 99.5%', () => {
      assert.equal(getUptimeColor(99.5), '#10b981');
      assert.equal(getUptimeColor(99.9), '#10b981');
      assert.equal(getUptimeColor(100), '#10b981');
    });

    it('returns Amber (#f59e0b) for >= 99.0% and < 99.5%', () => {
      assert.equal(getUptimeColor(99.0), '#f59e0b');
      assert.equal(getUptimeColor(99.49), '#f59e0b');
    });

    it('returns Red (#ef4444) for < 99.0%', () => {
      assert.equal(getUptimeColor(98.9), '#ef4444');
      assert.equal(getUptimeColor(95.0), '#ef4444');
    });
  });

  describe('6. formatMs utility', () => {
    it('formats millisecond and second strings correctly', () => {
      assert.equal(formatMs(150), '150 ms');
      assert.equal(formatMs(1500), '1.50 s');
      assert.equal(formatMs(0), '—');
      assert.equal(formatMs(null), '—');
    });
  });

  describe('7. filterChecksByTimeRange utility', () => {
    it('filters checks within 24h, 7d, and 30d correctly', () => {
      const now = Date.now();
      const checks = [
        { timestamp: now - 1 * 60 * 60 * 1000 }, // 1h ago
        { timestamp: now - 3 * 24 * 60 * 60 * 1000 }, // 3d ago
        { timestamp: now - 15 * 24 * 60 * 60 * 1000 }, // 15d ago
        { timestamp: now - 45 * 24 * 60 * 60 * 1000 }, // 45d ago
      ];

      assert.equal(filterChecksByTimeRange(checks, '24h').length, 1);
      assert.equal(filterChecksByTimeRange(checks, '7d').length, 2);
      assert.equal(filterChecksByTimeRange(checks, '30d').length, 3);
    });
  });
});
