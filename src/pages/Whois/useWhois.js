import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getWhoisById,
  getWhoisResults,
  getWhoisStatus,
  whoisLookup,
} from '../../api/whoisLookup';
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
  WHOIS_PAGE_LIMIT,
  WHOIS_SCAN_TIMEOUT_MS,
  isValidDomain,
  normalizeDomain,
  normalizeWhoisEntry,
} from './whois.utils';

export default function useWhois() {
  const toast = useToast();

  const [status, setStatus] = useState('idle'); // idle | looking_up | done | error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Backend database results and pagination state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: WHOIS_PAGE_LIMIT,
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
      if (pendingRef.current?.watchdogTimer) {
        clearTimeout(pendingRef.current.watchdogTimer);
      }
      if (pendingRef.current?.pollingInterval) {
        clearInterval(pendingRef.current.pollingInterval);
      }
      if (pendingRef.current?.dbId) {
        unregisterCatchupJob(pendingRef.current.dbId);
      }
      pendingRef.current = null;
    };
  }, []);

  const settle = useCallback((err, data) => {
    const pending = pendingRef.current;
    if (!pending) return;

    if (pending.timer) clearTimeout(pending.timer);
    if (pending.watchdogTimer) clearTimeout(pending.watchdogTimer);
    if (pending.pollingInterval) clearInterval(pending.pollingInterval);
    if (pending.dbId) unregisterCatchupJob(pending.dbId);
    if (pending.jobId) unregisterCatchupJob(pending.jobId);

    pendingRef.current = null;

    if (err) {
      pending.reject(err);
    } else {
      pending.resolve(data);
    }
  }, []);

  /** Real-time socket event subscription (standardized & legacy events) */
  useEffect(() => {
    const handleCompleted = (payload) => {
      const pending = pendingRef.current;
      if (!pending) return;

      const incomingJobId = payload?.jobId || payload?.whoisDbId || payload?.recordId;
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
        payload?.status === 'failed' ||
        reportData?.status === 'failed' ||
        (reportData?.success === false && !reportData?.domain)
      ) {
        const errMsg =
          payload?.error ||
          reportData?.error?.message ||
          reportData?.error ||
          'RDAP WHOIS query failed.';
        settle(new Error(errMsg));
        return;
      }

      settle(null, payload);
    };

    const handleFailed = (payload) => {
      const pending = pendingRef.current;
      if (!pending) return;

      const incomingJobId = payload?.jobId || payload?.whoisDbId || payload?.recordId;
      if (
        pending.jobId &&
        incomingJobId &&
        String(pending.jobId) !== String(incomingJobId) &&
        String(pending.dbId) !== String(incomingJobId)
      ) {
        return;
      }

      const reason = payload?.error || 'RDAP lookup queue job failed.';
      settle(new Error(reason));
    };

    const unsub = subscribeToEvents({
      [ON.WHOIS_RESULT]: handleCompleted,
      [ON.WHOIS_COMPLETED]: handleCompleted,
      [ON.WHOIS_COMPLETED_ALT]: handleCompleted,
      whoisLookupCompleted: handleCompleted,
      [ON.WHOIS_FAILED]: handleFailed,
      [ON.WHOIS_FAILED_ALT]: handleFailed,
      whoisLookupFailed: handleFailed,
    });

    return () => unsub();
  }, [settle]);

  /** Fetch paginated results from MongoDB backend API. */
  const fetchHistory = useCallback(
    async (customParams = {}) => {
      const seq = ++fetchReqSeqRef.current;

      try {
        setHistoryLoading(true);
        const page = customParams.page ?? historyPagination.page ?? 1;
        const limit = customParams.limit ?? historyPagination.limit ?? WHOIS_PAGE_LIMIT;
        const url = customParams.url !== undefined ? customParams.url : historyFilter.url;

        const params = { page, limit, status: 'completed' };
        if (url && url.trim()) {
          params.url = url.trim();
        }

        const res = await getWhoisResults(params);
        if (!mountedRef.current || seq !== fetchReqSeqRef.current) return;

        if (res?.success && Array.isArray(res?.data)) {
          const normalizedList = res.data.map((item) => normalizeWhoisEntry(item)).filter(Boolean);
          setHistory(normalizedList);

          if (res.pagination) {
            setHistoryPagination(res.pagination);
          }
        }
      } catch (err) {
        if (!mountedRef.current || seq !== fetchReqSeqRef.current) return;
        console.error('[Whois] Failed to fetch lookup history from backend:', err);
      } finally {
        if (mountedRef.current && seq === fetchReqSeqRef.current) {
          setHistoryLoading(false);
        }
      }
    },
    [historyFilter.url, historyPagination.limit, historyPagination.page],
  );

  /** Initial load of history on mount */
  useEffect(() => {
    let ignore = false;
    getWhoisResults({ page: 1, limit: WHOIS_PAGE_LIMIT, status: 'completed' })
      .then((res) => {
        if (ignore || !mountedRef.current) return;
        if (res?.success && Array.isArray(res?.data)) {
          const normalizedList = res.data.map((item) => normalizeWhoisEntry(item)).filter(Boolean);
          setHistory(normalizedList);

          if (res.pagination) {
            setHistoryPagination(res.pagination);
          }

          if (normalizedList.length > 0) {
            setResult(normalizedList[0]);
          }
        }
      })
      .catch((err) => {
        if (!ignore) console.error('[Whois] Initial fetch error:', err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  /** Trigger a new WHOIS lookup */
  const lookup = useCallback(
    async (rawInput) => {
      if (pendingRef.current) {
        toast.info('A WHOIS lookup is already in progress.');
        return;
      }

      const domain = normalizeDomain(rawInput);
      if (!isValidDomain(domain)) {
        toast.error('Enter a valid domain name (e.g. example.com or github.com)');
        return;
      }

      setStatus('looking_up');
      setError(null);

      try {
        await waitForSocket();

        const res = await whoisLookup(domain);
        const jobId = res?.jobId;
        const whoisDbId = res?.whoisDbId || res?.data?._id;
        const targetId = String(whoisDbId || jobId);

        // Register job ID for automatic socket catchup recovery on reconnect
        if (targetId) {
          registerCatchupJob('whois', targetId);
        }

        const rawReport = await new Promise((resolve, reject) => {
          pendingRef.current = {
            jobId,
            dbId: whoisDbId,
            resolve,
            reject,
            timer: setTimeout(async () => {
              if (targetId) {
                try {
                  const check = await getWhoisStatus(targetId);
                  if (check?.success && check?.status === 'completed' && check?.result) {
                    settle(null, check);
                    return;
                  }
                } catch {
                  // Fall through
                }
              }
              settle(new Error('RDAP WHOIS lookup timed out waiting for backend worker.'));
            }, WHOIS_SCAN_TIMEOUT_MS),
          };

          // Watchdog 1: At 8s emit catchup
          const watchdogTimer = setTimeout(() => {
            if (pendingRef.current && targetId) {
              emitCatchup({ service: 'whois', id: targetId });
            }

            // Watchdog 2: At 12s poll status
            const pollingInterval = setInterval(async () => {
              if (!pendingRef.current || !targetId) return;
              try {
                const check = await getWhoisStatus(targetId);
                if (check?.success && (check.status === 'completed' || check.status === 'failed')) {
                  if (check.status === 'failed') {
                    settle(new Error(check.error || 'WHOIS lookup failed.'));
                    return;
                  }
                  settle(null, check);
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
        });

        if (!mountedRef.current) return;

        const entry = normalizeWhoisEntry({
          _id: whoisDbId,
          url: domain,
          status: 'completed',
          result: rawReport?.result || rawReport,
          createdAt: new Date().toISOString(),
        });

        setResult(entry);
        setStatus('done');
        toast.success(`WHOIS records retrieved for ${domain}`);

        // Refresh database history & pagination
        fetchHistory({ page: 1 });
      } catch (err) {
        settle(err);
        if (!mountedRef.current) return;
        const msg =
          err?.response?.data?.error || err?.message || 'WHOIS lookup failed.';
        setError(msg);
        setStatus('error');
        toast.error(msg);
      }
    },
    [fetchHistory, settle, toast],
  );

  /** Select an entry from history */
  const selectEntry = useCallback(async (entry) => {
    if (!entry) return;
    setResult(entry);
    setError(null);
    setStatus('done');

    if (entry.dbId && (!entry.domain || !entry.registrar)) {
      try {
        const detailRes = await getWhoisById(entry.dbId);
        if (mountedRef.current && detailRes?.success && detailRes?.data) {
          const fresh = normalizeWhoisEntry(detailRes.data);
          if (fresh) setResult(fresh);
        }
      } catch (detailErr) {
        console.error('[Whois] Failed to fetch full details by ID:', detailErr);
      }
    }
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
      isLookingUp: status === 'looking_up',
      lookup,
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
      lookup,
      selectEntry,
      fetchHistory,
      handlePageChange,
      handleFilterChange,
      handleRefresh,
    ],
  );
}
