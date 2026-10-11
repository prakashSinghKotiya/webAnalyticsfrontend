import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  generateLighthouseReport,
  getLighthouseById,
  getLighthouseResults,
  getLighthouseStatus,
} from '../../api/lighthouse';
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
  LIGHTHOUSE_PAGE_LIMIT,
  LIGHTHOUSE_SCAN_TIMEOUT_MS,
  isValidUrl,
  normalizeLighthouseEntry,
  normalizeUrl,
} from './lighthouse.utils';

export default function useLighthouse() {
  const toast = useToast();

  const [status, setStatus] = useState('idle'); // idle | auditing | done | error
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [strategy, setStrategy] = useState('mobile'); // mobile | desktop
  const [auditStep, setAuditStep] = useState('');

  // Backend database results and pagination state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: LIGHTHOUSE_PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [historyFilter, setHistoryFilter] = useState({ url: '' });

  const pendingRef = useRef(null);
  const mountedRef = useRef(true);
  const stepIntervalRef = useRef(null);
  const fetchReqSeqRef = useRef(0);

  // Track component mount status and cleanup on unmount
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
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
      pendingRef.current = null;
    };
  }, []);

  const clearStepTimer = () => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
  };

  const startStepProgress = useCallback(() => {
    clearStepTimer();
    const steps = [
      'Dispatching job to Lighthouse engine…',
      'Launching headless browser probe…',
      'Running audits for Performance, Accessibility, SEO & Best Practices…',
      'Calculating Core Web Vitals & field telemetry…',
      'Capturing final viewport screenshot…',
      'Compiling audit recommendations & savings…',
    ];

    let currentStep = 0;
    setAuditStep(steps[0]);

    stepIntervalRef.current = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length;
      if (mountedRef.current) {
        setAuditStep(steps[currentStep]);
      }
    }, 4500);
  }, []);

  /** Resolve or reject the in-flight audit cleanly */
  const settle = useCallback((err, resultData) => {
    clearStepTimer();
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
      pending.resolve(resultData);
    }
  }, []);

  /** Socket listener for live completion & failure events */
  useEffect(() => {
    const handleCompleted = (payload) => {
      const pending = pendingRef.current;
      if (!pending) return;

      const incomingJobId = payload?.jobId || payload?.lighthousedbId;
      if (
        pending.jobId &&
        incomingJobId &&
        String(pending.jobId) !== String(incomingJobId) &&
        String(pending.dbId) !== String(incomingJobId)
      ) {
        return;
      }

      const auditResult = payload?.result || payload;
      if (payload?.status === 'failed' || auditResult?.status === 'failed') {
        settle(new Error(payload?.error || auditResult?.error || 'Lighthouse audit execution failed on server.'));
        return;
      }

      settle(null, payload);
    };

    const handleFailed = (payload) => {
      const pending = pendingRef.current;
      if (!pending) return;

      const incomingJobId = payload?.jobId || payload?.lighthousedbId;
      if (
        pending.jobId &&
        incomingJobId &&
        String(pending.jobId) !== String(incomingJobId) &&
        String(pending.dbId) !== String(incomingJobId)
      ) {
        return;
      }

      const reason =
        payload?.error || payload?.failedReason || 'Lighthouse audit failed during execution.';
      settle(new Error(reason));
    };

    const unsub = subscribeToEvents({
      [ON.LIGHTHOUSE_RESULT]: handleCompleted,
      [ON.LIGHTHOUSE_COMPLETED]: handleCompleted,
      [ON.LIGHTHOUSE_COMPLETED_ALT]: handleCompleted,
      lighthouseCompleted: handleCompleted,
      [ON.LIGHTHOUSE_FAILED]: handleFailed,
    });

    return () => unsub();
  }, [settle]);

  /**
   * Fetch paginated results from MongoDB backend API.
   * Scalable with request sequencing to eliminate race conditions.
   */
  const fetchHistory = useCallback(
    async (customParams = {}, options = {}) => {
      const seq = ++fetchReqSeqRef.current;
      const { selectFirstIfEmpty = false } = options;

      try {
        setHistoryLoading(true);
        const page = customParams.page ?? historyPagination.page ?? 1;
        const limit = customParams.limit ?? historyPagination.limit ?? LIGHTHOUSE_PAGE_LIMIT;
        const url = customParams.url !== undefined ? customParams.url : historyFilter.url;

        const params = { page, limit, status: 'completed' };
        if (url && url.trim()) {
          params.url = url.trim();
        }

        const res = await getLighthouseResults(params);
        if (!mountedRef.current || seq !== fetchReqSeqRef.current) return;

        if (res?.success && Array.isArray(res?.data)) {
          const normalizedList = res.data
            .map((item) => normalizeLighthouseEntry(item))
            .filter(Boolean);

          setHistory(normalizedList);

          if (res.pagination) {
            setHistoryPagination(res.pagination);
          }

          if (selectFirstIfEmpty && normalizedList.length > 0) {
            setReport((current) => current || normalizedList[0]);
          }
        }
      } catch (err) {
        if (!mountedRef.current || seq !== fetchReqSeqRef.current) return;
        console.error('[Lighthouse] Failed to fetch audit history from backend:', err);
      } finally {
        if (mountedRef.current && seq === fetchReqSeqRef.current) {
          setHistoryLoading(false);
        }
      }
    },
    [historyFilter.url, historyPagination.limit, historyPagination.page],
  );

  /** Initial load of history on mount — automatically loads the latest audit result */
  useEffect(() => {
    let ignore = false;
    getLighthouseResults({ page: 1, limit: LIGHTHOUSE_PAGE_LIMIT, status: 'completed' })
      .then((res) => {
        if (ignore || !mountedRef.current) return;
        if (res?.success && Array.isArray(res?.data)) {
          const normalizedList = res.data
            .map((item) => normalizeLighthouseEntry(item))
            .filter(Boolean);

          setHistory(normalizedList);
          if (res.pagination) {
            setHistoryPagination(res.pagination);
          }
          if (normalizedList.length > 0) {
            setReport(normalizedList[0]);
          }
        }
      })
      .catch((err) => {
        if (!ignore) console.error('[Lighthouse] Initial fetch error:', err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  /** Trigger an audit job */
  const runAudit = useCallback(
    async (rawUrl, auditStrategy = strategy) => {
      if (pendingRef.current) {
        toast.info('An audit is already in progress.');
        return;
      }

      const normalized = normalizeUrl(rawUrl);
      if (!isValidUrl(normalized)) {
        toast.error('Please enter a valid URL (e.g. example.com or https://example.com)');
        return;
      }

      setStatus('auditing');
      setError(null);
      startStepProgress();

      try {
        await waitForSocket();

        const res = await generateLighthouseReport(normalized, auditStrategy);
        const jobId = res?.jobId || res?.data?._id;
        const lighthousedbId = res?.lighthousedbId || res?.data?._id;
        const targetId = String(lighthousedbId || jobId);

        // Register job ID for automatic socket catchup recovery on reconnect
        if (targetId) {
          registerCatchupJob('lighthouse', targetId);
        }

        const rawResult = await new Promise((resolve, reject) => {
          pendingRef.current = {
            jobId,
            dbId: lighthousedbId,
            resolve,
            reject,
            timer: setTimeout(async () => {
              // Graceful fallback: Check status endpoint before timing out
              if (targetId) {
                try {
                  const check = await getLighthouseStatus(targetId);
                  if (check?.success && check?.status === 'completed' && check?.result) {
                    settle(null, check);
                    return;
                  }
                } catch {
                  // Ignore and proceed
                }
              }
              settle(new Error('Audit timed out waiting for Lighthouse response.'));
            }, LIGHTHOUSE_SCAN_TIMEOUT_MS),
          };

          // Watchdog 1: At 10s, proactively emit socket catchup
          const watchdogTimer = setTimeout(() => {
            if (pendingRef.current && targetId) {
              emitCatchup({ service: 'lighthouse', id: targetId });
            }

            // Watchdog 2: At 15s, start fallback status polling
            const pollingInterval = setInterval(async () => {
              if (!pendingRef.current || !targetId) return;
              try {
                const check = await getLighthouseStatus(targetId);
                if (check?.success && (check.status === 'completed' || check.status === 'failed')) {
                  if (check.status === 'failed') {
                    settle(new Error(check.error || 'Lighthouse audit failed.'));
                    return;
                  }
                  settle(null, check);
                }
              } catch {
                // Ignore transient polling errors
              }
            }, 3000);

            if (pendingRef.current) {
              pendingRef.current.pollingInterval = pollingInterval;
            }
          }, 10000);

          if (pendingRef.current) {
            pendingRef.current.watchdogTimer = watchdogTimer;
          }
        });

        if (!mountedRef.current) return;

        const newEntry = normalizeLighthouseEntry({
          _id: lighthousedbId,
          url: normalized,
          strategy: auditStrategy,
          status: 'completed',
          result: rawResult?.result || rawResult,
          createdAt: new Date().toISOString(),
        });

        setReport(newEntry);
        setStatus('done');
        toast.success('FullSite report generated successfully!');

        // Refresh database history & pagination
        fetchHistory({ page: 1 });
      } catch (err) {
        settle(err);
        if (!mountedRef.current) return;
        const msg =
          err?.response?.data?.error || err?.message || 'Failed to complete FullSite report audit.';
        setError(msg);
        setStatus('error');
        toast.error(msg);
      } finally {
        clearStepTimer();
      }
    },
    [fetchHistory, settle, startStepProgress, strategy, toast],
  );

  /** Select an audit entry from the paginated history list */
  const selectEntry = useCallback(
    async (entry) => {
      if (!entry) return;
      setReport(entry);
      setError(null);
      setStatus('done');

      // Fetch fresh details if only summary is available
      if (entry.dbId && (!entry.scores || Object.keys(entry.scores).length === 0)) {
        try {
          const detailRes = await getLighthouseById(entry.dbId);
          if (mountedRef.current && detailRes?.success && detailRes?.data) {
            const fresh = normalizeLighthouseEntry(detailRes.data);
            if (fresh) {
              setReport(fresh);
            }
          }
        } catch (detailErr) {
          console.error('[Lighthouse] Failed to fetch report details by ID:', detailErr);
        }
      }
    },
    [],
  );

  /** Handle pagination page switch */
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
      report,
      strategy,
      setStrategy,
      history,
      historyLoading,
      historyPagination,
      historyFilter,
      auditStep,
      isAuditing: status === 'auditing',
      runAudit,
      selectEntry,
      fetchHistory,
      handlePageChange,
      handleFilterChange,
      handleRefresh,
    }),
    [
      status,
      error,
      report,
      strategy,
      history,
      historyLoading,
      historyPagination,
      historyFilter,
      auditStep,
      runAudit,
      selectEntry,
      fetchHistory,
      handlePageChange,
      handleFilterChange,
      handleRefresh,
    ],
  );
}
