import { useCallback, useMemo, useRef } from 'react';
import useUptime from './useUptime';
import {
  UptimeInputSection,
  UptimeResultSection,
  UptimeAllMonitorsSection,
  UptimeMonitorResultsSection,
} from './components';

/**
 * UptimePage — 24/7 Availability & Response Time Telemetry.
 *
 * Visual sections:
 *  1. Input Section: Target URL configuration and interval frequency selector.
 *  2. Real-time Telemetry Section (Image 1):
 *     - Live status, hostname, host & location details, status pill & HTTP status pill.
 *     - Summary strip ("Responded in 1.36 s (slow) and redirects to another address...").
 *     - SPEED vs SERVER two-column metrics grid.
 *     - "Where the time went" multi-segmented timeline bar & exact legend breakdown.
 *  3. Check History Section (Image 2):
 *     - Check history title with domain and frequency.
 *     - Filter pills: All checks, Up, Slow, Down.
 *     - List of individual probe results with relative time, status dot/label, HTTP code, and latency.
 *  4. All Monitors / History Section:
 *     - Full list of all registered monitors with pause/resume, edit, delete, and pagination.
 */
export default function UptimePage() {
  const {
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
  } = useUptime();

  const realTimeSectionRef = useRef(null);

  const handleCreateSubmit = useCallback(
    (url, interval) => {
      addMonitor(url, interval);
    },
    [addMonitor]
  );

  const handleSelectMonitor = useCallback(
    (monitor) => {
      selectMonitor(monitor);
      // Smoothly scroll up to the telemetry view
      setTimeout(() => {
        if (realTimeSectionRef.current) {
          realTimeSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);
    },
    [selectMonitor]
  );

  const activeMonitor = useMemo(
    () =>
      selectedMonitor ||
      monitors.find((m) => (m._id || m.id) === activeMonitorId) ||
      monitors[0] ||
      null,
    [selectedMonitor, monitors, activeMonitorId]
  );

  const hasMonitors = monitors.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-16">
      {/* ── Section 1: Input / Setup ───────────────────────────────────── */}
      <UptimeInputSection
        isCreating={creating}
        onSubmit={handleCreateSubmit}
      />

      {/* ── Empty State: When no monitors have been deployed yet ───────── */}
      {!loading && !hasMonitors && (
        <section className="fade-up rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-10 sm:p-14 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h2 className="mt-4 font-['Outfit',sans-serif] text-lg sm:text-xl font-bold tracking-tight text-[var(--text)]">
            No monitor available
          </h2>
          <p className="mt-1.5 max-w-md mx-auto text-xs sm:text-sm text-[var(--muted-2)]">
            Enter a target URL or endpoint above and deploy your first monitor to start tracking real-time availability, DNS speed, and server uptime.
          </p>
        </section>
      )}

      {/* ── Loading Skeleton while initial monitors fetch ─────────────── */}
      {loading && !hasMonitors && (
        <div className="rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-8 text-center">
          <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-[var(--cyan)] border-t-transparent" />
          <p className="mt-3 text-xs text-[var(--muted-2)]">Syncing uptime monitors from server…</p>
        </div>
      )}

      {/* ── Monitor View (Only active when monitors exist) ─────────────── */}
      {hasMonitors && (
        <>
          {/* Active Monitor Switcher (Quick Pill selector if > 1 monitor) */}
          {monitors.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="flex-none text-xs font-medium text-[var(--muted-2)]">
                Active monitor:
              </span>
              {monitors.map((m) => {
                const mId = m._id || m.id;
                const isCurr = mId === (activeMonitor?._id || activeMonitor?.id);
                let displayHost = m.url;
                try {
                  displayHost = new URL(m.url).hostname;
                } catch {
                  // Ignore parse error
                }

                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => handleSelectMonitor(m)}
                    className={`flex-none cursor-pointer rounded-full px-3.5 py-1 text-xs font-medium transition ${
                      isCurr
                        ? 'bg-[#064e3b] dark:bg-[#065f46] text-white shadow-xs'
                        : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    {displayHost}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Section 2: Real-time Telemetry / Latest Result (Image 1) ─ */}
          <div ref={realTimeSectionRef} className="scroll-mt-6">
            <UptimeResultSection
              result={latestResult}
              activeMonitor={activeMonitor}
            />
          </div>

          {/* ── Section 3: Check History Section (Image 2) ────────────── */}
          <UptimeMonitorResultsSection
            monitor={activeMonitor}
            results={monitorResults}
            loading={resultsLoading}
            error={resultsError}
            pagination={resultsPagination}
            statusFilter={resultsStatusFilter}
            onPageChange={changeResultsPage}
            onStatusFilterChange={changeResultsStatusFilter}
            onRefresh={refreshSelectedMonitorResults}
          />

          {/* ── Section 4: All Monitors / History with Pagination ─────── */}
          <UptimeAllMonitorsSection
            monitors={monitors}
            loading={loading}
            error={error}
            activeId={activeMonitor?._id || activeMonitor?.id || activeMonitorId}
            actionInProgress={actionInProgress}
            onRefresh={fetchMonitors}
            onSelect={handleSelectMonitor}
            onTogglePause={togglePause}
            onDelete={removeMonitor}
            onUpdate={editMonitor}
          />
        </>
      )}
    </div>
  );
}
