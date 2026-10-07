import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { checkRedirects, getRedirectResults } from '../../api/redirectCheck';
import {
  EMIT,
  ON,
  connectSocket,
  emitSocketEvent,
  isSocketConnected,
  subscribeToConnectionState,
  subscribeToEvents,
} from '../../api/socket';
import { useToast } from '../../context';
import {
  REDIRECTS_PAGE_LIMIT,
  REDIRECTS_SCAN_TIMEOUT_MS,
  REDIRECTS_SOCKET_TIMEOUT_MS,
  isValidHttpUrl,
  normalizeRedirectEntry,
  normalizeRedirectUrl,
} from './redirects.utils';

export default function useRedirects() {
  const toast = useToast();

  const [status, setStatus] = useState('idle'); // idle | checking | done | error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Backend database results and pagination state (no client localStorage)
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: REDIRECTS_PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [historyFilter, setHistoryFilter] = useState({ url: '' });

  const pendingRef = useRef(null);
  const mountedRef = useRef(true);
  const fetchReqSeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pendingRef.current?.timer) {
        clearTimeout(pendingRef.current.timer);
      }
      pendingRef.current = null;
    };
  }, []);

  const settle = useCallback((err, data) => {
    const pending = pendingRef.current;
    if (!pending) return;

    if (pending.timer) clearTimeout(pending.timer);
    pendingRef.current = null;

    if (err) {
      pending.reject(err);
    } else {
      pending.resolve(data);
    }
  }, []);

  /** Real-time socket event subscription */
  useEffect(() => {
    const handleCompleted = (payload) => {
      const pending = pendingRef.current;
      if (!pending) return;

      const incomingJobId = payload?.jobId || payload?.redirectCheckId || payload?.recordId;
      if (
        pending.jobId &&
        incomingJobId &&
        String(pending.jobId) !== String(incomingJobId) &&
        String(pending.dbId) !== String(incomingJobId)
      ) {
        return;
      }

      const reportData = payload?.result || payload;
      if (
        reportData?.status === 'failed' ||
        (reportData?.success === false && !reportData?.chain?.length)
      ) {
        const errMsg =
          payload?.error ||
          reportData?.error ||
          reportData?.message ||
          'Redirect trace execution failed.';
        settle(new Error(errMsg));
        return;
      }

      settle(null, payload);
    };

    const handleFailed = (payload) => {
      const pending = pendingRef.current;
      if (!pending) return;

      const incomingJobId = payload?.jobId || payload?.redirectCheckId || payload?.recordId;
      if (
        pending.jobId &&
        incomingJobId &&
        String(pending.jobId) !== String(incomingJobId) &&
        String(pending.dbId) !== String(incomingJobId)
      ) {
        return;
      }

      const reason = payload?.error || 'Redirect tracer queue job failed.';
      settle(new Error(reason));
    };

    const unsub = subscribeToEvents({
      [ON.REDIRECT_COMPLETED]: handleCompleted,
      redirectCheckCompleted: handleCompleted, // Support alternate emission naming
      [ON.REDIRECT_FAILED]: handleFailed,
      redirectCheckFailed: handleFailed, // Support alternate failure naming
    });

    return () => unsub();
  }, [settle]);

  const waitForSocket = useCallback(async () => {
    if (isSocketConnected()) return true;
    connectSocket();

    return new Promise((resolve) => {
      let settled = false;
      const finish = (val) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        unsub();
        resolve(val);
      };

      const timer = setTimeout(() => finish(false), REDIRECTS_SOCKET_TIMEOUT_MS);
      const unsub = subscribeToConnectionState((state) => {
        if (state.status === 'connected') finish(true);
        else if (state.status === 'unauthorized' || state.status === 'disconnected') finish(false);
      });

      if (isSocketConnected()) finish(true);
    });
  }, []);

  /**
   * Fetch paginated results from MongoDB backend API.
   * Scalable with request sequencing to eliminate race conditions.
   */
  const fetchHistory = useCallback(
    async (customParams = {}) => {
      const seq = ++fetchReqSeqRef.current;

      try {
        setHistoryLoading(true);
        const page = customParams.page ?? historyPagination.page ?? 1;
        const limit = customParams.limit ?? historyPagination.limit ?? REDIRECTS_PAGE_LIMIT;
        const url = customParams.url !== undefined ? customParams.url : historyFilter.url;

        const params = { page, limit, status: 'completed' };
        if (url && url.trim()) {
          params.url = url.trim();
        }

        const res = await getRedirectResults(params);
        if (!mountedRef.current || seq !== fetchReqSeqRef.current) return;

        if (res?.success && Array.isArray(res?.data)) {
          const normalizedList = res.data.map((item) => normalizeRedirectEntry(item)).filter(Boolean);
          setHistory(normalizedList);

          if (res.pagination) {
            setHistoryPagination(res.pagination);
          }
        }
      } catch (err) {
        if (!mountedRef.current || seq !== fetchReqSeqRef.current) return;
        console.error('[Redirects] Failed to fetch lookup history from backend:', err);
      } finally {
        if (mountedRef.current && seq === fetchReqSeqRef.current) {
          setHistoryLoading(false);
        }
      }
    },
    [historyFilter.url, historyPagination.limit, historyPagination.page],
  );

  /** Initial load of history on mount — automatically loads the latest redirect check */
  useEffect(() => {
    let ignore = false;
    getRedirectResults({ page: 1, limit: REDIRECTS_PAGE_LIMIT, status: 'completed' })
      .then((res) => {
        if (ignore || !mountedRef.current) return;
        if (res?.success && Array.isArray(res?.data)) {
          const normalizedList = res.data.map((item) => normalizeRedirectEntry(item)).filter(Boolean);
          setHistory(normalizedList);

          if (res.pagination) {
            setHistoryPagination(res.pagination);
          }

          // Display the latest redirect inspection immediately on UI
          if (normalizedList.length > 0) {
            setResult(normalizedList[0]);
          }
        }
      })
      .catch((err) => {
        if (!ignore) console.error('[Redirects] Initial fetch error:', err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  /** Trigger a new redirect chain trace */
  const trace = useCallback(
    async (rawInput) => {
      if (pendingRef.current) {
        toast.info('A redirect check is already in progress.');
        return;
      }

      const normalized = normalizeRedirectUrl(rawInput);
      if (!isValidHttpUrl(normalized)) {
        toast.error('Enter a valid URL (e.g. https://example.com or http://github.com)');
        return;
      }

      setStatus('checking');
      setError(null);

      try {
        const res = await checkRedirects(normalized);
        const jobId = res?.jobId;
        const redirectCheckId = res?.redirectCheckId || res?.data?._id;
        const roomId = res?.roomId;

        const socketOk = await waitForSocket();
        if (socketOk && roomId) {
          emitSocketEvent(EMIT.REDIRECT_JOB, { roomId, jobId, url: normalized });
        }

        const rawReport = await new Promise((resolve, reject) => {
          pendingRef.current = {
            jobId,
            dbId: redirectCheckId,
            resolve,
            reject,
            timer: setTimeout(() => {
              settle(new Error('Redirect tracer timed out waiting for backend worker.'));
            }, REDIRECTS_SCAN_TIMEOUT_MS),
          };
        });

        if (!mountedRef.current) return;

        const entry = normalizeRedirectEntry({
          _id: redirectCheckId,
          url: normalized,
          status: 'completed',
          result: rawReport?.result || rawReport,
          createdAt: new Date().toISOString(),
        });

        setResult(entry);
        setStatus('done');
        toast.success(
          `Redirect chain traced (${entry.redirectCount} redirect${entry.redirectCount === 1 ? '' : 's'})`,
        );

        // Refresh database history & pagination
        fetchHistory({ page: 1 });
      } catch (err) {
        settle(err);
        if (!mountedRef.current) return;
        const msg = err?.response?.data?.error || err?.message || 'Redirect trace failed.';
        setError(msg);
        setStatus('error');
        toast.error(msg);
      }
    },
    [fetchHistory, settle, toast, waitForSocket],
  );

  /** Select an entry from history */
  const selectEntry = useCallback((entry) => {
    if (!entry) return;
    setResult(entry);
    setError(null);
    setStatus('done');
  }, []);

  /** Handle pagination page change */
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage === historyPagination.page || historyLoading) return;
      fetchHistory({ page: newPage });
    },
    [fetchHistory, historyLoading, historyPagination.page],
  );

  /** Handle search / filter change */
  const handleFilterChange = useCallback(
    (patch) => {
      setHistoryFilter((prev) => {
        const next = { ...prev, ...patch };
        fetchHistory({ page: 1, url: next.url });
        return next;
      });
    },
    [fetchHistory],
  );

  /** Refresh history */
  const handleRefresh = useCallback(() => {
    fetchHistory({ page: historyPagination.page });
  }, [fetchHistory, historyPagination.page]);

  return useMemo(
    () => ({
      status,
      error,
      result,
      history,
      historyLoading,
      historyPagination,
      historyFilter,
      isChecking: status === 'checking',
      trace,
      selectEntry,
      fetchHistory,
      handlePageChange,
      handleFilterChange,
      handleRefresh,
    }),
    [
      status,
      error,
      result,
      history,
      historyLoading,
      historyPagination,
      historyFilter,
      trace,
      selectEntry,
      fetchHistory,
      handlePageChange,
      handleFilterChange,
      handleRefresh,
    ],
  );
}
