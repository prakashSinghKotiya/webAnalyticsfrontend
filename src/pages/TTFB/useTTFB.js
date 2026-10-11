import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_REGIONS,
  TTFB_REGIONS,
  findTTFB,
  findTTFBAllRegions,
  getTtfbById,
  getTtfbResults,
  getTtfbStatus,
} from '../../api/ttfb';
import {
  ON,
  emitCatchup,
  registerCatchupJob,
  subscribeToEvents,
  unregisterCatchupJob,
  waitForSocket,
} from '../../api/socket';
import { useToast } from '../../context';
import {
  TTFB_SCAN_TIMEOUT_MS,
  createId,
  extractReadings,
  isAggregatePayload,
  isValidUrl,
  normalizeUrl,
  summarize,
  groupDbRecords,
  normalizeDbEntry,
} from './ttfb.utils';

export default function useTTFB() {
  const toast = useToast();

  const [status, setStatus] = useState('idle'); // idle | scanning | done | error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState({ received: 0, expected: 0 });

  // Database-backed results and pagination
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [historyFilter, setHistoryFilter] = useState({ url: '', region: '' });

  const pendingRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const pending = pendingRef.current;
      if (pending) {
        clearTimeout(pending.timer);
        if (pending.watchdogTimer) clearTimeout(pending.watchdogTimer);
        if (pending.pollingInterval) clearInterval(pending.pollingInterval);
        if (Array.isArray(pending.jobIds)) {
          pending.jobIds.forEach((id) => unregisterCatchupJob(id));
        }
        pendingRef.current = null;
      }
    };
  }, []);

  /** Resolve or reject the in-flight scan exactly once, tearing it down. */
  const settle = useCallback((err, readings) => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    clearTimeout(pending.timer);
    if (pending.watchdogTimer) clearTimeout(pending.watchdogTimer);
    if (pending.pollingInterval) clearInterval(pending.pollingInterval);
    if (Array.isArray(pending.jobIds)) {
      pending.jobIds.forEach((id) => unregisterCatchupJob(id));
    }
    if (err) pending.reject(err);
    else pending.resolve(readings);
  }, []);

  // Live probe results — subscribed once for the page's lifetime (both standard & legacy events).
  useEffect(() => {
    const handleResult = (payload) => {
      const pending = pendingRef.current;
      if (!pending) return;

      const reportData = payload?.result || payload;
      if (payload?.status === 'failed' || reportData?.status === 'failed') {
        settle(new Error(payload?.error || reportData?.error || 'TTFB measurement failed on target server.'));
        return;
      }

      const incoming = extractReadings(payload);
      if (!incoming.length) return;

      // Merge by region: a worker can first emit the headline latency and
      // later emit the same region with detailed timing metrics.
      for (const reading of incoming) {
        const key = reading.region.toLowerCase();
        const existingIndex = pending.readings.findIndex(
          (r) => r.region.toLowerCase() === key,
        );
        if (existingIndex < 0) {
          pending.readings.push(reading);
        } else {
          pending.readings[existingIndex] = {
            ...pending.readings[existingIndex],
            ...reading,
          };
        }
      }

      setProgress({ received: pending.readings.length, expected: pending.expected });
      // Publish a fresh snapshot so React renders each incoming probe.
      setResult({
        id: 'live',
        url: pending.url,
        region: pending.region,
        readings: [...pending.readings],
        ...summarize(pending.readings),
        createdAt: new Date().toISOString(),
      });

      const complete =
        pending.readings.length >= pending.expected || isAggregatePayload(payload);
      if (complete) settle(null, pending.readings);
    };

    return subscribeToEvents({
      [ON.TTFB_RESULT]: handleResult,
      [ON.TTFB_COMPLETED]: handleResult,
    });
  }, [settle]);

  /** Fetch past measurement results directly from backend MongoDB API. */
  const fetchHistory = useCallback(
    async (customParams = {}) => {
      try {
        setHistoryLoading(true);
        const page = customParams.page ?? 1;
        const limit = customParams.limit ?? 20;
        const url = customParams.url !== undefined ? customParams.url : historyFilter.url;
        const region = customParams.region !== undefined ? customParams.region : historyFilter.region;

        const params = { page, limit, status: 'completed' };
        if (url && url.trim()) params.url = url.trim();
        if (region && region !== ALL_REGIONS && region !== 'all') {
          params.region = region.toLowerCase();
        }

        const response = await getTtfbResults(params);
        if (!mountedRef.current) return;

        if (response?.success && Array.isArray(response?.data)) {
          const grouped = groupDbRecords(response.data);
          setHistory(grouped);
          if (response.pagination) {
            setHistoryPagination(response.pagination);
          }
        }
      } catch (err) {
        if (!mountedRef.current) return;
        console.error('Failed to load TTFB results from server:', err);
      } finally {
        if (mountedRef.current) {
          setHistoryLoading(false);
        }
      }
    },
    [historyFilter.region, historyFilter.url],
  );

  // Initial load of history on mount
  useEffect(() => {
    let ignore = false;
    getTtfbResults({ page: 1, limit: 20, status: 'completed' })
      .then((response) => {
        if (ignore) return;
        if (response?.success && Array.isArray(response?.data)) {
          setHistory(groupDbRecords(response.data));
          if (response.pagination) {
            setHistoryPagination(response.pagination);
          }
        }
      })
      .catch((err) => {
        if (!ignore) console.error('Failed to load initial TTFB records:', err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  /** Start a measurement. `region` is a queue key or `ALL_REGIONS`. */
  const scan = useCallback(
    async (rawUrl, region = ALL_REGIONS) => {
      if (pendingRef.current) {
        toast.info('A scan is already running — hang tight.');
        return;
      }

      const url = normalizeUrl(rawUrl);
      if (!isValidUrl(url)) {
        toast.error('Enter a valid URL — for example example.com or https://example.com');
        return;
      }

      const isAll = region === ALL_REGIONS;
      const initialExpected = isAll ? TTFB_REGIONS.length : 1;

      setStatus('scanning');
      setError(null);
      setResult(null);
      setProgress({ received: 0, expected: initialExpected });

      try {
        if (!(await waitForSocket())) {
          throw new Error('Live results channel unavailable. Check your connection and retry.');
        }

        let resolveScan, rejectScan;
        const scanPromise = new Promise((resolve, reject) => {
          resolveScan = resolve;
          rejectScan = reject;
        });

        pendingRef.current = {
          url,
          region: isAll ? ALL_REGIONS : region,
          expected: initialExpected,
          readings: [],
          jobIds: [],
          resolve: resolveScan,
          reject: rejectScan,
          timer: setTimeout(
            () => settle(new Error('Timed out waiting for probe results. Please try again.')),
            TTFB_SCAN_TIMEOUT_MS,
          ),
        };

        const job = isAll ? await findTTFBAllRegions(url) : await findTTFB(url, region);

        const jobId = job?.jobId;
        const jobIds = isAll
          ? (Array.isArray(job?.jobs) ? job.jobs.map((j) => j.jobId) : (Array.isArray(jobId) ? jobId : [jobId])).filter(Boolean)
          : (jobId ? [jobId] : []);

        const expected = isAll
          ? Math.max(1, jobIds.length || TTFB_REGIONS.length)
          : 1;

        if (pendingRef.current) {
          pendingRef.current.expected = expected;
          pendingRef.current.jobIds = jobIds;
        }

        // Register in-flight job IDs for automatic socket catchup recovery
        for (const jId of jobIds) {
          registerCatchupJob('ttfb', jId);
        }

        // Failsafe Watchdog: at 8s, proactively emit socket catchup
        const watchdogTimer = setTimeout(() => {
          if (pendingRef.current && jobIds.length > 0) {
            emitCatchup(jobIds.map((id) => ({ service: 'ttfb', id })));
          }

          // Fallback HTTP status polling at 12s if socket event hasn't arrived
          const pollingInterval = setInterval(async () => {
            if (!pendingRef.current || !jobIds.length) return;
            try {
              for (const jId of jobIds) {
                const check = await getTtfbStatus(jId);
                if (check?.success && (check.status === 'completed' || check.status === 'failed')) {
                  if (check.status === 'failed') {
                    settle(new Error(check.error || 'TTFB measurement failed.'));
                    return;
                  }
                  if (check.result) {
                    const reading = {
                      region: check.region || check.result.region || 'probe',
                      ms: check.result.ttfbMs || check.result.ms || 0,
                      raw: check.result,
                    };
                    if (!pendingRef.current.readings.some((r) => r.region === reading.region)) {
                      pendingRef.current.readings.push(reading);
                    }
                    setProgress({
                      received: pendingRef.current.readings.length,
                      expected: pendingRef.current.expected,
                    });
                    if (pendingRef.current.readings.length >= pendingRef.current.expected) {
                      settle(null, pendingRef.current.readings);
                      return;
                    }
                  }
                }
              }
            } catch {
              // Ignore transient polling error
            }
          }, 3000);

          if (pendingRef.current) {
            pendingRef.current.pollingInterval = pollingInterval;
          }
        }, 8000);

        if (pendingRef.current) {
          pendingRef.current.watchdogTimer = watchdogTimer;
        }

        const readings = await scanPromise;

        if (!mountedRef.current) return;

        const entry = {
          id: createId(),
          url,
          region: isAll ? ALL_REGIONS : region,
          readings,
          ...summarize(readings),
          createdAt: new Date().toISOString(),
        };

        setResult(entry);
        setStatus('done');
        toast.success(
          `TTFB measured — ${readings.length} region${readings.length === 1 ? '' : 's'}`,
        );

        // Synchronize MongoDB records after scan finishes
        fetchHistory({ page: 1 });
      } catch (err) {
        settle(err);
        if (!mountedRef.current) return;
        const message = err?.error || err?.message || 'TTFB scan failed. Please try again.';
        setError(message);
        setStatus('error');
        toast.error(message);
      }
    },
    [fetchHistory, settle, toast],
  );

  /** Select a previous scan to inspect details in ResultPanel. */
  const selectEntry = useCallback(async (entry) => {
    if (!entry) return;
    setResult(entry);
    setError(null);
    setStatus('done');

    if (entry.dbId) {
      try {
        const res = await getTtfbById(entry.dbId);
        if (mountedRef.current && res?.success && res?.data) {
          const fresh = normalizeDbEntry(res.data);
          if (fresh) {
            setResult((prev) => ({
              ...prev,
              ...fresh,
              readings: prev?.readings?.length > 1 ? prev.readings : fresh.readings,
            }));
          }
        }
      } catch {
        // Retain existing entry
      }
    }
  }, []);

  const handlePageChange = useCallback(
    (page) => {
      fetchHistory({ page });
    },
    [fetchHistory],
  );

  const handleFilterChange = useCallback(
    (newFilter) => {
      setHistoryFilter((prev) => {
        const next = { ...prev, ...newFilter };
        fetchHistory({ page: 1, ...next });
        return next;
      });
    },
    [fetchHistory],
  );

  return useMemo(
    () => ({
      status,
      error,
      result,
      progress,
      history,
      historyLoading,
      historyPagination,
      historyFilter,
      isScanning: status === 'scanning',
      scan,
      selectEntry,
      fetchHistory,
      handlePageChange,
      handleFilterChange,
    }),
    [
      status,
      error,
      result,
      progress,
      history,
      historyLoading,
      historyPagination,
      historyFilter,
      scan,
      selectEntry,
      fetchHistory,
      handlePageChange,
      handleFilterChange,
    ],
  );
}
