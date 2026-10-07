import { useCallback, useState } from 'react';
import { useSocket } from '../../context';
import {
  LighthouseAuditsAndIssues,
  LighthouseCoreWebVitals,
  LighthouseEmptyState,
  LighthouseForm,
  LighthouseHistoryPanel,
  LighthouseLabMetrics,
  LighthouseScanningState,
  LighthouseScoresOverview,
  LighthouseScreenshotPreview,
} from './components';
import useLighthouse from './useLighthouse';

export default function LighthousePage() {
  const { isConnected } = useSocket();
  const {
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
    isAuditing,
    runAudit,
    selectEntry,
    handlePageChange,
    handleFilterChange,
    handleRefresh,
  } = useLighthouse();

  const [url, setUrl] = useState('');

  const handleSubmit = useCallback(() => {
    runAudit(url, strategy);
  }, [runAudit, strategy, url]);

  const handleSelectHistory = useCallback(
    (entry) => {
      setUrl(entry.targetUrl || entry.url || '');
      if (entry.strategy) {
        setStrategy(entry.strategy);
      }
      selectEntry(entry);
    },
    [selectEntry, setStrategy],
  );

  const handleReRun = useCallback(() => {
    const target = report?.targetUrl || report?.url || url;
    if (target) {
      runAudit(target, report?.strategy || strategy);
    }
  }, [report, runAudit, strategy, url]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* ── Page Header & Form Card ────────────────────────────────────────── */}
      <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <div>
              <h1 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)]">
                Lighthouse Audit Studio
              </h1>
              <p className="text-xs text-[var(--muted-2)]">
                Real-time Core Web Vitals, Lab Performance, SEO, and Accessibility Diagnostics
              </p>
            </div>
          </div>

          {/* Engine & Socket Status Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-2)]">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-[var(--green)]' : 'bg-[var(--orange)] animate-pulse'
                }`}
              />
              <span className="text-[11px] font-medium">{isConnected ? 'Live Engine' : 'Reconnecting'}</span>
            </span>

            <span className="rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-3 py-1 text-[11px] font-semibold text-[var(--cyan)]">
              PageSpeed v5
            </span>
          </div>
        </header>

        <LighthouseForm
          url={url}
          onUrlChange={setUrl}
          strategy={strategy}
          onStrategyChange={setStrategy}
          isAuditing={isAuditing}
          onSubmit={handleSubmit}
        />
      </section>

      {/* ── Active Scanning State ──────────────────────────────────────────── */}
      {isAuditing && (
        <LighthouseScanningState targetUrl={url} auditStep={auditStep} />
      )}

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {!isAuditing && status === 'error' && error && (
        <div
          role="alert"
          className="fade-up flex items-start gap-3 rounded-2xl border border-[var(--red)]/30 bg-[var(--red)]/10 p-5 text-sm"
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[var(--red)] font-bold text-black">
            !
          </span>
          <div className="flex-1">
            <h3 className="font-['Outfit',sans-serif] font-bold text-[var(--text)]">
              Audit Failed
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-2)]">{error}</p>
            <button
              type="button"
              onClick={handleSubmit}
              className="mt-3 cursor-pointer rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-3)]"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ── Completed Audit Results (Displays Latest or Selected Report) ──── */}
      {!isAuditing && report && (
        <div className="flex flex-col gap-6">
          {/* 4 Pillars Circular Score Gauges */}
          <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
                  Audit Scorecard
                </h2>
                <p className="truncate font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
                  {report.finalUrl || report.url}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--text-2)]">
                  {report.strategy || 'mobile'} Device
                </span>
                <span className="rounded-md bg-[var(--surface-2)] px-2.5 py-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--cyan)]">
                  v{report.lighthouseVersion || '12'}
                </span>
              </div>
            </header>

            <LighthouseScoresOverview scores={report.scores} />
          </section>

          {/* Core Web Vitals (Field Real User CrUX Data) */}
          <LighthouseCoreWebVitals coreWebVitals={report.coreWebVitals} />

          {/* Lab Diagnostic Metrics */}
          <LighthouseLabMetrics labMetrics={report.labMetrics} />

          {/* Opportunities & Issues */}
          <LighthouseAuditsAndIssues issues={report.issues} />

          {/* Viewport Screenshot & Audit Environment Metadata */}
          <LighthouseScreenshotPreview report={report} onReRun={handleReRun} />
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────────────────── */}
      {!isAuditing && !report && status !== 'error' && !historyLoading && (
        <LighthouseEmptyState />
      )}

      {/* ── History Panel (Paginated MongoDB Records) ──────────────────────── */}
      <LighthouseHistoryPanel
        history={history}
        isLoading={historyLoading}
        pagination={historyPagination}
        activeId={report?.id || report?.dbId}
        filter={historyFilter}
        onSelect={handleSelectHistory}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
