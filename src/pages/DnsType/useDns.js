import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDnsById, getDnsResults, lookupDnsRecords } from '../../api/dnsType';
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
  DNS_PAGE_LIMIT,
  DNS_SCAN_TIMEOUT_MS,
  DNS_SOCKET_TIMEOUT_MS,
  isValidDomain,
  normalizeDnsEntry,
  normalizeDomain,
} from './dns.utils';

export default function useDns() {
  const toast = useToast();

  const [status, setStatus] = useState('idle'); // idle | scanning | done | error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Backend database results and pagination state (no client localStorage)
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: DNS_PAGE_LIMIT,
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

      const incomingJobId = payload?.jobId || payload?.dnsRecordId;
      if (
        pending.jobId &&
        incomingJobId &&
        String(pending.jobId) !== String(incomingJobId) &&
        String(pending.dbId) !== String(incomingJobId)
      ) {
        return;
      }

      const reportData = payload?.result || payload;
      if (reportData?.status === 'failed') {
        settle(new Error(reportData?.error || 'DNS query resolution failed.'));
        return;
      }

      settle(null, payload);
    };

    const handleFailed = (payload) => {
      const pending = pendingRef.current;
      if (!pending) return;

      const incomingJobId = payload?.jobId || payload?.dnsRecordId;
      if (
        pending.jobId &&
        incomingJobId &&
        String(pending.jobId) !== String(incomingJobId) &&
        String(pending.dbId) !== String(incomingJobId)
      ) {
        return;
      }

      const reason =
        payload?.error ||
        payload?.result?.error ||
        payload?.failedReason ||
        'DNS resolution queue job failed.';
      settle(new Error(reason));
    };

    const unsub = subscribeToEvents({
      [ON.DNS_COMPLETED]: handleCompleted,
      dnsRecordCompleted: handleCompleted, // Support alternate emission naming
      [ON.DNS_FAILED]: handleFailed,
      dnsRecordCheckFailed: handleFailed, // Support alternate failure naming
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

      const timer = setTimeout(() => finish(false), DNS_SOCKET_TIMEOUT_MS);
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
        const limit = customParams.limit ?? historyPagination.limit ?? DNS_PAGE_LIMIT;
        const url = customParams.url !== undefined ? customParams.url : historyFilter.url;

        const params = { page, limit, status: 'completed' };
        if (url && url.trim()) {
          params.url = url.trim();
        }

        const res = await getDnsResults(params);
        if (!mountedRef.current || seq !== fetchReqSeqRef.current) return;

        if (res?.success && Array.isArray(res?.data)) {
          const normalizedList = res.data.map((item) => normalizeDnsEntry(item)).filter(Boolean);
          setHistory(normalizedList);

          if (res.pagination) {
            setHistoryPagination(res.pagination);
          }
        }
      } catch (err) {
        if (!mountedRef.current || seq !== fetchReqSeqRef.current) return;
        console.error('[DNS] Failed to fetch lookup history from backend:', err);
      } finally {
        if (mountedRef.current && seq === fetchReqSeqRef.current) {
          setHistoryLoading(false);
        }
      }
    },
    [historyFilter.url, historyPagination.limit, historyPagination.page],
  );

  /** Initial load of history on mount — automatically loads the latest DNS result */
  useEffect(() => {
    let ignore = false;
    getDnsResults({ page: 1, limit: DNS_PAGE_LIMIT, status: 'completed' })
      .then((res) => {
        if (ignore || !mountedRef.current) return;
        if (res?.success && Array.isArray(res?.data)) {
          const normalizedList = res.data.map((item) => normalizeDnsEntry(item)).filter(Boolean);
          setHistory(normalizedList);

          if (res.pagination) {
            setHistoryPagination(res.pagination);
          }

          // Display the latest DNS result immediately on UI
          if (normalizedList.length > 0) {
            setResult(normalizedList[0]);
          }
        }
      })
      .catch((err) => {
        if (!ignore) console.error('[DNS] Initial fetch error:', err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  /** Trigger a new DNS record lookup */
  const scan = useCallback(
    async (rawInput) => {
      if (pendingRef.current) {
        toast.info('A DNS lookup is already running.');
        return;
      }

      const domain = normalizeDomain(rawInput);
      if (!isValidDomain(domain)) {
        toast.error('Enter a valid domain name (e.g. example.com or cloudflare.com)');
        return;
      }

      setStatus('scanning');
      setError(null);

      try {
        const res = await lookupDnsRecords(domain);
        const jobId = res?.jobId;
        const dnsRecordId = res?.dnsRecordId || res?.data?._id;
        const roomId = res?.roomId;

        const socketOk = await waitForSocket();
        if (socketOk && roomId) {
          emitSocketEvent(EMIT.DNS_JOB, { roomId, jobId, domain });
        }

        const rawReport = await new Promise((resolve, reject) => {
          pendingRef.current = {
            jobId,
            dbId: dnsRecordId,
            resolve,
            reject,
            timer: setTimeout(async () => {
              // Graceful fallback: check if DB document finished before giving up
              if (dnsRecordId) {
                try {
                  const check = await getDnsById(dnsRecordId);
                  if (check?.success && check?.data?.status === 'completed' && check?.data?.result) {
                    settle(null, check.data);
                    return;
                  }
                } catch {
                  // Fall through to error
                }
              }
              settle(new Error('DNS query timed out waiting for resolver worker.'));
            }, DNS_SCAN_TIMEOUT_MS),
          };
        });

        if (!mountedRef.current) return;

        const entry = normalizeDnsEntry({
          _id: dnsRecordId,
          url: domain,
          status: 'completed',
          result: rawReport?.result || rawReport,
          createdAt: new Date().toISOString(),
        });

        setResult(entry);
        setStatus('done');
        toast.success(`DNS lookup complete for ${domain}`);

        // Refresh database history & pagination
        fetchHistory({ page: 1 });
      } catch (err) {
        settle(err);
        if (!mountedRef.current) return;
        const msg =
          err?.response?.data?.error || err?.message || 'DNS record lookup failed.';
        setError(msg);
        setStatus('error');
        toast.error(msg);
      }
    },
    [fetchHistory, settle, toast, waitForSocket],
  );

  /** Select an entry from history */
  const selectEntry = useCallback(
    async (entry) => {
      if (!entry) return;
      setResult(entry);
      setError(null);
      setStatus('done');

      // Fetch fresh details if record data is shallow
      if (entry.dbId && (!entry.records || Object.keys(entry.records).length === 0)) {
        try {
          const detailRes = await getDnsById(entry.dbId);
          if (mountedRef.current && detailRes?.success && detailRes?.data) {
            const fresh = normalizeDnsEntry(detailRes.data);
            if (fresh) setResult(fresh);
          }
        } catch (detailErr) {
          console.error('[DNS] Failed to fetch full details by ID:', detailErr);
        }
      }
    },
    [],
  );

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
      isScanning: status === 'scanning',
      scan,
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
      scan,
      selectEntry,
      fetchHistory,
      handlePageChange,
      handleFilterChange,
      handleRefresh,
    ],
  );
}
