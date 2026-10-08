import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getMonitors,
  createMonitor as apiCreateMonitor,
  updateMonitor as apiUpdateMonitor,
  deleteMonitor as apiDeleteMonitor,
  pauseMonitor as apiPauseMonitor,
  resumeMonitor as apiResumeMonitor,
  getRunningMonitorDetails,
  getRecentMonitorResults,
} from '../../api/uptime';
import {
  ON,
  subscribeToEvents,
  emitSocketEvent,
  isSocketConnected,
  connectSocket,
} from '../../api/socket';
import { useToast } from '../../context';
import { DEFAULT_RESULTS_LIMIT, isValidUrl, normalizeUrl } from './uptime.utils';

/**
 * useUptime — manages the complete Uptime Monitoring lifecycle.
 *
 * Responsibilities:
 *  1. Fetches monitors from backend directly (`GET /uptime/monitors`), never stored in localStorage.
 *  2. Handles monitor creation (`POST /uptime/create`) and instantly reflects in live list.
 *  3. Listens to `uptimeCompleted` real-time WebSocket events.
 *  4. Provides status controls: pause, resume, delete, and update.
 *  5. Maintains live telemetry state (`latestResult`) for the real-time result section.
 *  6. Inspects running monitor details (`GET /uptime/monitor/:id`) and paginated results (`GET /uptime/monitor/:id/results`).
 *  7. Scalable state management with race condition protection and zero extra frontend storage.
 */
export default function useUptime() {
  const toast = useToast();

  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionInProgress, setActionInProgress] = useState({}); // { [id]: 'pause' | 'resume' | 'delete' | 'update' }
  const [error, setError] = useState(null);

  // Latest check result from socket or recent inspection
  const [latestResult, setLatestResult] = useState(null);
  const [activeMonitorId, setActiveMonitorId] = useState(null);

  // Selected running monitor inspection details & paginated results
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [monitorResults, setMonitorResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);
  const [resultsPagination, setResultsPagination] = useState({
    page: 1,
    limit: DEFAULT_RESULTS_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [resultsStatusFilter, setResultsStatusFilter] = useState('ALL');

  const mountedRef = useRef(true);
  const resultsReqIdRef = useRef(0);
  const activeMonitorIdRef = useRef(activeMonitorId);
  const resultsPaginationRef = useRef(resultsPagination);
  const resultsStatusFilterRef = useRef(resultsStatusFilter);

  useEffect(() => {
    activeMonitorIdRef.current = activeMonitorId;
  }, [activeMonitorId]);

  useEffect(() => {
    resultsPaginationRef.current = resultsPagination;
  }, [resultsPagination]);

  useEffect(() => {
    resultsStatusFilterRef.current = resultsStatusFilter;
  }, [resultsStatusFilter]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** Fetch monitors fresh from backend database (no localStorage) */
  const fetchMonitors = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getMonitors();
      if (!mountedRef.current) return;
      const list = Array.isArray(data?.monitors) ? data.monitors : [];
      setMonitors(list);
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err?.error || err?.message || 'Failed to load monitors';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, [toast]);

  // Initial load on mount
  useEffect(() => {
    let ignore = false;
    getMonitors()
      .then((data) => {
        if (!ignore && mountedRef.current) {
          const list = Array.isArray(data?.monitors) ? data.monitors : [];
          setMonitors(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore && mountedRef.current) {
          const msg = err?.error || err?.message || 'Failed to load monitors';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  /** Fetch paginated results for a specific monitor from backend database */
  const fetchMonitorResults = useCallback(
    async (
      monitorId,
      page = 1,
      limit = DEFAULT_RESULTS_LIMIT,
      status = 'ALL',
      { silent = false } = {}
    ) => {
      if (!monitorId) return;
      if (!silent) setResultsLoading(true);
      setResultsError(null);
      const currentReqId = ++resultsReqIdRef.current;

      try {
        const data = await getRecentMonitorResults(monitorId, { page, limit, status });
        if (!mountedRef.current || resultsReqIdRef.current !== currentReqId) return;

        const resultsList = Array.isArray(data?.results) ? data.results : [];
        setMonitorResults(resultsList);

        if (data?.pagination) {
          setResultsPagination({
            page: data.pagination.page ?? page,
            limit: data.pagination.limit ?? limit,
            total: data.pagination.total ?? resultsList.length,
            totalPages: Math.max(1, data.pagination.totalPages ?? 1),
          });
        }
      } catch (err) {
        if (!mountedRef.current || resultsReqIdRef.current !== currentReqId) return;
        const msg = err?.error || err?.message || 'Failed to fetch monitor results';
        setResultsError(msg);
        if (!silent) toast.error(msg);
      } finally {
        if (mountedRef.current && resultsReqIdRef.current === currentReqId && !silent) {
          setResultsLoading(false);
        }
      }
    },
    [toast]
  );

  /** Fetch detailed config of running monitor from backend */
  const fetchRunningDetails = useCallback(async (monitorId) => {
    if (!monitorId) return;
    try {
      const data = await getRunningMonitorDetails(monitorId);
      if (!mountedRef.current) return;
      if (data?.monitor) {
        setSelectedMonitor(data.monitor);
        if (data.monitor.lastResult) {
          setLatestResult(data.monitor.lastResult);
        }
      }
    } catch (err) {
      console.warn('[useUptime] Running monitor detail query notice:', err?.message || err);
    }
  }, []);

  /** Ensure socket is alive and subscribe to `uptimeCompleted` */
  useEffect(() => {
    if (!isSocketConnected()) {
      connectSocket();
    }

    const unsubscribe = subscribeToEvents({
      [ON.UPTIME_COMPLETED]: (payload) => {
        if (!payload || !mountedRef.current) return;

        const checkResult = payload.result || payload;
        const incomingMonitorId = payload.monitorId || checkResult?.monitorId;

        setLatestResult({
          ...checkResult,
          receivedAt: new Date().toISOString(),
        });

        // If active monitor matches the socket event, sync the running monitor inspection
        if (
          incomingMonitorId &&
          incomingMonitorId === activeMonitorIdRef.current
        ) {
          setSelectedMonitor((prev) =>
            prev
              ? {
                  ...prev,
                  lastResult: checkResult,
                  lastCheckedAt: new Date().toISOString(),
                }
              : prev
          );

          // If inspecting page 1, smoothly refresh results list
          if (resultsPaginationRef.current.page === 1) {
            fetchMonitorResults(
              incomingMonitorId,
              1,
              resultsPaginationRef.current.limit,
              resultsStatusFilterRef.current,
              { silent: true }
            );
          }
        }

        // Match monitor URL in the all monitors list for quick live preview
        if (checkResult?.checkingFor) {
          setMonitors((prev) =>
            prev.map((m) => {
              try {
                const host = new URL(m.url).hostname;
                if (
                  host === checkResult.checkingFor ||
                  m.url.includes(checkResult.checkingFor) ||
                  (incomingMonitorId && (m._id || m.id) === incomingMonitorId)
                ) {
                  return {
                    ...m,
                    lastCheck: checkResult,
                    lastResult: checkResult,
                    lastCheckedAt: new Date().toISOString(),
                  };
                }
              } catch {
                // Ignore parse error
              }
              return m;
            })
          );
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [fetchMonitorResults]);

  /** Create a new monitor */
  const addMonitor = useCallback(
    async (rawUrl, interval = '5m') => {
      const url = normalizeUrl(rawUrl);
      if (!isValidUrl(url)) {
        toast.error('Please enter a valid URL (e.g. example.com or https://example.com)');
        return null;
      }

      setCreating(true);
      try {
        const response = await apiCreateMonitor(url, interval);
        const newMon = response?.monitor || {
          _id: response?.id || Date.now().toString(),
          url,
          interval,
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        if (mountedRef.current) {
          setMonitors((prev) => [newMon, ...prev]);
          const newId = newMon._id || newMon.id;
          setActiveMonitorId(newId);
          setSelectedMonitor(newMon);
          toast.success(response?.message || 'Uptime monitor created successfully!');

          // Fetch fresh results
          fetchMonitorResults(newId, 1, resultsPagination.limit, 'ALL');

          // Subscribe socket room if monitor returned roomId
          if (newId) {
            emitSocketEvent('uptime-job', { monitorId: newId });
          }
        }
        return newMon;
      } catch (err) {
        const msg = err?.error || err?.message || 'Failed to create uptime monitor';
        toast.error(msg);
        return null;
      } finally {
        if (mountedRef.current) setCreating(false);
      }
    },
    [fetchMonitorResults, resultsPagination.limit, toast]
  );

  /** Pause or resume monitor */
  const togglePause = useCallback(
    async (monitor) => {
      const id = monitor._id || monitor.id;
      if (!id) return;
      const isCurrentlyActive = monitor.status === 'active';
      const actionName = isCurrentlyActive ? 'pause' : 'resume';

      setActionInProgress((prev) => ({ ...prev, [id]: actionName }));
      try {
        if (isCurrentlyActive) {
          await apiPauseMonitor(id);
          setMonitors((prev) =>
            prev.map((m) => ((m._id || m.id) === id ? { ...m, status: 'paused' } : m))
          );
          if (activeMonitorIdRef.current === id) {
            setSelectedMonitor((prev) => (prev ? { ...prev, status: 'paused' } : prev));
          }
          toast.info('Monitor paused');
        } else {
          await apiResumeMonitor(id);
          setMonitors((prev) =>
            prev.map((m) => ((m._id || m.id) === id ? { ...m, status: 'active' } : m))
          );
          if (activeMonitorIdRef.current === id) {
            setSelectedMonitor((prev) => (prev ? { ...prev, status: 'active' } : prev));
          }
          toast.success('Monitor resumed');
        }
      } catch (err) {
        toast.error(err?.error || err?.message || `Failed to ${actionName} monitor`);
      } finally {
        if (mountedRef.current) {
          setActionInProgress((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      }
    },
    [toast]
  );

  /** Delete monitor */
  const removeMonitor = useCallback(
    async (id) => {
      if (!id) return;
      setActionInProgress((prev) => ({ ...prev, [id]: 'delete' }));
      try {
        await apiDeleteMonitor(id);
        if (mountedRef.current) {
          setMonitors((prev) => prev.filter((m) => (m._id || m.id) !== id));
          if (activeMonitorId === id) {
            setActiveMonitorId(null);
            setSelectedMonitor(null);
            setMonitorResults([]);
          }
          toast.success('Monitor deleted successfully');
        }
      } catch (err) {
        toast.error(err?.error || err?.message || 'Failed to delete monitor');
      } finally {
        if (mountedRef.current) {
          setActionInProgress((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      }
    },
    [activeMonitorId, toast]
  );

  /** Update monitor settings (interval / url) */
  const editMonitor = useCallback(
    async (id, { url, interval, status }) => {
      if (!id) return false;
      setActionInProgress((prev) => ({ ...prev, [id]: 'update' }));
      try {
        const response = await apiUpdateMonitor(id, { url, interval, status });
        const updated = response?.monitor;
        if (mountedRef.current) {
          setMonitors((prev) =>
            prev.map((m) => ((m._id || m.id) === id ? { ...m, ...updated, url, interval, status } : m))
          );
          if (activeMonitorIdRef.current === id) {
            setSelectedMonitor((prev) => (prev ? { ...prev, ...updated, url, interval, status } : prev));
          }
          toast.success('Monitor updated successfully');
        }
        return true;
      } catch (err) {
        toast.error(err?.error || err?.message || 'Failed to update monitor');
        return false;
      } finally {
        if (mountedRef.current) {
          setActionInProgress((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      }
    },
    [toast]
  );

  /** Select a monitor to inspect its running details and paginated recent results */
  const selectMonitor = useCallback(
    (monitorOrId) => {
      const id =
        typeof monitorOrId === 'string'
          ? monitorOrId
          : monitorOrId?._id || monitorOrId?.id;
      if (!id) return;

      setActiveMonitorId(id);

      // Seed immediate details from known monitors list if available
      const found =
        typeof monitorOrId === 'object' && monitorOrId !== null
          ? monitorOrId
          : monitors.find((m) => (m._id || m.id) === id);

      if (found) {
        setSelectedMonitor(found);
        if (found.lastCheck || found.lastResult) {
          setLatestResult(found.lastCheck || found.lastResult);
        }
      }

      // Fetch running monitor details and first page of results directly from backend
      fetchRunningDetails(id);
      fetchMonitorResults(id, 1, resultsPaginationRef.current.limit, resultsStatusFilterRef.current);
    },
    [monitors, fetchRunningDetails, fetchMonitorResults]
  );

  /** Navigate results pages */
  const changeResultsPage = useCallback(
    (newPage) => {
      if (!activeMonitorId) return;
      fetchMonitorResults(
        activeMonitorId,
        newPage,
        resultsPagination.limit,
        resultsStatusFilter
      );
    },
    [activeMonitorId, fetchMonitorResults, resultsPagination.limit, resultsStatusFilter]
  );

  /** Change filter for monitor results (ALL, UP, DEGRADED, DOWN) */
  const changeResultsStatusFilter = useCallback(
    (newStatus) => {
      setResultsStatusFilter(newStatus);
      if (!activeMonitorId) return;
      fetchMonitorResults(
        activeMonitorId,
        1,
        resultsPagination.limit,
        newStatus
      );
    },
    [activeMonitorId, fetchMonitorResults, resultsPagination.limit]
  );

  /** Refresh current running monitor results manually */
  const refreshSelectedMonitorResults = useCallback(() => {
    if (!activeMonitorId) return;
    fetchRunningDetails(activeMonitorId);
    fetchMonitorResults(
      activeMonitorId,
      resultsPagination.page,
      resultsPagination.limit,
      resultsStatusFilter
    );
  }, [
    activeMonitorId,
    fetchRunningDetails,
    fetchMonitorResults,
    resultsPagination.page,
    resultsPagination.limit,
    resultsStatusFilter,
  ]);

  /** Close / clear active monitor inspection section */
  const clearSelectedMonitor = useCallback(() => {
    setActiveMonitorId(null);
    setSelectedMonitor(null);
    setMonitorResults([]);
    setResultsError(null);
  }, []);

  return useMemo(
    () => ({
      monitors,
      loading,
      creating,
      actionInProgress,
      error,
      latestResult,
      activeMonitorId,
      selectedMonitor,
      monitorResults,
      resultsLoading,
      resultsError,
      resultsPagination,
      resultsStatusFilter,
      fetchMonitors,
      addMonitor,
      togglePause,
      removeMonitor,
      editMonitor,
      selectMonitor,
      setLatestResult,
      changeResultsPage,
      changeResultsStatusFilter,
      refreshSelectedMonitorResults,
      clearSelectedMonitor,
    }),
    [
      monitors,
      loading,
      creating,
      actionInProgress,
      error,
      latestResult,
      activeMonitorId,
      selectedMonitor,
      monitorResults,
      resultsLoading,
      resultsError,
      resultsPagination,
      resultsStatusFilter,
      fetchMonitors,
      addMonitor,
      togglePause,
      removeMonitor,
      editMonitor,
      selectMonitor,
      changeResultsPage,
      changeResultsStatusFilter,
      refreshSelectedMonitorResults,
      clearSelectedMonitor,
    ]
  );
}
