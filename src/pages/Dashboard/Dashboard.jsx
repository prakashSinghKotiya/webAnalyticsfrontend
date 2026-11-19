import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import useDashboardData from './useDashboardData';
import {
  PerformanceStatCards,
  ReliabilitySnapshotCard,
  ResponseTimeChart,
  UptimeTimeline,
  MonitorSelector,
  TimeRangeSelector,
  DashboardSkeleton,
  DashboardEmptyState,
  DashboardErrorState,
} from './components';
import { PerformanceChart } from '../../components';

/**
 * Dashboard Page
 *
 * Graphical, statistical uptime monitoring dashboard.
 * Telemetry matching Hosting Reviews with live WebSocket updates and operational monitoring.
 */
export default function Dashboard() {
  const {
    monitors,
    selectedMonitor,
    selectedMonitorId,
    setSelectedMonitorId,
    timeRange,
    setTimeRange,
    autoRefresh,
    setAutoRefresh,
    loading,
    refreshing,
    error,
    handleRefresh,
    socketConnected,
    filteredChecks,
    summaryStats,
    responseTimeSeries,
    timelineBlocks,
  } = useDashboardData();

  const monitorUrl = selectedMonitor?.url;
  const hostDisplay = useMemo(() => {
    if (!monitorUrl) return 'Selected Host';
    try {
      return new URL(monitorUrl).hostname;
    } catch {
      return monitorUrl;
    }
  }, [monitorUrl]);

  const summaryLegend = useMemo(() => {
    const siteCount = `${monitors.length || 1} website${(monitors.length || 1) > 1 ? 's' : ''}`;
    const checkCount = `${summaryStats?.totalChecks || 0} checks`;
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `Recorded uptime • ${siteCount} • ${checkCount} • ${dateStr}`;
  }, [monitors.length, summaryStats?.totalChecks]);

  // If loading initially with no monitor yet
  if (loading && !selectedMonitor) {
    return (
      <section className="fade-up space-y-6">
        <DashboardSkeleton />
      </section>
    );
  }

  // Error State
  if (error && !selectedMonitor) {
    return (
      <section className="fade-up space-y-6">
        <DashboardErrorState message={error} onRetry={handleRefresh} />
      </section>
    );
  }

  // Empty State: User has no monitors at all
  if (monitors.length === 0) {
    return (
      <section className="fade-up space-y-6">
        <DashboardEmptyState hasMonitors={false} />
      </section>
    );
  }

  const monthlyAnalysisUrl = selectedMonitorId
    ? `${ROUTES.DASHBOARD_MONTHLY_ANALYSIS}?monitorId=${encodeURIComponent(selectedMonitorId)}`
    : ROUTES.DASHBOARD_MONTHLY_ANALYSIS;

  return (
    <section className="fade-up space-y-6">
      {/* ── Top Header Controls Bar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              Uptime Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {hostDisplay}
            </span>
            {socketConnected && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[var(--muted-2)]">
            Live telemetry, availability statistics, and response time metrics.
          </p>
        </div>

        {/* Action Controls: Monitor Select, Time Range, Auto-refresh, Manual Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Monitor Dropdown (if multiple monitors) */}
          {monitors.length > 1 && (
            <MonitorSelector
              monitors={monitors}
              selectedMonitorId={selectedMonitorId}
              onSelectMonitor={setSelectedMonitorId}
              disabled={loading || refreshing}
            />
          )}

          {/* Time Range Pills: 24h, 7d, 30d */}
          <TimeRangeSelector
            currentRange={timeRange}
            onChange={setTimeRange}
            disabled={loading}
          />

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition shadow-xs ${
              autoRefresh
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-[var(--border-mid)] bg-[var(--surface-2)] text-[var(--muted-2)] hover:text-[var(--text)]'
            }`}
            title={autoRefresh ? 'Auto-refresh active (every 60s)' : 'Auto-refresh paused'}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span>Auto (60s)</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--border-bright)] hover:text-[var(--cyan)] transition disabled:opacity-50 shadow-xs"
            title="Refresh statistics now"
          >
            <svg
              className={`h-3.5 w-3.5 ${refreshing || loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>

          {/* Prominent Link to Dedicated Monthly Analysis Page */}
          <Link
            to={monthlyAnalysisUrl}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)] px-3.5 py-1.5 text-xs font-bold text-[var(--cyan)] hover:brightness-125 transition shadow-xs"
            title="View in-depth monthly analytics and month-over-month performance"
          >
            <span>Monthly Analysis</span>
            <span aria-hidden="true">→</span>
          </Link>

          {/* Shortcut to full Uptime Monitor page */}
          <Link
            to={ROUTES.UPTIME}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-2)] hover:text-[var(--cyan)] hover:underline ml-1"
          >
            Manage Monitors →
          </Link>
        </div>
      </div>

      {/* ── Sub-navigation Tab Bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cyan-dim)] px-3.5 py-1.5 text-xs font-bold text-[var(--cyan)] border border-[var(--cyan)]/30">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
          Live Uptime & Telemetry
        </span>
        <Link
          to={monthlyAnalysisUrl}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-1.5 text-xs font-medium text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)] transition"
        >
          <span>Monthly Monitor Analysis</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Loading Skeletons when fetching checks */}
      {loading ? (
        <DashboardSkeleton />
      ) : filteredChecks.length === 0 ? (
        <DashboardEmptyState
          hasMonitors={true}
          monitorUrl={selectedMonitor?.url}
          onRefresh={handleRefresh}
        />
      ) : (
        <>
          {/* ── Hosting Review Style KPI Stat Cards (4 Cards) ────────────────── */}
          <PerformanceStatCards stats={summaryStats} monitorsCount={monitors.length || 1} />

          {/* ── Daily Uptime Consistency Chart & Reliability Snapshot ─────────── */}
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            {/* Daily Uptime Consistency Segmented Chart (2 cols) */}
            <div className="lg:col-span-2">
              <PerformanceChart
                daily={summaryStats.daily}
                providerName={hostDisplay}
                title="Daily uptime consistency"
                subtitle={`${summaryStats.totalChecks} checks. ${summaryStats.downCount} interruptions.`}
                summaryLegend={summaryLegend}
              />
            </div>

            {/* Reliability Snapshot Card (1 col) */}
            <div className="lg:col-span-1">
              <ReliabilitySnapshotCard stats={summaryStats} />
            </div>
          </div>

          {/* ── Status Page Timeline Strip ─────────────────────────────────── */}
          <UptimeTimeline
            blocks={timelineBlocks}
            rangeKey={timeRange}
            uptimePercent={summaryStats.uptimePercent}
          />

          {/* ── Response Time Line/Area Chart (Gate 3 Real-time Stream) ────── */}
          <ResponseTimeChart
            data={responseTimeSeries}
            avgResponseTime={summaryStats.avgResponseTime}
            rangeKey={timeRange}
            socketConnected={socketConnected}
          />
        </>
      )}
    </section>
  );
}
