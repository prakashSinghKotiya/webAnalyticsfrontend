import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import useDashboardData from './useDashboardData';
import {
  MonitorSelector,
  MonthlyStatsSection,
  DashboardSkeleton,
  DashboardEmptyState,
  DashboardErrorState,
} from './components';

/**
 * MonthlyAnalysisPage
 *
 * Dedicated monthly monitor analytics page.
 * Displays persistent month-over-month rollups, latency & TTFB benchmarks,
 * outage incident tracking, and historical availability strictly scoped to
 * the selected monitor.
 */
export default function MonthlyAnalysisPage() {
  const {
    monitors,
    selectedMonitor,
    selectedMonitorId,
    setSelectedMonitorId,
    loading,
    error,
    handleRefresh,
    summaryStats,
    monthlyStats,
    monthlyLoading,
    monthlyRefreshing,
    monthlyError,
    handleRefreshMonthly,
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

  // Synthesize current month fallback if the monitor has checks but no finalized DB rollup yet
  const fallbackMonth = useMemo(() => {
    if (monthlyStats?.stats?.length > 0 || !summaryStats || summaryStats.totalChecks === 0) return null;
    const now = new Date();
    return {
      id: 'synth-current',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      totalChecks: summaryStats.totalChecks,
      upChecks: summaryStats.upCount,
      degradedChecks: summaryStats.slowCount,
      downChecks: summaryStats.downCount,
      uptimePercent: summaryStats.uptimePercentNumber,
      avgResponseTime: summaryStats.avgResponseTime,
      incidentCount: summaryStats.downIncidents,
      minResponseTime: summaryStats.minResponseTime,
      maxResponseTime: summaryStats.maxResponseTime,
      avgTtfb: summaryStats.avgTtfb || null,
      avgDns: summaryStats.avgDns || null,
      isFinal: false,
    };
  }, [monthlyStats?.stats?.length, summaryStats]);

  // Initial loading state
  if (loading && !selectedMonitor) {
    return (
      <section className="fade-up space-y-6">
        <DashboardSkeleton />
      </section>
    );
  }

  // Monitor loading error
  if (error && !selectedMonitor) {
    return (
      <section className="fade-up space-y-6">
        <DashboardErrorState message={error} onRetry={handleRefresh} />
      </section>
    );
  }

  // Empty state (user has zero monitors)
  if (monitors.length === 0) {
    return (
      <section className="fade-up space-y-6">
        <DashboardEmptyState hasMonitors={false} />
      </section>
    );
  }

  const backLinkTarget = selectedMonitorId
    ? `${ROUTES.DASHBOARD}?monitorId=${encodeURIComponent(selectedMonitorId)}`
    : ROUTES.DASHBOARD;

  return (
    <section className="fade-up space-y-6">
      {/* ── Breadcrumb & Back Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          to={backLinkTarget}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--cyan)] transition shadow-xs"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Dashboard</span>
        </Link>

        {/* Quick monitor management shortcut */}
        <Link
          to={ROUTES.UPTIME}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-2)] hover:text-[var(--cyan)] hover:underline"
        >
          Manage Monitors →
        </Link>
      </div>

      {/* ── Page Header & Monitor Switcher ───────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              Monthly Monitor Analysis
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              {hostDisplay}
            </span>
            {selectedMonitor?.status && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  selectedMonitor.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}
              >
                {selectedMonitor.status}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[var(--muted-2)]">
            Historical month-over-month performance, availability rollups, and outage tracking for{' '}
            <span className="font-mono text-[var(--text)]">{monitorUrl || hostDisplay}</span>.
          </p>
        </div>

        {/* Action Controls: Monitor Selector Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {monitors.length > 1 && (
            <MonitorSelector
              monitors={monitors}
              selectedMonitorId={selectedMonitorId}
              onSelectMonitor={setSelectedMonitorId}
              disabled={loading || monthlyRefreshing}
            />
          )}
        </div>
      </div>

      {/* ── Sub-navigation Tab Bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <Link
          to={backLinkTarget}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-1.5 text-xs font-medium text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)] transition"
        >
          <span>← Live Uptime & Telemetry</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/10 px-3.5 py-1.5 text-xs font-bold text-purple-400 border border-purple-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          Monthly Monitor Analysis
        </span>
      </div>

      {/* ── Monthly Availability & Comparison Section ────────────────────── */}
      <MonthlyStatsSection
        monthlyData={monthlyStats}
        fallbackMonth={fallbackMonth}
        loading={monthlyLoading}
        refreshing={monthlyRefreshing}
        error={monthlyError}
        onRefresh={handleRefreshMonthly}
      />
    </section>
  );
}
