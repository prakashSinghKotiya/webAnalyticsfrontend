import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { initializeDemoSession, runDemoJob } from '../../api/demo';
import {
  ON,
  isSocketConnected,
  subscribeToEvents,
  waitForSocket,
} from '../../api/socket';
import { ROUTES } from '../../constants';
import { useAuthState } from '../../context';
import { extractReadings, formatMs, normalizeUrl, rateLatency } from '../TTFB/ttfb.utils';
import { normalizeLighthouseEntry, rateScore } from '../Lighthouse/lighthouse.utils';
import { normalizeDnsEntry, normalizeDomain } from '../DnsType/dns.utils';
import { normalizeRedirectEntry, normalizeRedirectUrl } from '../Redirects/redirects.utils';
import { normalizeWhoisEntry } from '../Whois/whois.utils';
import WhoisResultSection from '../Whois/components/WhoisResultSection';

const TOOL_CONFIG = {
  ttfb: {
    id: 'ttfb',
    label: 'TTFB Latency',
    title: 'Time to First Byte (TTFB)',
    description: 'Measure server response times across global edge probe nodes.',
    placeholder: 'https://example.com',
    authRoute: ROUTES.TTFB,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  lighthouse: {
    id: 'lighthouse',
    label: 'Lighthouse Audit',
    title: 'Lighthouse Quality Audit',
    description: 'Run deep Performance, Accessibility, Best Practices, and SEO audits.',
    placeholder: 'https://example.com',
    authRoute: ROUTES.LIGHTHOUSE,
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
  ttfb: 45_000,
  lighthouse: 90_000,
  dns: 30_000,
  redirects: 30_000,
  whois: 30_000,
};

function Logo() {
  return (
    <Link to={ROUTES.PUBLIC_HOME} className="flex items-center gap-2 font-['Outfit',sans-serif] text-lg font-bold">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] text-white text-xs font-black">
        W
      </span>
      <span>
        Web<span className="text-[var(--cyan)]">Pulse</span>
      </span>
    </Link>
  );
}

function ScoreCard({ name, value }) {
  const score = Number(value);
  const rating = rateScore(score);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
      <p className="text-xs text-[var(--muted)]">{name}</p>
      <p className="mt-2 text-2xl font-bold" style={{ color: rating.color }}>
        {Number.isFinite(score) ? score : '—'}
      </p>
      <p className="mt-1 text-xs" style={{ color: rating.color }}>
        {rating.label}
      </p>
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
  const [quota, setQuota] = useState({ remaining: 6, total: 6, isLimited: false });

  // Tool specific options
  const [ttfbMode, setTtfbMode] = useState('all');
  const [lighthouseStrategy, setLighthouseStrategy] = useState('mobile');
  const [progress, setProgress] = useState({ received: 0, expected: 0 });

  const pendingRef = useRef(null);
  const activeToolRef = useRef(activeTool);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  // Sync initial kind prop changes
  const [prevInitialKind, setPrevInitialKind] = useState(initialKind);
  if (prevInitialKind !== initialKind) {
    setPrevInitialKind(initialKind);
    setActiveTool(initialKind);
    setResult(null);
    setError('');
  }

  // If already authenticated, redirect to the full workspace tool
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      const targetRoute = TOOL_CONFIG[activeTool]?.authRoute || ROUTES.HOME;
      navigate(targetRoute, { replace: true });
    }
  }, [isAuthenticated, loading, activeTool, navigate]);

  // Robust session bootstrap & socket readiness with zero race conditions
  useEffect(() => {
    if (loading || isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        setPhase('preparing');
        setError('');
        await initializeDemoSession();
        const connected = await waitForSocket(12_000);

        if (!cancelled) {
          if (connected || isSocketConnected()) {
            setPhase('ready');
          } else {
            // Still allow interaction; socket will attempt reconnect
            setPhase('ready');
          }
        }
      } catch {
        if (!cancelled) {
          setPhase('ready'); // Degrade gracefully so user can submit request
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loading]);

  // Unified Real-Time Socket Event Subscriptions for all 5 tools
  useEffect(() => {
    const checkMatchingJob = (payload, expectedKind) => {
      const pending = pendingRef.current;
      if (!pending || pending.kind !== expectedKind) return false;

      const incomingId = String(
        payload?.jobId ||
          payload?.dnsRecordId ||
          payload?.redirectCheckId ||
          payload?.recordId ||
          payload?.whoisDbId ||
          payload?.lighthousedbId ||
          '',
      );

      return pending.jobIds.includes(incomingId) || !pending.jobIds.length;
    };

    const unsubscribe = subscribeToEvents({
      // 1. TTFB
      [ON.TTFB_COMPLETED]: (payload) => {
        const pending = pendingRef.current;
        if (!pending || !checkMatchingJob(payload, 'ttfb')) return;

        const data = payload?.result || payload;
        if (data?.status === 'failed') {
          pending.reject(new Error(data.error || 'TTFB measurement failed.'));
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
      },

      // 2. Lighthouse
      [ON.LIGHTHOUSE_COMPLETED]: (payload) => {
        const pending = pendingRef.current;
        if (!pending || !checkMatchingJob(payload, 'lighthouse')) return;
        const res = payload?.result || payload;
        if (res?.status === 'failed') {
          pending.reject(new Error(payload?.error || 'Lighthouse audit execution failed.'));
        } else {
          pending.resolve(payload);
        }
      },
      [ON.LIGHTHOUSE_COMPLETED_ALT]: (payload) => {
        const pending = pendingRef.current;
        if (!pending || !checkMatchingJob(payload, 'lighthouse')) return;
        pending.resolve(payload);
      },
      [ON.LIGHTHOUSE_FAILED]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'lighthouse')) {
          pending.reject(new Error(payload?.error || 'Lighthouse audit failed.'));
        }
      },

      // 3. DNS
      [ON.DNS_COMPLETED]: (payload) => {
        const pending = pendingRef.current;
        if (!pending || !checkMatchingJob(payload, 'dns')) return;
        pending.resolve(payload?.result || payload);
      },
      [ON.DNS_COMPLETED_ALT]: (payload) => {
        const pending = pendingRef.current;
        if (!pending || !checkMatchingJob(payload, 'dns')) return;
        pending.resolve(payload?.result || payload);
      },
      [ON.DNS_FAILED_ALT]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'dns')) {
          pending.reject(new Error(payload?.error || 'DNS query failed.'));
        }
      },

      // 4. Redirects
      [ON.REDIRECT_COMPLETED]: (payload) => {
        const pending = pendingRef.current;
        if (!pending || !checkMatchingJob(payload, 'redirects')) return;
        pending.resolve(payload?.result || payload);
      },
      [ON.REDIRECT_COMPLETED_ALT]: (payload) => {
        const pending = pendingRef.current;
        if (!pending || !checkMatchingJob(payload, 'redirects')) return;
        pending.resolve(payload?.result || payload);
      },
      [ON.REDIRECT_FAILED_ALT]: (payload) => {
        const pending = pendingRef.current;
        if (pending && checkMatchingJob(payload, 'redirects')) {
          pending.reject(new Error(payload?.error || 'Redirect chain check failed.'));
        }
      },

      // 5. WHOIS
      [ON.WHOIS_COMPLETED]: (payload) => {
        const pending = pendingRef.current;
        if (!pending || !checkMatchingJob(payload, 'whois')) return;
        pending.resolve(payload?.result || payload);
      },
      [ON.WHOIS_COMPLETED_ALT]: (payload) => {
        const pending = pendingRef.current;
        if (!pending || !checkMatchingJob(payload, 'whois')) return;
        pending.resolve(payload?.result || payload);
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

      const expectedCount = activeTool === 'ttfb' && ttfbMode === 'all' ? 3 : 1;
      setProgress({ received: 0, expected: expectedCount });

      try {
        // Fast-path: ensure guest cookie is active and socket ready
        await initializeDemoSession();
        await waitForSocket(5_000);

        const options = {
          mode: ttfbMode,
          strategy: lighthouseStrategy,
        };

        const response = await runDemoJob(activeTool, target, options);

        // Update quota state from server response if available
        if (response?.remaining !== undefined) {
          setQuota({
            remaining: response.remaining,
            total: response.totalLimit || 6,
            isLimited: response.remaining <= 0,
          });
        }

        // Collect matching jobIds for correlation
        let jobIds = [];
        if (activeTool === 'ttfb' && ttfbMode === 'all') {
          jobIds = response?.jobs?.map((j) => String(j.jobId)).filter(Boolean) || [];
        } else {
          const singleId = String(
            response?.jobId ||
              response?.dnsRecordId ||
              response?.redirectCheckId ||
              response?.whoisDbId ||
              response?.lighthousedbId ||
              '',
          );
          if (singleId) jobIds = [singleId];
        }

        const waitDuration = TIMEOUT_CONFIG[activeTool] || 35_000;

        const rawData = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            if (pendingRef.current) {
              pendingRef.current = null;
              reject(new Error('The request timed out waiting for backend worker response.'));
            }
          }, waitDuration);

          pendingRef.current = {
            kind: activeTool,
            jobIds,
            readings: [],
            expected: expectedCount,
            resolve: (val) => {
              clearTimeout(timer);
              pendingRef.current = null;
              resolve(val);
            },
            reject: (err) => {
              clearTimeout(timer);
              pendingRef.current = null;
              reject(err);
            },
          };
        });

        // Normalize result data per tool
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

        // Catch 429 quota exhaustion specifically
        if (err?.code === 'GUEST_DEMO_LIMIT_EXCEEDED' || err?.status === 429) {
          setQuota((prev) => ({ ...prev, remaining: 0, isLimited: true }));
          setError(
            err?.message ||
              'You have reached your daily quota of 6 free demo tests. Create a free account for unlimited runs!',
          );
        } else {
          setError(err?.error || err?.message || 'The diagnostic check could not be completed.');
        }

        setPhase('error');
      }
    },
    [activeTool, lighthouseStrategy, phase, ttfbMode, url],
  );

  const currentTool = TOOL_CONFIG[activeTool] || TOOL_CONFIG.ttfb;
  const isRunning = phase === 'running';

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b border-[var(--border)] pb-4">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
              <span>Demo Quota: {quota.remaining}/{quota.total}</span>
            </span>
            <Link to={ROUTES.LOGIN} className="text-sm font-semibold text-[var(--muted-2)] hover:text-[var(--text)]">
              Sign in
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110"
            >
              Sign up
            </Link>
          </div>
        </header>

        {/* Tool Switcher Tabs */}
        <nav aria-label="Demo tools" className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {Object.values(TOOL_CONFIG).map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                disabled={isRunning}
                onClick={() => {
                  setActiveTool(tool.id);
                  setResult(null);
                  setError('');
                }}
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

        {/* Main Card */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--cyan-dim)] blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-[var(--cyan-dim)] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--cyan)]">
                FREE DEMO · NO LOGIN REQUIRED
              </span>
              <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">
                {quota.remaining} of {quota.total} tests available today
              </span>
            </div>

            <h1 className="mt-4 font-['Outfit',sans-serif] text-2xl font-extrabold tracking-tight sm:text-3xl">
              {currentTool.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-2)]">
              {currentTool.description} Sign up to unlock historical graphs, custom alerts, and unlimited runs.
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
            <form onSubmit={runDemo} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isRunning}
                required
                placeholder={currentTool.placeholder}
                className="min-w-0 flex-1 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--cyan)]"
              />
              <button
                type="submit"
                disabled={isRunning || quota.isLimited}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[#0099ff] px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_var(--cyan-mid)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
            {error && (
              <div role="alert" className="mt-4 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 p-4 text-sm text-[var(--red)]">
                <p className="font-semibold">{error}</p>
                {quota.isLimited && (
                  <p className="mt-2 text-xs text-[var(--muted-2)]">
                    Create a free account in 30 seconds to run unlimited checks across all diagnostic services.{' '}
                    <Link to={ROUTES.REGISTER} className="font-bold text-[var(--cyan)] underline">
                      Sign up free
                    </Link>
                  </p>
                )}
              </div>
            )}

            {/* In-Flight Progress Animation */}
            {isRunning && (
              <div className="mt-6 rounded-2xl border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] p-4">
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--cyan-mid)] border-t-[var(--cyan)]" />
                  <div>
                    <p className="text-sm font-bold text-[var(--text)]">Streaming Live Analysis…</p>
                    <p className="text-xs text-[var(--muted-2)]">
                      {activeTool === 'ttfb'
                        ? `Awaiting probe responses (${progress.received}/${progress.expected})`
                        : 'Worker process is executing live diagnostics.'}
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

        {/* Results Panels */}
        {result && (
          <section className="fade-up mt-6">
            {activeTool === 'ttfb' && <TtfbResult readings={result} />}
            {activeTool === 'lighthouse' && <LighthouseResult report={result} />}
            {activeTool === 'dns' && <DnsResult data={result} />}
            {activeTool === 'redirects' && <RedirectsResult data={result} />}
            {activeTool === 'whois' && <WhoisResult data={result} />}
          </section>
        )}

        {/* CTA Footer */}
        <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6 text-center">
          <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            Need persistent monitoring & full site history?
          </h2>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            Create an account to monitor uptime 24/7, track latency regressions, and export white-label audit reports.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to={ROUTES.REGISTER}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cyan)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110"
            >
              Get Free Account
            </Link>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--border-bright)]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Result Renderers for All 5 Tools                                          */
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
                {r?.region || 'India Probe'}
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
  const labels = [
    ['Performance', scores.performance],
    ['Accessibility', scores.accessibility],
    ['Best Practices', scores['best-practices'] ?? scores.bestPractices],
    ['SEO', scores.seo],
  ];
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--cyan-dim)] to-transparent p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[var(--cyan)]">
              LIGHTHOUSE SCORECARD
            </span>
            <h2 className="font-['Outfit',sans-serif] mt-0.5 text-xl font-bold">Mobile Experience Snapshot</h2>
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
        {labels.map(([name, value]) => (
          <ScoreCard key={name} name={name} value={value} />
        ))}
      </div>
    </div>
  );
}

function DnsResult({ data }) {
  const records = data?.records || data?.result?.records || data?.result || {};
  const hasRecords = Object.keys(records).length > 0;
  return (
    <div className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[var(--green)]">
            DNS RESOLUTION
          </span>
          <h2 className="font-['Outfit',sans-serif] mt-0.5 text-xl font-bold">Domain DNS Records</h2>
        </div>
        <span className="rounded-full bg-[var(--green-dim)] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--green)]">
          Complete
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {hasRecords ? (
          Object.entries(records).map(([type, values]) => {
            const list = Array.isArray(values) ? values : [values];
            return (
              <div key={type} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <span className="rounded-md bg-[var(--green-dim)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--green)]">
                  {type}
                </span>
                <div className="mt-2 space-y-1">
                  {list.map((val, idx) => (
                    <p key={idx} className="font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] break-all">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </p>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-[var(--muted)]">No standard DNS records returned for this hostname.</p>
        )}
      </div>
    </div>
  );
}

function RedirectsResult({ data }) {
  const chain = data?.chain || data?.result?.chain || [];
  const hops = chain.length > 0 ? chain.length : 1;
  return (
    <div className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[var(--orange)]">
            REDIRECT CHAIN INSPECTION
          </span>
          <h2 className="font-['Outfit',sans-serif] mt-0.5 text-xl font-bold">
            {hops} Hop{hops === 1 ? '' : 's'} to Destination
          </h2>
        </div>
        <span className="rounded-full bg-[var(--green-dim)] px-3 py-1 font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--green)]">
          Complete
        </span>
      </div>
      <div className="mt-5 space-y-2">
        {chain.length > 0 ? (
          chain.map((hop, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${
                  String(hop?.statusCode || hop?.status || '200').startsWith('2')
                    ? 'bg-[var(--green-dim)] text-[var(--green)]'
                    : 'bg-[var(--orange-dim)] text-[var(--orange)]'
                }`}
              >
                {hop?.statusCode || hop?.status || '200 OK'}
              </span>
              <span className="flex-1 truncate font-['JetBrains_Mono',monospace] text-xs text-[var(--text)]">
                {hop?.url || String(hop)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-[var(--muted)]">Direct response, no redirect hops detected.</p>
        )}
      </div>
    </div>
  );
}

function WhoisResult({ data }) {
  return <WhoisResultSection result={data} isDemo={true} />;
}
