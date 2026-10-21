import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getDemoHealth,
  getDemoStatus,
  initializeDemoSession,
  runDemoJob,
} from '../../api/demo';
import {
  ON,
  emitCatchup,
  isSocketConnected,
  registerCatchupJob,
  subscribeToEvents,
  unregisterCatchupJob,
  waitForSocket,
} from '../../api/socket';
import { ROUTES } from '../../constants';
import { useAuthState } from '../../context';
import { getAppUrl } from '../../utils/subdomainNav';
import { extractReadings, formatMs, normalizeUrl, rateLatency } from '../TTFB/ttfb.utils';
import { normalizeLighthouseEntry, rateScore, AUDIT_CATEGORIES } from '../Lighthouse/lighthouse.utils';
import { normalizeDnsEntry, normalizeDomain } from '../DnsType/dns.utils';
import { normalizeRedirectEntry, normalizeRedirectUrl } from '../Redirects/redirects.utils';
import { normalizeWhoisEntry } from '../Whois/whois.utils';
import DnsResultSection from '../DnsType/components/DnsResultSection';
import WhoisResultSection from '../Whois/components/WhoisResultSection';
import RedirectResultSection from '../Redirects/components/RedirectResultSection';
import { getRouteMetadata } from '../../seo/routes';
import Logo from '../../components/Logo';

const TOOL_CONFIG = {
  ttfb: {
    id: 'ttfb',
    label: 'TTFB Latency',
    title: 'Time to First Byte (TTFB)',
    description: 'Measure server response times across global edge probe nodes.',
    placeholder: 'https://example.com',
    authRoute: ROUTES.TTFB,
    demoRoute: ROUTES.TOOLS_TTFB,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  lighthouse: {
    id: 'lighthouse',
    label: 'FullSite Report',
    title: 'FullSite Report Quality Audit',
    description: 'Run deep Performance, Accessibility, Best Practices, and SEO audits.',
    placeholder: 'https://example.com',
    authRoute: ROUTES.LIGHTHOUSE,
    demoRoute: ROUTES.TOOLS_LIGHTHOUSE,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  dns: {
    id: 'dns',
    label: 'DNS Records',
    title: 'DNS Record Inspector',
    description: 'Lookup and inspect authoritative A, AAAA, CNAME, MX, TXT, and NS records.',
    placeholder: 'example.com',
    authRoute: ROUTES.DNS,
    demoRoute: ROUTES.TOOLS_DNS,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="7" rx="2" />
        <rect x="2" y="13" width="20" height="7" rx="2" />
        <line x1="6" y1="7.5" x2="6.01" y2="7.5" />
        <line x1="6" y1="16.5" x2="6.01" y2="16.5" />
      </svg>
    ),
  },
  redirects: {
    id: 'redirects',
    label: 'Redirect Tracer',
    title: 'Redirect Chain Checker',
    description: 'Trace 301/302 HTTP redirect hops, detect loops, and inspect destination status.',
    placeholder: 'https://example.com',
    authRoute: ROUTES.REDIRECTS,
    demoRoute: ROUTES.TOOLS_REDIRECTS,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  whois: {
    id: 'whois',
    label: 'WHOIS Lookup',
    title: 'WHOIS & Domain Intelligence',
    description: 'Query authoritative registrar data, domain registration dates, and nameservers.',
    placeholder: 'example.com',
    authRoute: ROUTES.WHOIS,
    demoRoute: ROUTES.TOOLS_WHOIS,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
};

const TIMEOUT_CONFIG = {
  ttfb: 40_000,
  lighthouse: 85_000,
  dns: 25_000,
  redirects: 25_000,
  whois: 25_000,
};


function CircularGauge({ score, label, description }) {
  const rating = rateScore(score);
  const numericScore = score != null ? Math.round(Number(score)) : 0;
  const size = 96;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = score != null ? circumference - (numericScore / 100) * circumference : circumference;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center transition hover:border-[var(--border-mid)]">
      <div className="relative mb-2 flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="var(--ring-track, rgba(255,255,255,0.08))"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={rating.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-['Outfit',sans-serif] text-xl font-black" style={{ color: rating.color }}>
            {score != null ? numericScore : '—'}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: rating.color }}>
            {rating.label}
          </span>
        </div>
      </div>
      <h3 className="font-['Outfit',sans-serif] text-xs font-bold text-[var(--text)]">
        {label}
      </h3>
      {description && (
        <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--muted-2)]">
          {description}
        </p>
      )}
    </div>
  );
}

export default function DemoAnalyzerPage({ kind: initialKind = 'ttfb' }) {
  const [activeTool, setActiveTool] = useState(initialKind);
  const { isAuthenticated, loading } = useAuthState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [url, setUrl] = useState(() => searchParams.get('url') || '');
  const [phase, setPhase] = useState('preparing'); // preparing | ready | running | complete | error
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [quota, setQuota] = useState({ remaining: 6, total: 6, isLimited: false, nextAvailableAt: null });
  const [, setInfraHealth] = useState(null);
  const [sessionRoom, setSessionRoom] = useState(null);

  // Tool specific options
  const [ttfbMode, setTtfbMode] = useState('all');
  const [lighthouseStrategy, setLighthouseStrategy] = useState('mobile');
  const [progress, setProgress] = useState({ received: 0, expected: 0 });

  const pendingRef = useRef(null);
  const activeToolRef = useRef(activeTool);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  // Sync initial kind prop changes from router
  const [prevInitialKind, setPrevInitialKind] = useState(initialKind);
  if (prevInitialKind !== initialKind) {
    setPrevInitialKind(initialKind);
    setActiveTool(initialKind);
    setResult(null);
    setError('');
  }

  // Keep url in sync if search parameter changes externally
  useEffect(() => {
    const paramUrl = searchParams.get('url');
    if (paramUrl && paramUrl !== url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from searchParams
      setUrl(paramUrl);
    }
  }, [searchParams, url]);

  // If already authenticated, redirect to the full workspace tool on app subdomain
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      const targetRoute = TOOL_CONFIG[activeTool]?.authRoute || ROUTES.HOME;
      window.location.replace(getAppUrl(targetRoute));
    }
  }, [isAuthenticated, loading, activeTool]);

  // 1. Session bootstrap & Socket-First flow per DEMO_FLOW.md
  useEffect(() => {
    if (loading || isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        setPhase('preparing');
        setError('');

        // Step 1: Initialize demo session (sets HttpOnly signed gid cookie)
        const session = await initializeDemoSession();
        if (cancelled) return;

        if (session?.roomId) {
          setSessionRoom(session.roomId);
        }

        // Step 2: Ensure socket connected with the gid cookie
        await waitForSocket(6_000);
        if (cancelled) return;

        // Fetch infrastructure health in the background
        getDemoHealth()
          .then((health) => {
            if (!cancelled && health?.status) setInfraHealth(health);
          })
          .catch(() => {});

        setPhase('ready');
      } catch {
        if (!cancelled) {
          setPhase('ready'); // Graceful degradation allowing submission
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loading]);

  // Unified Real-Time Socket Event Subscriptions (Standardized + Legacy) per DEMO_FLOW.md
  useEffect(() => {
    const checkMatchingJob = (payload, expectedKind) => {
      const pending = pendingRef.current;
      if (!pending || pending.kind !== expectedKind) return false;

      const incomingId = String(
        payload?.jobId ||
          payload?.ttfbdbId ||
          payload?.dnsRecordId ||
          payload?.redirectCheckId ||
          payload?.recordId ||
          payload?.whoisDbId ||
          payload?.lighthousedbId ||
          '',
      );

      return pending.jobIds.includes(incomingId) || !pending.jobIds.length;
    };

    const handleTtfbResult = (payload) => {
      const pending = pendingRef.current;
      if (!pending || !checkMatchingJob(payload, 'ttfb')) return;

      const data = payload?.result || payload;
      if (payload?.status === 'failed' || data?.status === 'failed') {
        pending.reject(new Error(payload?.error || data?.error || 'TTFB measurement failed.'));
        return;
      }

      const reading = extractReadings(payload)[0];
      if (!reading) return;

      if (!pending.readings.some((item) => item.region === reading.region)) {
        pending.readings.push(reading);
      }

      setProgress({ received: pending.readings.length, expected: pending.expected });
      if (pending.readings.length >= pending.expected) {
        pending.resolve(pending.readings);
      }
    };

    const handleLighthouseResult = (payload) => {
      const pending = pendingRef.current;
      if (!pending || !checkMatchingJob(payload, 'lighthouse')) return;
      const res = payload?.result || payload;
      if (payload?.status === 'failed' || res?.status === 'failed') {
        pending.reject(new Error(payload?.error || 'Lighthouse audit execution failed.'));
      } else {
        pending.resolve(payload);
      }
    };

    const handleDnsResult = (payload) => {
      const pending = pendingRef.current;
      if (!pending || !checkMatchingJob(payload, 'dns')) return;
      if (payload?.status === 'failed') {
        pending.reject(new Error(payload?.error || 'DNS query resolution failed.'));
      } else {
        pending.resolve(payload?.result || payload);
      }
    };

    const handleRedirectResult = (payload) => {
      const pending = pendingRef.current;
      if (!pending || !checkMatchingJob(payload, 'redirects')) return;
      if (payload?.status === 'failed') {
        pending.reject(new Error(payload?.error || 'Redirect chain check failed.'));
      } else {
        pending.resolve(payload?.result || payload);
      }
    };

    const handleWhoisResult = (payload) => {
      const pending = pendingRef.current;
      if (!pending || !checkMatchingJob(payload, 'whois')) return;
      if (payload?.status === 'failed') {
        pending.reject(new Error(payload?.error || 'WHOIS lookup failed.'));
      } else {
        pending.resolve(payload?.result || payload);
      }
    };

    const unsubscribe = subscribeToEvents({
      // TTFB: standard & legacy
      [ON.TTFB_RESULT]: handleTtfbResult,
      [ON.TTFB_COMPLETED]: handleTtfbResult,

      // Lighthouse: standard & legacy
      [ON.LIGHTHOUSE_RESULT]: handleLighthouseResult,
      [ON.LIGHTHOUSE_COMPLETED]: handleLighthouseResult,
      [ON.LIGHTHOUSE_COMPLETED_ALT]: handleLighthouseResult,
      [ON.LIGHTHOUSE_FAILED]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'lighthouse')) {
          pending.reject(new Error(payload?.error || 'Lighthouse audit failed.'));
        }
      },

      // DNS: standard & legacy
      [ON.DNS_RESULT]: handleDnsResult,
      [ON.DNS_COMPLETED]: handleDnsResult,
      [ON.DNS_COMPLETED_ALT]: handleDnsResult,
      [ON.DNS_FAILED]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'dns')) {
          pending.reject(new Error(payload?.error || 'DNS query failed.'));
        }
      },
      [ON.DNS_FAILED_ALT]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'dns')) {
          pending.reject(new Error(payload?.error || 'DNS query failed.'));
        }
      },

      // Redirect: standard & legacy
      [ON.REDIRECT_RESULT]: handleRedirectResult,
      [ON.REDIRECT_COMPLETED]: handleRedirectResult,
      [ON.REDIRECT_COMPLETED_ALT]: handleRedirectResult,
      [ON.REDIRECT_FAILED]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'redirects')) {
          pending.reject(new Error(payload?.error || 'Redirect chain check failed.'));
        }
      },
      [ON.REDIRECT_FAILED_ALT]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'redirects')) {
          pending.reject(new Error(payload?.error || 'Redirect chain check failed.'));
        }
      },

      // WHOIS: standard & legacy
      [ON.WHOIS_RESULT]: handleWhoisResult,
      [ON.WHOIS_COMPLETED]: handleWhoisResult,
      [ON.WHOIS_COMPLETED_ALT]: handleWhoisResult,
      [ON.WHOIS_FAILED]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'whois')) {
          pending.reject(new Error(payload?.error || 'WHOIS lookup failed.'));
        }
      },
      [ON.WHOIS_FAILED_ALT]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'whois')) {
          pending.reject(new Error(payload?.error || 'WHOIS lookup failed.'));
        }
      },
    });

    return unsubscribe;
  }, []);

  const handleSelectTool = useCallback(
    (toolId) => {
      if (phase === 'running') return;
      setActiveTool(toolId);
      setResult(null);
      setError('');
      const targetRoute = TOOL_CONFIG[toolId]?.demoRoute || `/tools/${toolId}`;
      const trimmed = url.trim();
      navigate(trimmed ? `${targetRoute}?url=${encodeURIComponent(trimmed)}` : targetRoute, { replace: true });
    },
    [navigate, phase, url],
  );

  const runDemo = useCallback(
    async (event) => {
      event?.preventDefault();
      if (phase === 'running') return;

      const trimmed = url.trim();
      if (!trimmed) {
        setError('Please enter a website or domain to analyze.');
        return;
      }

      let target;
      if (activeTool === 'dns' || activeTool === 'whois') {
        target = normalizeDomain(trimmed);
      } else if (activeTool === 'redirects') {
        target = normalizeRedirectUrl(trimmed);
      } else {
        target = normalizeUrl(trimmed);
      }

      setError('');
      setResult(null);
      setPhase('running');

      const targetRoute = TOOL_CONFIG[activeTool]?.demoRoute || `/tools/${activeTool}`;
      navigate(`${targetRoute}?url=${encodeURIComponent(target)}`, { replace: true });

      const expectedCount = activeTool === 'ttfb' && ttfbMode === 'all' ? 3 : 1;
      setProgress({ received: 0, expected: expectedCount });

      let watchdogTimer = null;
      let pollingInterval = null;
      let inFlightJobIds = [];

      try {
        // Step 1: Ensure demo session is initialized before request
        const session = await initializeDemoSession();
        if (session?.roomId) setSessionRoom(session.roomId);

        // Step 2: Ensure socket connected
        await waitForSocket(5_000);

        const options = {
          mode: ttfbMode,
          strategy: lighthouseStrategy,
        };

        // Step 3: Submit analysis job (returns 202 Accepted)
        const response = await runDemoJob(activeTool, target, options);

        // Synchronize quota metadata from response
        if (response?.remaining !== undefined) {
          setQuota({
            remaining: response.remaining,
            total: response.totalLimit || 6,
            isLimited: response.remaining <= 0,
            nextAvailableAt: null,
          });
        }

        // Collect matching jobIds
        if (activeTool === 'ttfb' && ttfbMode === 'all') {
          inFlightJobIds = response?.jobs?.map((j) => String(j.jobId)).filter(Boolean) || [];
        } else {
          const singleId = String(
            response?.jobId ||
              response?.ttfbdbId ||
              response?.dnsRecordId ||
              response?.redirectCheckId ||
              response?.whoisDbId ||
              response?.lighthousedbId ||
              '',
          );
          if (singleId) inFlightJobIds = [singleId];
        }

        // Register with socket catchup manager (for reconnect auto-recovery)
        for (const jId of inFlightJobIds) {
          registerCatchupJob(activeTool, jId);
        }

        const waitDuration = TIMEOUT_CONFIG[activeTool] || 35_000;

        // Step 4 & 5: Guaranteed delivery via socket events + catchup watchdog + fallback HTTP polling
        const rawData = await new Promise((resolve, reject) => {
          const timeoutTimer = setTimeout(() => {
            cleanupFailsafe();
            reject(new Error('The request timed out waiting for backend worker response.'));
          }, waitDuration);

          const cleanupFailsafe = () => {
            clearTimeout(timeoutTimer);
            if (watchdogTimer) clearTimeout(watchdogTimer);
            if (pollingInterval) clearInterval(pollingInterval);
            pendingRef.current = null;
            for (const jId of inFlightJobIds) {
              unregisterCatchupJob(jId);
            }
          };

          pendingRef.current = {
            kind: activeTool,
            jobIds: inFlightJobIds,
            readings: [],
            expected: expectedCount,
            resolve: (val) => {
              cleanupFailsafe();
              resolve(val);
            },
            reject: (err) => {
              cleanupFailsafe();
              reject(err);
            },
          };

          // Watchdog 1: At 8s, proactively emit socket 'catchup'
          watchdogTimer = setTimeout(() => {
            if (pendingRef.current && inFlightJobIds.length > 0) {
              const catchupPayload = inFlightJobIds.map((id) => ({
                service: activeTool === 'redirects' ? 'redirect' : activeTool,
                id,
              }));
              emitCatchup(catchupPayload);
            }

            // Watchdog 2: At 12s, initiate fallback HTTP status polling (GET /demo/status/:service/:id)
            pollingInterval = setInterval(async () => {
              if (!pendingRef.current || !inFlightJobIds.length) return;
              try {
                for (const jId of inFlightJobIds) {
                  const statusData = await getDemoStatus(activeTool, jId);
                  if (statusData?.success && (statusData.status === 'completed' || statusData.status === 'failed')) {
                    if (statusData.status === 'failed') {
                      pendingRef.current?.reject(
                        new Error(statusData.error || `${activeTool} analysis failed.`)
                      );
                      return;
                    }

                    if (activeTool === 'ttfb') {
                      const reading = {
                        region: statusData.result?.region || 'probe',
                        ms: statusData.result?.ttfbMs || statusData.result?.ms || 0,
                        raw: statusData.result,
                      };
                      if (!pendingRef.current.readings.some((r) => r.region === reading.region)) {
                        pendingRef.current.readings.push(reading);
                      }
                      setProgress({
                        received: pendingRef.current.readings.length,
                        expected: pendingRef.current.expected,
                      });
                      if (pendingRef.current.readings.length >= pendingRef.current.expected) {
                        pendingRef.current.resolve(pendingRef.current.readings);
                      }
                    } else {
                      pendingRef.current?.resolve(statusData.result || statusData);
                      return;
                    }
                  }
                }
              } catch {
                // Ignore transient polling errors and wait for next interval or socket
              }
            }, 3000);
          }, 8000);
        });

        // Normalize result per service schema
        let parsed = rawData;
        if (activeTool === 'lighthouse') {
          parsed = normalizeLighthouseEntry(rawData);
        } else if (activeTool === 'dns') {
          parsed = normalizeDnsEntry({ url: target, result: rawData?.result || rawData });
        } else if (activeTool === 'redirects') {
          parsed = normalizeRedirectEntry({ url: target, result: rawData?.result || rawData });
        } else if (activeTool === 'whois') {
          parsed = normalizeWhoisEntry({ url: target, result: rawData?.result || rawData });
        }

        setResult(parsed);
        setPhase('complete');
      } catch (err) {
        pendingRef.current = null;
        for (const jId of inFlightJobIds) {
          unregisterCatchupJob(jId);
        }

        // Catch 429 quota exhaustion specifically (GUEST_DEMO_LIMIT_EXCEEDED)
        const isQuotaError =
          err?.code === 'GUEST_DEMO_LIMIT_EXCEEDED' ||
          err?.response?.data?.code === 'GUEST_DEMO_LIMIT_EXCEEDED' ||
          err?.status === 429 ||
          err?.response?.status === 429;

        if (isQuotaError) {
          const nextReset =
            err?.nextAvailableAt ||
            err?.response?.data?.nextAvailableAt ||
            null;

          setQuota((prev) => ({
            ...prev,
            remaining: 0,
            isLimited: true,
            nextAvailableAt: nextReset,
          }));

          setError(
            err?.response?.data?.message ||
              err?.message ||
              'Daily guest limit exceeded. You have reached 6 free tool tests today.'
          );
        } else {
          setError(
            err?.response?.data?.error ||
              err?.response?.data?.message ||
              err?.error ||
              err?.message ||
              'The diagnostic check could not be completed.'
          );
        }

        setPhase('error');
      }
    },
    [activeTool, lighthouseStrategy, navigate, phase, ttfbMode, url],
  );

  const currentTool = TOOL_CONFIG[activeTool] || TOOL_CONFIG.ttfb;
  const seoData = getRouteMetadata(`/tools/${activeTool}`);
  const isRunning = phase === 'running';

  const formatResetTime = (isoString) => {
    if (!isoString) return 'midnight UTC';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    } catch {
      return 'midnight UTC';
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-3.5 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4 sm:mb-8">
          <Logo to={ROUTES.PUBLIC_HOME} />
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Quota Pill */}
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-1 font-['JetBrains_Mono',monospace] text-xs sm:inline-flex ${
                quota.remaining <= 1
                  ? 'border-[var(--red)]/40 bg-[var(--red)]/10 text-[var(--red)]'
                  : quota.remaining <= 3
                  ? 'border-[var(--orange)]/40 bg-[var(--orange)]/10 text-[var(--orange)]'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  quota.remaining <= 1
                    ? 'bg-[var(--red)]'
                    : quota.remaining <= 3
                    ? 'bg-[var(--orange)]'
                    : 'bg-[var(--cyan)] animate-pulse'
                }`}
              />
              <span>Daily Quota: {quota.remaining}/{quota.total}</span>
            </span>

            {/* Socket Health Indicator */}
            <span
              className="hidden items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--muted-2)] md:inline-flex"
              title={sessionRoom ? `Room: ${sessionRoom}` : 'Socket session'}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isSocketConnected() ? 'bg-[var(--green)]' : 'bg-[var(--orange)] animate-pulse'
                }`}
              />
              <span className="font-['JetBrains_Mono',monospace]">
                {isSocketConnected() ? 'Live Socket' : 'Connecting'}
              </span>
            </span>

            <a
              href={getAppUrl(`/login?from=${encodeURIComponent(currentTool.authRoute)}`)}
              className="text-xs sm:text-sm font-semibold text-[var(--muted-2)] hover:text-[var(--text)]"
            >
              Sign in
            </a>
            <a
              href={getAppUrl(`/register?from=${encodeURIComponent(currentTool.authRoute)}`)}
              className="rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110"
            >
              Sign up
            </a>
          </div>
        </header>

        {/* Tool Switcher Tabs */}
        <nav aria-label="Diagnostic tools" className="-mx-3.5 sm:mx-0 px-3.5 sm:px-0 mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {Object.values(TOOL_CONFIG).map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                disabled={isRunning}
                onClick={() => handleSelectTool(tool.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)]'
                }`}
              >
                {tool.icon}
                <span>{tool.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quota Exhaustion Alert Card (429) */}
        {quota.isLimited && (
          <div
            role="alert"
            className="mb-6 overflow-hidden rounded-2xl border border-[var(--orange)]/40 bg-gradient-to-br from-[var(--orange)]/15 via-[var(--surface)] to-[var(--surface-2)] p-6 shadow-lg"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--orange)]/20 text-[var(--orange)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <div>
                  <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] sm:text-lg">
                    Daily Free Tool Limit Reached (6/6 used)
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--muted-2)]">
                    Guests receive a free quota of 6 tests per day across all diagnostic tools.
                    {quota.nextAvailableAt ? (
                      <span> Your quota resets at <strong className="text-[var(--text)]">{formatResetTime(quota.nextAvailableAt)}</strong>.</span>
                    ) : (
                      <span> Sign in or create a free account to bypass limits with unlimited instant runs.</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:shrink-0">
                <a
                  href={getAppUrl(`/register?from=${encodeURIComponent(currentTool.authRoute)}`)}
                  className="rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110"
                >
                  Create Free Account
                </a>
                <a
                  href={getAppUrl(`/login?from=${encodeURIComponent(currentTool.authRoute)}`)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface)]"
                >
                  Log In
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 sm:p-7 lg:p-9 shadow-[var(--shadow-card)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--cyan-dim)] blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="rounded-full bg-[var(--cyan-dim)] px-2.5 py-1 font-['JetBrains_Mono',monospace] text-[10px] sm:text-xs font-semibold text-[var(--cyan)]">
                FREE GUEST DEMO · ZERO SIGNUP REQUIRED
              </span>
              <span className="font-['JetBrains_Mono',monospace] text-[11px] sm:text-xs text-[var(--muted)]">
                {quota.remaining} of {quota.total} tests remaining today
              </span>
            </div>

            <h1 className="mt-3.5 sm:mt-4 font-['Outfit',sans-serif] text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              {seoData?.h1 || currentTool.title}
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--muted-2)]">
              {seoData?.summary || currentTool.description} Free guest runs are delivered live via Socket.IO with failsafe recovery.
            </p>

            {/* TTFB Mode Options */}
            {activeTool === 'ttfb' && (
              <div className="mt-5 grid grid-cols-2 gap-3" role="group" aria-label="TTFB probes">
                {[
                  ['single', 'Single Location', 'India node'],
                  ['all', 'All Global Nodes', 'India, Europe & USA'],
                ].map(([val, lbl, hnt]) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isRunning}
                    onClick={() => setTtfbMode(val)}
                    className={`rounded-xl border p-3 text-left transition ${
                      ttfbMode === val
                        ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)]'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan-mid)]'
                    }`}
                  >
                    <span className="block text-sm font-bold">{lbl}</span>
                    <span className="mt-0.5 block text-xs opacity-75">{hnt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Lighthouse Strategy Options */}
            {activeTool === 'lighthouse' && (
              <div className="mt-5 grid grid-cols-2 gap-3" role="group" aria-label="Device strategy">
                {[
                  ['mobile', 'Mobile Profile', 'Moto G4 / 4G throttle'],
                  ['desktop', 'Desktop Profile', 'High-bandwidth cable'],
                ].map(([val, lbl, hnt]) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isRunning}
                    onClick={() => setLighthouseStrategy(val)}
                    className={`rounded-xl border p-3 text-left transition ${
                      lighthouseStrategy === val
                        ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)]'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan-mid)]'
                    }`}
                  >
                    <span className="block text-sm font-bold">{lbl}</span>
                    <span className="mt-0.5 block text-xs opacity-75">{hnt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={runDemo} className="mt-5 sm:mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isRunning}
                required
                placeholder={currentTool.placeholder}
                className="min-w-0 flex-1 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--cyan)]"
              />
              <button
                type="submit"
                disabled={isRunning || quota.isLimited}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[#0099ff] px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-bold text-white shadow-[0_0_20px_var(--cyan-mid)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunning ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <span>Run Check</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && !quota.isLimited && (
              <div role="alert" className="mt-4 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 p-4 text-sm text-[var(--red)]">
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* In-Flight Live Progress Animation */}
            {isRunning && (
              <div className="mt-6 rounded-2xl border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] p-4">
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--cyan-mid)] border-t-[var(--cyan)]" />
                  <div>
                    <p className="text-sm font-bold text-[var(--text)]">Streaming Live Analysis via Socket.IO…</p>
                    <p className="text-xs text-[var(--muted-2)]">
                      {activeTool === 'ttfb'
                        ? `Awaiting probe responses (${progress.received}/${progress.expected})`
                        : 'BullMQ worker process is executing diagnostics with 100% failsafe delivery guarantee.'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
                  <div
                    className="h-full animate-pulse rounded-full bg-[var(--cyan)]"
                    style={{
                      width:
                        activeTool === 'ttfb'
                          ? `${Math.max(15, (progress.received / Math.max(1, progress.expected)) * 100)}%`
                          : '75%',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Results Panels for All 5 Tools */}
        {result && (
          <section className="fade-up mt-6">
            {activeTool === 'ttfb' && <TtfbResult readings={result} />}
            {activeTool === 'lighthouse' && <LighthouseResult report={result} />}
            {activeTool === 'dns' && (
              <DnsResultSection result={result} isDemo={true} onReRun={runDemo} />
            )}
            {activeTool === 'redirects' && (
              <RedirectResultSection result={result} isDemo={true} onReRun={runDemo} />
            )}
            {activeTool === 'whois' && (
              <WhoisResultSection result={result} isDemo={true} onReRun={runDemo} />
            )}
          </section>
        )}

        {/* Explanatory Content & Technical Benchmarks */}
        {seoData?.explanation && (
          <section className="mt-8 sm:mt-10 rounded-2xl sm:rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-8 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[var(--cyan)]">
              <span>Knowledge Base</span>
              <span>•</span>
              <span>Technical Guide</span>
            </div>
            <h2 className="mt-2 font-['Outfit',sans-serif] text-lg sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Understanding {currentTool.title}
            </h2>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[var(--muted-2)]">
              {seoData.explanation.overview}
            </p>

            {/* Importance Points */}
            <div className="mt-6">
              <h3 className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Why This Metric Matters for SEO &amp; Experience
              </h3>
              <ul className="mt-3 space-y-2.5">
                {seoData.explanation.importance.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text)]">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--cyan-dim)] text-[10px] text-[var(--cyan)]">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benchmarks */}
            {seoData.explanation.benchmarks && (
              <div className="mt-8 border-t border-[var(--border)] pt-6">
                <h3 className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Industry Benchmarks &amp; Reference Thresholds
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {seoData.explanation.benchmarks.map((bm, idx) => (
                    <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                      <span className="font-['JetBrains_Mono',monospace] text-xs font-bold" style={{ color: bm.color }}>{bm.label}</span>
                      <p className="mt-1 font-['Outfit',sans-serif] text-base font-extrabold text-[var(--text)]">{bm.range}</p>
                      <p className="mt-1 text-xs text-[var(--muted-2)]">{bm.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Visible FAQs */}
        {seoData?.faqs && seoData.faqs.length > 0 && (
          <section className="mt-6 sm:mt-8 rounded-2xl sm:rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 sm:p-8 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[var(--green)]">
              <span>FAQ</span>
              <span>•</span>
              <span>Common Questions</span>
            </div>
            <h2 className="mt-2 font-['Outfit',sans-serif] text-lg sm:text-2xl font-bold tracking-tight text-[var(--text)]">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 divide-y divide-[var(--border)]">
              {seoData.faqs.map((faq, idx) => (
                <article key={idx} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="font-['Outfit',sans-serif] text-sm sm:text-base font-bold text-[var(--text)]">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--muted-2)]">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* CTA Footer - Unlock Full Analytics & Complete Reports */}
        <div className="relative mt-8 sm:mt-10 overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface-2)] p-4 sm:p-6 lg:p-8 text-center shadow-[var(--shadow-card)]">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-36 w-96 -translate-x-1/2 rounded-full bg-[var(--cyan)]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Top pill badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cyan)]/30 bg-[var(--cyan-dim)] px-3 py-1 font-['JetBrains_Mono',monospace] text-[11px] font-semibold text-[var(--cyan)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>FULL REPORTS &amp; RAW DIAGNOSTICS ACCESS</span>
            </span>

            {/* Headline */}
            <h2 className="mt-3 font-['Outfit',sans-serif] text-base sm:text-xl font-bold tracking-tight text-[var(--text)]">
              To get full analytics results and responses, log in first to get full access to reports
            </h2>

            {/* Subtitle */}
            <p className="mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-[var(--muted-2)]">
              Free tools provide an instant preview. Sign in or create a free account to unlock comprehensive diagnostic responses, multi-region latency telemetry, persistent uptime tracking, and downloadable white-label audit reports.
            </p>

            {/* Highlights Feature Pills */}
            <div className="mt-5 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-3.5 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--cyan-dim)] text-[var(--cyan)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-xs font-medium text-[var(--text)]">Complete raw response payloads &amp; headers</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-3.5 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--green-dim)] text-[var(--green)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-xs font-medium text-[var(--text)]">Full global probe nodes &amp; latency percentiles</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-3.5 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--purple-dim)] text-[var(--purple)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-xs font-medium text-[var(--text)]">Full historical records &amp; trend analysis</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-3.5 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--orange-dim)] text-[var(--orange)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-xs font-medium text-[var(--text)]">White-label PDF exports &amp; instant alerts</span>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                to={ROUTES.LOGIN}
                state={{ from: { pathname: currentTool.authRoute } }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[#0099ff] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_0_20px_var(--cyan-mid)] transition hover:brightness-110 sm:w-auto"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Log In for Full Access</span>
              </Link>
              <Link
                to={ROUTES.REGISTER}
                state={{ from: { pathname: currentTool.authRoute } }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-6 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text)] transition hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)] sm:w-auto"
              >
                <span>Create Free Account</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Result Renderers                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function TtfbResult({ readings }) {
  const items = Array.isArray(readings) ? readings : [readings];
  return (
    <div className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[var(--cyan)]">
            TTFB RESPONSE TIME
          </span>
          <h2 className="font-['Outfit',sans-serif] mt-0.5 text-xl font-bold">Regional Server Latency</h2>
        </div>
        <span className="rounded-full bg-[var(--green-dim)] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--green)]">
          Complete
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {items.map((r, i) => {
          const rating = rateLatency(r?.ms);
          return (
            <article key={r?.region || i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <span className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase text-[var(--muted)]">
                {r?.region || 'Probe'}
              </span>
              <p className="mt-2 text-3xl font-extrabold tracking-tight" style={{ color: rating.token }}>
                {formatMs(r?.ms)}
              </p>
              <span className="mt-1 inline-block text-xs font-medium" style={{ color: rating.token }}>
                {rating.label}
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function LighthouseResult({ report }) {
  const scores = report?.scores || {};
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--cyan-dim)] to-transparent p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[var(--cyan)]">
              LIGHTHOUSE SCORECARD
            </span>
            <h2 className="font-['Outfit',sans-serif] mt-0.5 text-xl font-bold">
              {report?.strategy === 'desktop' ? 'Desktop' : 'Mobile'} Experience Snapshot
            </h2>
          </div>
          <span className="rounded-full bg-[var(--green-dim)] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--green)]">
            Complete
          </span>
        </div>
        <p className="mt-2 truncate font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
          {report?.finalUrl || report?.url}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
        {AUDIT_CATEGORIES.map((cat) => (
          <CircularGauge
            key={cat.key}
            score={scores[cat.key]}
            label={cat.label}
            description={cat.description}
          />
        ))}
      </div>
    </div>
  );
}
