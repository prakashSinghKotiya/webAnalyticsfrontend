import { useCallback, useMemo, useRef } from 'react';
import useUptime from './useUptime';
import {
  UptimeInputSection,
  UptimeResultSection,
  UptimeAllMonitorsSection,
  UptimeMonitorResultsSection,
} from './components';

/**
 * UptimePage — Production-ready 24/7 Availability & Response Time Telemetry.
 *
 * Architecture & 4 Core Sections:
 *  1. Input Section:
 *     - Target URL configuration and interval frequency selector (1m, 5m, 10m, 30m, 1h).
 *     - Memoized to keep form interactions isolated from expensive list updates.
 *  2. Telemetry / Result Section:
 *     - Real-time result output from background BullMQ workers + WebSockets (`uptimeCompleted`).
 *     - Status badges (UP / DEGRADED / DOWN), latency decomposition (DNS, TTFB, Total).
 *  3. All Monitors / History Section:
 *     - Fresh database fetch from backend (`GET /uptime/monitors`), never stored in localStorage.
 *     - Client-side pagination (6 / 12 / 24 per page), search filter, active/paused status filter.
 *     - Complete lifecycle controls: Pause, Resume, Edit URL/Interval, Delete.
 *  4. Running Monitor Inspection & Recent Probe Results Section:
 *     - Triggered when user clicks on a running monitor from the list.
 *     - Fetches latest 5-6 results directly from backend (`GET /uptime/monitor/:id/results`) using server-side pagination.
 *     - Provides probe filtering, detailed latency breakdown, and live socket sync.
 *     - Strict zero extra frontend storage.
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
    clearSelectedMonitor,
  } = useUptime();

  const inspectionSectionRef = useRef(null);

  const handleCreateSubmit = useCallback(
    (url, interval) => {
      addMonitor(url, interval);
    },
    [addMonitor]
  );

  const handleSelectMonitor = useCallback(
    (monitor) => {
      selectMonitor(monitor);
      // Smoothly scroll down to the inspection section
      setTimeout(() => {
        if (inspectionSectionRef.current) {
          inspectionSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 150);
    },
    [selectMonitor]
  );

  const activeMonitor = useMemo(
    () => selectedMonitor || monitors.find((m) => (m._id || m.id) === activeMonitorId) || monitors[0] || null,
    [selectedMonitor, monitors, activeMonitorId]
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-12">
      {/* ── Section 1: Input / Setup ───────────────────────────────────── */}
      <UptimeInputSection
        isCreating={creating}
        onSubmit={handleCreateSubmit}
      />

      {/* ── Section 2: Real-time Telemetry / Latest Result ─────────────── */}
      <UptimeResultSection
        result={latestResult}
        activeMonitor={activeMonitor}
      />

      {/* ── Section 3: All Monitors / History with Pagination ───────────── */}
      <UptimeAllMonitorsSection
        monitors={monitors}
        loading={loading}
        error={error}
        activeId={activeMonitorId}
        actionInProgress={actionInProgress}
        onRefresh={fetchMonitors}
        onSelect={handleSelectMonitor}
        onTogglePause={togglePause}
        onDelete={removeMonitor}
        onUpdate={editMonitor}
      />

      {/* ── Section 4: Running Monitor Inspection & Recent Results ──────── */}
      {selectedMonitor && (
        <div ref={inspectionSectionRef} className="scroll-mt-8">
          <UptimeMonitorResultsSection
            monitor={selectedMonitor}
            results={monitorResults}
            loading={resultsLoading}
            error={resultsError}
            pagination={resultsPagination}
            statusFilter={resultsStatusFilter}
            onPageChange={changeResultsPage}
            onStatusFilterChange={changeResultsStatusFilter}
            onRefresh={refreshSelectedMonitorResults}
            onClose={clearSelectedMonitor}
          />
        </div>
      )}
    </div>
  );
}
