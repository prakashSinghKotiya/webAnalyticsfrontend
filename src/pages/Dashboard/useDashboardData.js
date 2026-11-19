import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getMonitors,
  getRecentMonitorResults,
  getMonitorMonthlyStats,
  getMonthlyOverview,
  refreshMonitorMonthlyStats,
} from '../../api/uptime';
import {
  ON,
  subscribeToEvents,
  isSocketConnected,
  connectSocket,
  emitSocketEvent,
  subscribeToConnectionState,
} from '../../api/socket';
import {
  calculateSummaryStats,
  filterChecksByTimeRange,
  groupChecksByDay,
  normalizeCheckRecord,
  prepareDonutData,
  prepareResponseTimeSeries,
  prepareTimelineBlocks,
} from './dashboard.utils';

// Maximum checks to fetch/keep in memory to prevent performance degradation
const MAX_CHECKS_CAP = 500;
const PAGE_FETCH_LIMIT = 100;
const AUTO_REFRESH_INTERVAL_MS = 60000; // 60 seconds

/**
 * useDashboardData
 *
 * Coordinates data fetching, WebSocket real-time telemetry streaming (Gate 3),
 * deduplication, client-side filtering, and persistent monthly statistics (Gate 4).
 */
export default function useDashboardData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const monitorIdFromUrl = searchParams.get('monitorId');

  const [monitors, setMonitors] = useState([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState(monitorIdFromUrl || null);
  const [timeRange, setTimeRange] = useState('24h'); // '24h' | '7d' | '30d'
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [loading, setLoading] = useState(true); // Initial or monitor change loading
  const [refreshing, setRefreshing] = useState(false); // Background/manual refresh loading
  const [error, setError] = useState(null);

  // Raw fetched & live checks for the currently selected monitor
  const [rawChecks, setRawChecks] = useState([]);

  // Socket connection indicator
  const [socketConnected, setSocketConnected] = useState(() => isSocketConnected());

  // Monthly statistics states (Gate 4)
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [monthlyOverview, setMonthlyOverview] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyRefreshing, setMonthlyRefreshing] = useState(false);
  const [monthlyError, setMonthlyError] = useState(null);

  const isMountedRef = useRef(true);
  const fetchRequestIdRef = useRef(0);
  const searchParamsRef = useRef(searchParams);
  const selectedMonitorIdRef = useRef(selectedMonitorId);
  const monitorsRef = useRef(monitors);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    selectedMonitorIdRef.current = selectedMonitorId;
  }, [selectedMonitorId]);

  useEffect(() => {
    monitorsRef.current = monitors;
  }, [monitors]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Internal worker to fetch paginated checks from backend API
   */
  const performFetch = useCallback(async (monitorId, reqId, isSilent) => {
    try {
      // 1. Fetch first page with large limit
      const firstPageData = await getRecentMonitorResults(monitorId, {
        page: 1,
        limit: PAGE_FETCH_LIMIT,
        status: 'ALL',
      });

      if (!isMountedRef.current || fetchRequestIdRef.current !== reqId) return;

      const firstPageList = Array.isArray(firstPageData?.results)
        ? firstPageData.results
        : Array.isArray(firstPageData)
        ? firstPageData
        : [];

      let combinedRaw = [...firstPageList];
      const pagination = firstPageData?.pagination;

      // 2. If paginated and more results are available, fetch remaining pages concurrently
      if (pagination && pagination.totalPages > 1 && combinedRaw.length < MAX_CHECKS_CAP) {
        const totalPages = Math.min(
          pagination.totalPages,
          Math.ceil(MAX_CHECKS_CAP / (pagination.limit || PAGE_FETCH_LIMIT))
        );

        if (totalPages > 1) {
          const pagePromises = [];
          for (let p = 2; p <= totalPages; p++) {
            pagePromises.push(
              getRecentMonitorResults(monitorId, {
                page: p,
                limit: pagination.limit || PAGE_FETCH_LIMIT,
                status: 'ALL',
              }).catch(() => null)
            );
          }

          const subsequentPages = await Promise.all(pagePromises);
          if (!isMountedRef.current || fetchRequestIdRef.current !== reqId) return;

          for (const res of subsequentPages) {
            if (res) {
              const list = Array.isArray(res?.results)
                ? res.results
                : Array.isArray(res)
                ? res
                : [];
              combinedRaw = combinedRaw.concat(list);
              if (combinedRaw.length >= MAX_CHECKS_CAP) break;
            }
          }
        }
      }

      // 3. Normalize all raw checks through single mapping function
      const normalized = combinedRaw
        .map((item, idx) => normalizeCheckRecord(item, idx))
        .filter(Boolean);

      // 4. Deduplicate by ID and timestamp, sort newest first
      const seenKeys = new Set();
      const unique = [];
      for (const item of normalized) {
        const key = item.id || `${item.timestamp}-${item.responseTime}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          unique.push(item);
        }
      }

      unique.sort((a, b) => b.timestamp - a.timestamp);

      if (isMountedRef.current && fetchRequestIdRef.current === reqId) {
        setRawChecks(unique);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current && fetchRequestIdRef.current === reqId) {
        const msg = err?.error || err?.message || 'Failed to load monitor check history.';
        setError(msg);
      }
    } finally {
      if (isMountedRef.current && fetchRequestIdRef.current === reqId) {
        if (!isSilent) setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  /**
   * Load Monthly Statistics and Fleet Overview (Gate 4)
   */
  const loadMonthlyData = useCallback(async (monitorId, isSilent = false) => {
    if (!monitorId) return;
    if (!isSilent) setMonthlyLoading(true);
    setMonthlyError(null);

    try {
      const [statsRes, overviewRes] = await Promise.all([
        getMonitorMonthlyStats(monitorId, 6).catch((err) => ({ error: err })),
        getMonthlyOverview().catch((err) => ({ error: err })),
      ]);

      if (!isMountedRef.current) return;

      if (statsRes?.success) {
        setMonthlyStats(statsRes);
      }
      if (overviewRes?.success) {
        setMonthlyOverview(overviewRes);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setMonthlyError(err?.message || 'Failed to load monthly statistics');
      }
    } finally {
      if (isMountedRef.current && !isSilent) {
        setMonthlyLoading(false);
      }
    }
  }, []);

  // 1. Initial load of user monitors
  useEffect(() => {
    let ignore = false;
    getMonitors()
      .then((data) => {
        if (!ignore && isMountedRef.current) {
          const list = Array.isArray(data?.monitors) ? data.monitors : [];
          setMonitors(list);

          if (list.length > 0) {
            setSelectedMonitorId((prev) => {
              const urlId = searchParamsRef.current.get('monitorId');
              if (urlId && list.some((m) => String(m._id || m.id) === String(urlId))) {
                return String(urlId);
              }
              const exists = list.some((m) => String(m._id || m.id) === String(prev));
              return exists ? prev : String(list[0]._id || list[0].id);
            });
          } else {
            setSelectedMonitorId(null);
            setRawChecks([]);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        if (!ignore && isMountedRef.current) {
          const msg = err?.error || err?.message || 'Failed to load user monitors.';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Fetch checks & monthly stats whenever selectedMonitorId changes
  useEffect(() => {
    if (!selectedMonitorId) return;

    const reqId = ++fetchRequestIdRef.current;
    performFetch(selectedMonitorId, reqId, false);
    loadMonthlyData(selectedMonitorId, false);

    // Join room for real-time socket events
    emitSocketEvent('uptime-job', { monitorId: selectedMonitorId });
  }, [selectedMonitorId, performFetch, loadMonthlyData]);

  // 3. 60-second background refresh timer
  useEffect(() => {
    if (!autoRefresh || !selectedMonitorId) return;

    const intervalId = setInterval(() => {
      setRefreshing(true);
      const reqId = ++fetchRequestIdRef.current;
      performFetch(selectedMonitorId, reqId, true);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [autoRefresh, selectedMonitorId, performFetch]);

  // 4. Real-time WebSocket listener (Gate 3)
  useEffect(() => {
    if (!isSocketConnected()) {
      connectSocket();
    }

    const unsubConnection = subscribeToConnectionState((state) => {
      const isConn = state.status === 'connected';
      setSocketConnected(isConn);
      if (isConn && selectedMonitorIdRef.current) {
        // On reconnect, backfill once to avoid missed checks
        const reqId = ++fetchRequestIdRef.current;
        performFetch(selectedMonitorIdRef.current, reqId, true);
      }
    });

    const handleIncomingResult = (payload) => {
      if (!payload || !isMountedRef.current) return;

      const rawCheck = payload.result || payload;
      const inner =
        rawCheck && typeof rawCheck === 'object' && rawCheck.result && typeof rawCheck.result === 'object'
          ? rawCheck.result
          : rawCheck;

      const incomingMonitorId = String(payload.monitorId || inner?.monitorId || payload.id || '');
      const currentSelected = selectedMonitorIdRef.current;

      let matches = false;
      if (incomingMonitorId && currentSelected && String(incomingMonitorId) === String(currentSelected)) {
        matches = true;
      } else if (currentSelected) {
        const currentMon = monitorsRef.current.find(
          (m) => String(m._id || m.id) === String(currentSelected)
        );
        if (currentMon) {
          try {
            const host = new URL(currentMon.url).hostname;
            const targetHost =
              inner?.checkingFor || (payload?.url ? new URL(payload.url).hostname : null);
            if (targetHost && (host === targetHost || currentMon.url.includes(targetHost))) {
              matches = true;
            }
          } catch {
            // Ignore URL parse error
          }
        }
      }

      const normalized = normalizeCheckRecord(payload);

      if (matches && normalized) {
        setRawChecks((prev) => {
          const exists = prev.some(
            (c) =>
              (c.id && normalized.id && c.id === normalized.id) ||
              (c.timestamp === normalized.timestamp && c.responseTime === normalized.responseTime)
          );
          if (exists) return prev;
          const updated = [normalized, ...prev];
          return updated.length > MAX_CHECKS_CAP ? updated.slice(0, MAX_CHECKS_CAP) : updated;
        });
      }

      // Update monitor list entry's last check in real time
      if (incomingMonitorId && normalized) {
        setMonitors((prev) =>
          prev.map((m) => {
            if (String(m._id || m.id) === String(incomingMonitorId)) {
              return {
                ...m,
                lastCheck: normalized,
                lastResult: normalized,
                lastCheckedAt: normalized.time,
              };
            }
            return m;
          })
        );
      }
    };

    const unsubEvents = subscribeToEvents({
      [ON.UPTIME_COMPLETED]: handleIncomingResult,
      [ON.UPTIME_RESULT]: handleIncomingResult,
    });

    return () => {
      unsubConnection();
      unsubEvents();
    };
  }, [performFetch]);

  // User-facing monitor select handler
  const handleSelectMonitor = useCallback((newId) => {
    const idStr = String(newId);
    setSelectedMonitorId(idStr);
    setLoading(true);
    setSearchParams((prevParams) => {
      const next = new URLSearchParams(prevParams);
      if (next.get('monitorId') !== idStr) {
        next.set('monitorId', idStr);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Sync state if monitorId in URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    const urlId = searchParams.get('monitorId');
    if (
      urlId &&
      urlId !== selectedMonitorIdRef.current &&
      monitorsRef.current.some((m) => String(m._id || m.id) === String(urlId))
    ) {
      setSelectedMonitorId(urlId);
      setLoading(true);
    }
  }, [searchParams]);

  // Manual refresh trigger
  const handleRefresh = useCallback(() => {
    if (selectedMonitorId) {
      setRefreshing(true);
      const reqId = ++fetchRequestIdRef.current;
      performFetch(selectedMonitorId, reqId, false);
      loadMonthlyData(selectedMonitorId, true);
    } else {
      setLoading(true);
      getMonitors()
        .then((data) => {
          if (isMountedRef.current) {
            const list = Array.isArray(data?.monitors) ? data.monitors : [];
            setMonitors(list);
            if (list.length > 0) {
              const firstId = String(list[0]._id || list[0].id);
              setSelectedMonitorId(firstId);
            } else {
              setLoading(false);
            }
          }
        })
        .catch((err) => {
          if (isMountedRef.current) {
            setError(err?.error || err?.message || 'Failed to reload monitors.');
            setLoading(false);
          }
        });
    }
  }, [selectedMonitorId, performFetch, loadMonthlyData]);

  // Manual trigger for monthly rollup refresh
  const handleRefreshMonthly = useCallback(async () => {
    const targetId = selectedMonitorIdRef.current;
    if (!targetId) return;
    setMonthlyRefreshing(true);
    try {
      await refreshMonitorMonthlyStats(targetId);
      await loadMonthlyData(targetId, true);
    } catch (err) {
      console.warn('[useDashboardData] Refresh monthly notice:', err?.message || err);
    } finally {
      if (isMountedRef.current) {
        setMonthlyRefreshing(false);
      }
    }
  }, [loadMonthlyData]);

  // Currently selected monitor object
  const selectedMonitor = useMemo(() => {
    if (!selectedMonitorId) return null;
    return monitors.find((m) => String(m._id || m.id) === String(selectedMonitorId)) || null;
  }, [monitors, selectedMonitorId]);

  // ── Client-side Memoized Computations ──────────────────────────────────────

  // 1. Filtered checks based on selected timeRange (24h, 7d, 30d)
  const filteredChecks = useMemo(() => {
    return filterChecksByTimeRange(rawChecks, timeRange);
  }, [rawChecks, timeRange]);

  // 2. Summary stats for stat cards
  const summaryStats = useMemo(() => {
    return calculateSummaryStats(filteredChecks);
  }, [filteredChecks]);

  // 3. Response time time-series for AreaChart
  const responseTimeSeries = useMemo(() => {
    return prepareResponseTimeSeries(filteredChecks, timeRange);
  }, [filteredChecks, timeRange]);

  // 4. Daily grouped data for Stacked Bar Chart
  const statusByDayData = useMemo(() => {
    return groupChecksByDay(filteredChecks);
  }, [filteredChecks]);

  // 5. Donut chart share data
  const donutData = useMemo(() => {
    return prepareDonutData(summaryStats);
  }, [summaryStats]);

  // 6. Compact status page timeline strip
  const timelineBlocks = useMemo(() => {
    return prepareTimelineBlocks(filteredChecks, timeRange);
  }, [filteredChecks, timeRange]);

  return {
    monitors,
    selectedMonitor,
    selectedMonitorId,
    setSelectedMonitorId: handleSelectMonitor,
    timeRange,
    setTimeRange,
    autoRefresh,
    setAutoRefresh,
    loading,
    refreshing,
    error,
    handleRefresh,
    socketConnected,
    allChecksCount: rawChecks.length,
    filteredChecks,
    summaryStats,
    responseTimeSeries,
    statusByDayData,
    donutData,
    timelineBlocks,
    // Gate 4 Monthly Stats
    monthlyStats,
    monthlyOverview,
    monthlyLoading,
    monthlyRefreshing,
    monthlyError,
    handleRefreshMonthly,
  };
}