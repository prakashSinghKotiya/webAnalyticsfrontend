import { useState, useCallback } from 'react';
import { useAuthState } from '../../context';
import useAdmin from './useAdmin';
import {
  AdminHeader,
  AdminStatsOverview,
  AdminUserFilters,
  AdminUserTable,
  AdminPagination,
  AdminUserDetailsModal,
  AdminConfirmModal,
  AdminAuditLogs,
  AdminSystemHealth,
  AdminMonitorStats,
  AdminIncidentsBanner,
  AdminMonitorFilters,
  AdminMonitorTable,
  AdminMonitorModal,
  AdminMonitorInspectModal,
  AdminMonitorBulkModal,
} from './components';

export default function AdminPanel() {
  const { user: currentUser } = useAuthState();
  const [activeTab, setActiveTab] = useState('monitors'); // 'monitors' | 'users' | 'system' | 'audit'

  const {
    // User Accounts
    users,
    rawUsers,
    totalUsers,
    totalPages,
    page,
    limit,
    loading,
    refreshing,
    error,
    stats,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    planFilter,
    setPlanFilter,
    sortBy,
    sortOrder,
    handleSort,
    setPage,
    setLimit,
    actionInProgress,
    confirmModal,
    promptForceLogout,
    promptDeleteUser,
    closeConfirmModal,
    handleForceLogout,
    handleDeleteUser,
    inspectUser,
    setInspectUser,
    auditLogs,
    handleRefresh,
    handleExportCsv,

    // Uptime Monitors RBAC
    monitors,
    totalMonitors,
    monitorTotalPages,
    monitorPage,
    setMonitorPage,
    monitorLimit,
    setMonitorLimit,
    monitorLoading,
    monitorRefreshing,
    monitorError,
    monitorStats,
    incidents,
    monitorSearchQuery,
    setMonitorSearchQuery,
    monitorStatusFilter,
    setMonitorStatusFilter,
    monitorIntervalFilter,
    setMonitorIntervalFilter,
    selectedMonitorIds,
    monitorActionInProgress,
    monitorModal,
    setMonitorModal,
    monitorInspectModal,
    setMonitorInspectModal,
    monitorBulkModal,
    setMonitorBulkModal,
    handleRefreshMonitors,
    handleTriggerCheck,
    handleTogglePauseMonitor,
    handleCreateMonitorSubmit,
    handleUpdateMonitorSubmit,
    handleDeleteMonitorSubmit,
    handleClearResultsSubmit,
    handleBulkAction,
    handleExportMonitorsCsv,
    handleToggleSelectMonitor,
    handleToggleSelectAllMonitors,
    clearMonitorSelection,
  } = useAdmin(currentUser);

  // Tab navigation definitions
  const tabs = [
    {
      id: 'monitors',
      label: 'Uptime Monitors',
      count: totalMonitors,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      badgeColor: incidents.length > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : undefined,
    },
    {
      id: 'users',
      label: 'Accounts & Users',
      count: stats.total,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'system',
      label: 'System Telemetry',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
    },
    {
      id: 'audit',
      label: 'Activity Audit',
      count: auditLogs.length,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  // Coordinated header actions
  const handleHeaderRefresh = useCallback(() => {
    if (activeTab === 'monitors') {
      handleRefreshMonitors();
    } else {
      handleRefresh();
    }
  }, [activeTab, handleRefreshMonitors, handleRefresh]);

  const handleHeaderExport = useCallback(() => {
    if (activeTab === 'monitors') {
      handleExportMonitorsCsv();
    } else {
      handleExportCsv();
    }
  }, [activeTab, handleExportMonitorsCsv, handleExportCsv]);

  const isRefreshing = activeTab === 'monitors' ? monitorRefreshing : refreshing;
  const activeError = activeTab === 'monitors' ? monitorError : error;

  return (
    <div className="fade-up">
      {/* Admin Control Plane Header */}
      <AdminHeader
        currentUser={currentUser}
        onRefresh={handleHeaderRefresh}
        onExportCsv={handleHeaderExport}
        refreshing={isRefreshing}
        totalUsers={activeTab === 'monitors' ? totalMonitors : totalUsers}
      />

      {/* Error notification banner if any */}
      {activeError && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400"
        >
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{activeError}</span>
          </div>
          <button
            type="button"
            onClick={handleHeaderRefresh}
            className="cursor-pointer font-semibold underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition border ${
                isActive
                  ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-[0_0_12px_var(--cyan-dim)]'
                  : 'border-transparent text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`font-['JetBrains_Mono',monospace] rounded-md px-1.5 py-0.2 text-[10px] ${
                    tab.badgeColor
                      ? tab.badgeColor
                      : isActive
                      ? 'bg-[var(--cyan)]/20 text-[var(--cyan)]'
                      : 'bg-[var(--surface-3)] text-[var(--muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: UPTIME MONITORS CONTROL PLANE ───────────────────────── */}
      {activeTab === 'monitors' && (
        <section>
          {/* Active Outage Incident Alert Banner */}
          <AdminIncidentsBanner
            incidents={incidents}
            onInspectMonitor={(mon) => setMonitorInspectModal({ open: true, monitor: mon })}
            onFilterDown={() => {
              setMonitorStatusFilter('DOWN');
              setMonitorPage(1);
            }}
          />

          {/* Minimalist Key Metric Cards */}
          <AdminMonitorStats
            stats={monitorStats}
            onSelectStatusFilter={(st) => {
              setMonitorStatusFilter(st);
              setMonitorPage(1);
            }}
          />

          {/* Filter Bar, Search, Bulk Action Controls */}
          <AdminMonitorFilters
            searchQuery={monitorSearchQuery}
            onSearchChange={(q) => {
              setMonitorSearchQuery(q);
              setMonitorPage(1);
            }}
            statusFilter={monitorStatusFilter}
            onStatusFilterChange={(s) => {
              setMonitorStatusFilter(s);
              setMonitorPage(1);
            }}
            intervalFilter={monitorIntervalFilter}
            onIntervalFilterChange={(i) => {
              setMonitorIntervalFilter(i);
              setMonitorPage(1);
            }}
            limit={monitorLimit}
            onLimitChange={(l) => {
              setMonitorLimit(l);
              setMonitorPage(1);
            }}
            totalMonitors={totalMonitors}
            displayedCount={monitors.length}
            selectedIds={selectedMonitorIds}
            onClearSelection={clearMonitorSelection}
            onOpenCreateModal={() => setMonitorModal({ open: true, mode: 'create', monitor: null })}
            onOpenBulkAction={(type) => setMonitorBulkModal({ open: true, type, targetMonitor: null })}
            onExportCsv={handleExportMonitorsCsv}
          />

          {/* High-density Monitor Data Table */}
          <AdminMonitorTable
            monitors={monitors}
            loading={monitorLoading}
            selectedIds={selectedMonitorIds}
            onToggleSelect={handleToggleSelectMonitor}
            onToggleSelectAll={handleToggleSelectAllMonitors}
            onInspect={(m) => setMonitorInspectModal({ open: true, monitor: m })}
            onEdit={(m) => setMonitorModal({ open: true, mode: 'edit', monitor: m })}
            onTriggerCheck={handleTriggerCheck}
            onTogglePause={handleTogglePauseMonitor}
            onClearResults={(m) => setMonitorBulkModal({ open: true, type: 'clearResults', targetMonitor: m })}
            onDelete={(m) => setMonitorBulkModal({ open: true, type: 'deleteSingle', targetMonitor: m })}
            actionInProgress={monitorActionInProgress}
            onResetFilters={() => {
              setMonitorSearchQuery('');
              setMonitorStatusFilter('all');
              setMonitorIntervalFilter('all');
              setMonitorPage(1);
            }}
          />

          {/* Server-side Pagination */}
          <AdminPagination
            page={monitorPage}
            totalPages={monitorTotalPages}
            onPageChange={(p) => setMonitorPage(p)}
          />
        </section>
      )}

      {/* ── TAB 2: ACCOUNTS & USERS ────────────────────────────────────── */}
      {activeTab === 'users' && (
        <section>
          {/* Key Metrics Stats Overview */}
          <AdminStatsOverview stats={stats} />

          {/* User Filters & Search */}
          <AdminUserFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            planFilter={planFilter}
            onPlanFilterChange={setPlanFilter}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            totalUsers={totalUsers}
            displayedCount={users.length}
          />

          {/* Accounts Table & Mobile Cards */}
          <AdminUserTable
            users={users}
            currentUser={currentUser}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onInspect={(target) => setInspectUser(target)}
            onPromptForceLogout={promptForceLogout}
            onPromptDeleteUser={promptDeleteUser}
            actionInProgress={actionInProgress}
            onResetFilters={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setPlanFilter('all');
            }}
          />

          {/* Pagination Controls */}
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </section>
      )}

      {/* ── TAB 3: SYSTEM TELEMETRY ───────────────────────────────────── */}
      {activeTab === 'system' && (
        <section>
          <AdminSystemHealth
            stats={stats}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        </section>
      )}

      {/* ── TAB 4: ACTIVITY AUDIT ──────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <section>
          <AdminAuditLogs auditLogs={auditLogs} />
        </section>
      )}

      {/* ── MODALS: USERS ──────────────────────────────────────────────── */}
      {/* User Details Inspector Modal */}
      {inspectUser && (
        <AdminUserDetailsModal
          user={inspectUser}
          currentUser={currentUser}
          onClose={() => setInspectUser(null)}
          onPromptForceLogout={promptForceLogout}
          onPromptDeleteUser={promptDeleteUser}
          actionInProgress={actionInProgress}
        />
      )}

      {/* User Destructive Action Confirmation Modal */}
      {confirmModal.open && (
        <AdminConfirmModal
          open={confirmModal.open}
          type={confirmModal.type}
          user={confirmModal.user}
          onClose={closeConfirmModal}
          onConfirmLogout={handleForceLogout}
          onConfirmDelete={handleDeleteUser}
          isLoading={Boolean(
            confirmModal.user && actionInProgress[confirmModal.user?._id || confirmModal.user?.id]
          )}
        />
      )}

      {/* ── MODALS: MONITORS ──────────────────────────────────────────── */}
      {/* Create / Edit Monitor Modal */}
      {monitorModal.open && (
        <AdminMonitorModal
          open={monitorModal.open}
          mode={monitorModal.mode}
          monitor={monitorModal.monitor}
          users={rawUsers || users}
          onClose={() => setMonitorModal({ open: false, mode: 'create', monitor: null })}
          onSubmit={
            monitorModal.mode === 'create'
              ? handleCreateMonitorSubmit
              : handleUpdateMonitorSubmit
          }
        />
      )}

      {/* Deep Inspection & Live Probe Modal */}
      {monitorInspectModal.open && monitorInspectModal.monitor && (
        <AdminMonitorInspectModal
          monitor={monitorInspectModal.monitor}
          onClose={() => setMonitorInspectModal({ open: false, monitor: null })}
          onTriggerCheck={handleTriggerCheck}
          onClearResults={(m) => {
            setMonitorInspectModal({ open: false, monitor: null });
            setMonitorBulkModal({ open: true, type: 'clearResults', targetMonitor: m });
          }}
          isChecking={Boolean(
            monitorActionInProgress[monitorInspectModal.monitor._id || monitorInspectModal.monitor.id] === 'check'
          )}
        />
      )}

      {/* Bulk & Destructive Monitor Operations Modal */}
      {monitorBulkModal.open && (
        <AdminMonitorBulkModal
          open={monitorBulkModal.open}
          type={monitorBulkModal.type}
          selectedIds={selectedMonitorIds}
          targetMonitor={monitorBulkModal.targetMonitor}
          onClose={() => setMonitorBulkModal({ open: false, type: null, targetMonitor: null })}
          onConfirm={async (params) => {
            if (monitorBulkModal.type === 'deleteSingle' && monitorBulkModal.targetMonitor) {
              await handleDeleteMonitorSubmit(monitorBulkModal.targetMonitor);
            } else if (monitorBulkModal.type === 'clearResults' && monitorBulkModal.targetMonitor) {
              await handleClearResultsSubmit(monitorBulkModal.targetMonitor, params);
            } else {
              await handleBulkAction(monitorBulkModal.type, params);
            }
            setMonitorBulkModal({ open: false, type: null, targetMonitor: null });
          }}
        />
      )}
    </div>
  );
}
