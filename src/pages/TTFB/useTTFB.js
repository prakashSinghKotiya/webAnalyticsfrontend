import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_REGIONS, TTFB_REGIONS, findTTFB, findTTFBAllRegions, getTtfbResults, getTtfbById } from '../../api/ttfb';
import {
  EMIT,
  ON,
  emitSocketEvent,
  subscribeToEvents,
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
    if (err) pending.reject(err);
    else pending.resolve(readings);
  }, []);

  // Live probe results — subscribed once for the page's lifetime.
  useEffect(
    () =>
      subscribeToEvents({
        [ON.TTFB_COMPLETED]: (payload) => {
          const pending = pendingRef.current;
          if (!pending) return;

          const reportData = payload?.result || payload;
          if (reportData?.status === 'failed') {
            settle(new Error(reportData?.error || 'TTFB measurement failed on target server.'));
            return;
          }

          const incoming = extractReadings(payload);
          if (!incoming.length) return;

          // De-duplicate by region: `findAll` fans out to one queue per region.
          for (const reading of incoming) {
            const key = reading.region.toLowerCase();
            if (!pending.readings.some((r) => r.region.toLowerCase() === key)) {
              pending.readings.push(reading);
            }
          }

          setProgress({ received: pending.readings.length, expected: pending.expected });

          const complete =
            pending.readings.length >= pending.expected || isAggregatePayload(payload);
          if (complete) settle(null, pending.readings);
        },
      }),
    [settle],
  );



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
          expected: initialExpected,
          readings: [],
          resolve: resolveScan,
          reject: rejectScan,
          timer: setTimeout(
            () => settle(new Error('Timed out waiting for probe results. Please try again.')),
            TTFB_SCAN_TIMEOUT_MS,
          ),
        };

        const job = isAll ? await findTTFBAllRegions(url) : await findTTFB(url, region);

        const roomId = job?.roomId;
        const jobId = job?.jobId;
        const expected = isAll
          ? Math.max(1, Array.isArray(jobId) ? jobId.length : TTFB_REGIONS.length)
          : 1;

        if (pendingRef.current) {
          pendingRef.current.expected = expected;
        }

        const payload = isAll
          ? { jobIds: Array.isArray(jobId) ? jobId : [], jobId, roomId, url, region: ALL_REGIONS }
          : { jobId, roomId, url, region };

        emitSocketEvent(isAll ? EMIT.TTFB_JOB_ALL : EMIT.TTFB_JOB, payload);

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
