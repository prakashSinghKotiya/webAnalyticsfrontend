import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getAllUsers,
  forceLogoutUser as apiForceLogout,
  deleteUser as apiDeleteUser,
  getAdminMonitorStats,
  getAdminMonitors,
  getAdminMonitorIncidents,
  adminCreateMonitor as apiAdminCreateMonitor,
  adminUpdateMonitor as apiAdminUpdateMonitor,
  adminTriggerCheck as apiAdminTriggerCheck,
  adminPauseMonitor as apiAdminPauseMonitor,
  adminResumeMonitor as apiAdminResumeMonitor,
  adminDeleteMonitor as apiAdminDeleteMonitor,
  adminBulkPauseMonitors as apiAdminBulkPauseMonitors,
  adminBulkResumeMonitors as apiAdminBulkResumeMonitors,
  adminBulkUpdateInterval as apiAdminBulkUpdateInterval,
  adminBulkDeleteMonitors as apiAdminBulkDeleteMonitors,
  adminClearMonitorResults as apiAdminClearMonitorResults,
  getAdminExportMonitors,
  subscribeToEvents,
} from '../../api';
import { useToast } from '../../context';
import {
  getUserId,
  exportUsersToCsv,
  exportMonitorsToCsv,
} from './admin.utils';

/**
 * Defensive parser for diverse backend response formats for users.
 */
function extractUsersPayload(response, page, limit) {
  let list = [];
  let total = 0;
  let totalPages = 1;

  if (Array.isArray(response)) {
    list = response;
    total = response.length;
    totalPages = Math.max(1, Math.ceil(total / limit));
  } else if (response && typeof response === 'object') {
    if (Array.isArray(response.users)) {
      list = response.users;
    } else if (Array.isArray(response.data?.users)) {
      list = response.data.users;
    } else if (Array.isArray(response.data)) {
      list = response.data;
    }

    total =
      response.totalUsers ??
      response.total ??
      response.count ??
      response.pagination?.total ??
      list.length;

    totalPages =
      response.totalPages ??
      response.pages ??
      response.pagination?.totalPages ??
      Math.max(1, Math.ceil(total / limit));
  }

  return { list, total, totalPages };
}

/**
 * Defensive parser for monitors response payload.
 */
function extractMonitorsPayload(response, page, limit) {
  let list = [];
  let total = 0;
  let totalPages = 1;

  if (Array.isArray(response)) {
    list = response;
    total = response.length;
    totalPages = Math.max(1, Math.ceil(total / limit));
  } else if (response && typeof response === 'object') {
    if (Array.isArray(response.data)) {
      list = response.data;
    } else if (Array.isArray(response.monitors)) {
      list = response.monitors;
    }

    total =
      response.pagination?.total ??
      response.total ??
      response.count ??
      list.length;

    totalPages =
      response.pagination?.totalPages ??
      response.totalPages ??
      Math.max(1, Math.ceil(total / limit));
  }

  return { list, total, totalPages };
}

export default function useAdmin(currentUser) {
  const toast = useToast();
  const mountedRef = useRef(true);

  // ==========================================
  // USER ACCOUNTS STATE
  // ==========================================
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [actionInProgress, setActionInProgress] = useState({});
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, user: null });
  const [inspectUser, setInspectUser] = useState(null);

  // ==========================================
  // UPTIME MONITORS STATE
  // ==========================================
  const [monitors, setMonitors] = useState([]);
  const [totalMonitors, setTotalMonitors] = useState(0);
  const [monitorTotalPages, setMonitorTotalPages] = useState(1);
  const [monitorPage, setMonitorPage] = useState(1);
  const [monitorLimit, setMonitorLimit] = useState(10);
  const [monitorLoading, setMonitorLoading] = useState(true);
  const [monitorRefreshing, setMonitorRefreshing] = useState(false);
  const [monitorError, setMonitorError] = useState(null);

  const [monitorStats, setMonitorStats] = useState(null);
  const [incidents, setIncidents] = useState([]);

  const [monitorSearchQuery, setMonitorSearchQuery] = useState('');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState('all');
  const [monitorIntervalFilter, setMonitorIntervalFilter] = useState('all');

  const [selectedMonitorIds, setSelectedMonitorIds] = useState([]);
  const [monitorActionInProgress, setMonitorActionInProgress] = useState({});

  // Modals for monitors
  const [monitorModal, setMonitorModal] = useState({ open: false, mode: 'create', monitor: null });
  const [monitorInspectModal, setMonitorInspectModal] = useState({ open: false, monitor: null });
  const [monitorBulkModal, setMonitorBulkModal] = useState({ open: false, type: null, targetMonitor: null });

  // ==========================================
  // SESSION AUDIT LOGS
  // ==========================================
  const [auditLogs, setAuditLogs] = useState(() => [
    {
      id: 'init-1',
      action: 'ADMIN_SESSION_STARTED',
      description: 'Admin Control Plane & Monitor Telemetry initialized',
      timestamp: new Date().toISOString(),
      status: 'info',
    },
  ]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const appendAuditLog = useCallback((action, description, status = 'success') => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      action,
      description,
      timestamp: new Date().toISOString(),
      status,
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  // ==========================================
  // USERS DATA FETCHING
  // ==========================================
  const fetchUsers = useCallback(
    async (currentPage = page, currentLimit = limit, currentSearch = searchQuery) => {
      try {
        setError(null);
        const data = await getAllUsers(currentPage, currentLimit, currentSearch);
        if (!mountedRef.current) return;

        const { list, total, totalPages: pages } = extractUsersPayload(data, currentPage, currentLimit);
        setUsers(list);
        setTotalUsers(total);
        setTotalPages(pages);
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err?.message || err?.error || 'Failed to fetch user accounts';
        setError(msg);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, limit, searchQuery]
  );

  useEffect(() => {
    fetchUsers(page, limit, searchQuery);
  }, [page, limit, fetchUsers, searchQuery]);

  // ==========================================
  // MONITORS DATA FETCHING
  // ==========================================
  const fetchMonitorStatsData = useCallback(async () => {
    try {
      const res = await getAdminMonitorStats();
      if (!mountedRef.current) return;
      if (res?.data) {
        setMonitorStats(res.data);
      }
    } catch (err) {
      console.warn('[useAdmin] Error fetching monitor stats:', err.message);
    }
  }, []);

  const fetchIncidentsData = useCallback(async () => {
    try {
      const res = await getAdminMonitorIncidents();
      if (!mountedRef.current) return;
      if (res?.incidents) {
        setIncidents(res.incidents);
      }
    } catch (err) {
      console.warn('[useAdmin] Error fetching incidents:', err.message);
    }
  }, []);

  const fetchMonitorsData = useCallback(
    async (
      currentPage = monitorPage,
      currentLimit = monitorLimit,
      currentStatus = monitorStatusFilter,
      currentInterval = monitorIntervalFilter,
      currentSearch = monitorSearchQuery
    ) => {
      try {
        setMonitorError(null);
        const res = await getAdminMonitors({
          page: currentPage,
          limit: currentLimit,
          status: currentStatus,
          interval: currentInterval,
          search: currentSearch,
        });
        if (!mountedRef.current) return;

        const { list, total, totalPages: pages } = extractMonitorsPayload(res, currentPage, currentLimit);
        setMonitors(list);
        setTotalMonitors(total);
        setMonitorTotalPages(pages);
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err?.message || err?.error || 'Failed to fetch uptime monitors';
        setMonitorError(msg);
      } finally {
        if (mountedRef.current) {
          setMonitorLoading(false);
          setMonitorRefreshing(false);
        }
      }
    },
    [monitorPage, monitorLimit, monitorStatusFilter, monitorIntervalFilter, monitorSearchQuery]
  );

  useEffect(() => {
    fetchMonitorsData(monitorPage, monitorLimit, monitorStatusFilter, monitorIntervalFilter, monitorSearchQuery);
    fetchMonitorStatsData();
    fetchIncidentsData();
  }, [
    monitorPage,
    monitorLimit,
    monitorStatusFilter,
    monitorIntervalFilter,
    monitorSearchQuery,
    fetchMonitorsData,
    fetchMonitorStatsData,
    fetchIncidentsData,
  ]);

  // ==========================================
  // SOCKET.IO REAL-TIME TELEMETRY LISTENER
  // ==========================================
  useEffect(() => {
    const handleProbeResult = (payload) => {
      if (!payload || !payload.monitorId) return;
      const targetId = String(payload.monitorId);

      setMonitors((prev) =>
        prev.map((mon) => {
          if (String(mon._id || mon.id) === targetId) {
            return {
              ...mon,
              lastResult: payload.result,
              lastCheckedAt: payload.checkedAt || new Date().toISOString(),
            };
          }
          return mon;
        })
      );

      // Refresh incidents if failing
      if (payload.status === 'down' || payload.result?.status === 'DOWN') {
        fetchIncidentsData();
      }
    };

    const handleStatusChange = (payload) => {
      if (!payload || !payload.monitorId) return;
      const targetId = String(payload.monitorId);

      setMonitors((prev) =>
        prev.map((mon) => {
          if (String(mon._id || mon.id) === targetId) {
            return {
              ...mon,
              ...(payload.status ? { status: payload.status } : {}),
              ...(payload.interval ? { interval: payload.interval } : {}),
              ...(payload.url ? { url: payload.url } : {}),
            };
          }
          return mon;
        })
      );
      fetchMonitorStatsData();
    };

    const handleDeleted = (payload) => {
      if (!payload || !payload.monitorId) return;
      const targetId = String(payload.monitorId);
      setMonitors((prev) => prev.filter((mon) => String(mon._id || mon.id) !== targetId));
      setSelectedMonitorIds((prev) => prev.filter((id) => id !== targetId));
      fetchMonitorStatsData();
    };

    const unsubscribe = subscribeToEvents({
      'uptime:result': handleProbeResult,
      'uptimeCompleted': handleProbeResult,
      'monitor:statusChange': handleStatusChange,
      'monitor:deleted': handleDeleted,
    });

    return () => {
      unsubscribe();
    };
  }, [fetchIncidentsData, fetchMonitorStatsData]);

  // ==========================================
  // USERS DERIVED STATS & FILTERING
  // ==========================================
  const processedUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && (u.role || 'User').toLowerCase() !== roleFilter.toLowerCase()) {
        return false;
      }
      if (planFilter !== 'all' && (u.plan || 'free').toLowerCase() !== planFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [users, roleFilter, planFilter]);

  const stats = useMemo(() => {
    let adminsCount = 0;
    let proCount = 0;
    users.forEach((u) => {
      const r = (u.role || '').toLowerCase();
      if (r === 'admin' || r === 'superadmin') adminsCount++;
      const p = (u.plan || '').toLowerCase();
      if (p === 'pro' || p === 'enterprise') proCount++;
    });

    return {
      total: totalUsers,
      displayed: processedUsers.length,
      admins: adminsCount,
      proUsers: proCount,
      freeUsers: Math.max(0, processedUsers.length - proCount),
    };
  }, [totalUsers, processedUsers, users]);

  // ==========================================
  // USER ACTIONS
  // ==========================================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers(page, limit, searchQuery);
    toast.success('Accounts list updated');
  }, [fetchUsers, page, limit, searchQuery, toast]);

  const handleExportCsv = useCallback(() => {
    if (!processedUsers.length) {
      toast.info('No users available to export.');
      return;
    }
    const success = exportUsersToCsv(processedUsers, `webpulse-users-${Date.now()}.csv`);
    if (success) {
      toast.success(`Exported ${processedUsers.length} users to CSV.`);
      appendAuditLog('EXPORT_CSV', `Exported ${processedUsers.length} user records.`);
    }
  }, [processedUsers, appendAuditLog, toast]);

  const promptForceLogout = useCallback((user) => {
    setConfirmModal({ open: true, type: 'logout', user });
  }, []);

  const promptDeleteUser = useCallback((user) => {
    setConfirmModal({ open: true, type: 'delete', user });
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal({ open: false, type: null, user: null });
  }, []);

  const handleForceLogout = useCallback(
    async (targetUser) => {
      const targetId = getUserId(targetUser);
      if (!targetId) return;

      setActionInProgress((prev) => ({ ...prev, [targetId]: 'logout' }));
      closeConfirmModal();

      try {
        await apiForceLogout(targetId);
        toast.success(`Active sessions for ${targetUser.name || targetUser.email} terminated.`);
        appendAuditLog('FORCE_LOGOUT', `Terminated sessions for ${targetUser.name || targetUser.email} (${targetId})`);
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to force logout user';
        toast.error(msg);
        appendAuditLog('FORCE_LOGOUT_FAILED', `Failed to logout ${targetUser.name}: ${msg}`, 'error');
      } finally {
        setActionInProgress((prev) => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
      }
    },
    [closeConfirmModal, appendAuditLog, toast]
  );

  const handleDeleteUser = useCallback(
    async (targetUser) => {
      const targetId = getUserId(targetUser);
      if (!targetId) return;

      if (currentUser && getUserId(currentUser) === targetId) {
        toast.error('You cannot delete your own active administrator account.');
        return;
      }

      setActionInProgress((prev) => ({ ...prev, [targetId]: 'delete' }));
      closeConfirmModal();

      try {
        await apiDeleteUser(targetId);
        toast.success(`User ${targetUser.name || targetUser.email} has been removed.`);
        appendAuditLog('DELETE_USER', `Soft-deleted user ${targetUser.name || targetUser.email} (${targetId})`);

        setUsers((prev) => prev.filter((u) => getUserId(u) !== targetId));
        setTotalUsers((prev) => Math.max(0, prev - 1));

        if (inspectUser && getUserId(inspectUser) === targetId) {
          setInspectUser(null);
        }
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to delete user';
        toast.error(msg);
        appendAuditLog('DELETE_USER_FAILED', `Failed to delete ${targetUser.name}: ${msg}`, 'error');
      } finally {
        setActionInProgress((prev) => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
      }
    },
    [currentUser, closeConfirmModal, inspectUser, appendAuditLog, toast]
  );

  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrder('asc');
      return field;
    });
  }, []);

  // ==========================================
  // MONITOR ACTIONS (RBAC)
  // ==========================================
  const handleRefreshMonitors = useCallback(async () => {
    setMonitorRefreshing(true);
    await Promise.all([
      fetchMonitorsData(monitorPage, monitorLimit, monitorStatusFilter, monitorIntervalFilter, monitorSearchQuery),
      fetchMonitorStatsData(),
      fetchIncidentsData(),
    ]);
    toast.success('Monitors & telemetry refreshed');
  }, [
    fetchMonitorsData,
    fetchMonitorStatsData,
    fetchIncidentsData,
    monitorPage,
    monitorLimit,
    monitorStatusFilter,
    monitorIntervalFilter,
    monitorSearchQuery,
    toast,
  ]);

  const handleTriggerCheck = useCallback(
    async (monitorId) => {
      if (!monitorId) return null;
      setMonitorActionInProgress((prev) => ({ ...prev, [monitorId]: 'check' }));

      try {
        const res = await apiAdminTriggerCheck(monitorId);
        toast.success(`Ad-hoc probe completed: ${res.status || 'UP'}`);
        appendAuditLog('TRIGGER_MONITOR_CHECK', `Manual health probe executed for monitor ${monitorId} (${res.status})`);

        // Optimistically update monitor in local state
        setMonitors((prev) =>
          prev.map((m) => {
            if ((m._id || m.id) === monitorId) {
              return {
                ...m,
                lastResult: res.result,
                lastCheckedAt: res.checkedAt || new Date().toISOString(),
              };
            }
            return m;
          })
        );
        fetchIncidentsData();
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Probe execution failed';
        toast.error(msg);
        appendAuditLog('TRIGGER_MONITOR_CHECK_FAILED', `Failed probe for ${monitorId}: ${msg}`, 'error');
        throw err;
      } finally {
        setMonitorActionInProgress((prev) => {
          const next = { ...prev };
          delete next[monitorId];
          return next;
        });
      }
    },
    [appendAuditLog, fetchIncidentsData, toast]
  );

  const handleTogglePauseMonitor = useCallback(
    async (monitor) => {
      const id = monitor._id || monitor.id;
      if (!id) return;
      const isPaused = monitor.status === 'paused';
      const actionName = isPaused ? 'resume' : 'pause';

      setMonitorActionInProgress((prev) => ({ ...prev, [id]: actionName }));

      try {
        if (isPaused) {
          await apiAdminResumeMonitor(id);
          toast.success(`Monitor for ${monitor.url} activated.`);
          appendAuditLog('RESUME_MONITOR', `Admin activated monitor ${monitor.url} (${id})`);
        } else {
          await apiAdminPauseMonitor(id);
          toast.success(`Monitor for ${monitor.url} paused.`);
          appendAuditLog('PAUSE_MONITOR', `Admin paused monitor ${monitor.url} (${id})`);
        }

        const newStatus = isPaused ? 'active' : 'paused';
        setMonitors((prev) =>
          prev.map((m) => ((m._id || m.id) === id ? { ...m, status: newStatus } : m))
        );
        fetchMonitorStatsData();
      } catch (err) {
        const msg = err?.message || err?.error || `Failed to ${actionName} monitor`;
        toast.error(msg);
        appendAuditLog(`${actionName.toUpperCase()}_MONITOR_FAILED`, `Failed: ${msg}`, 'error');
      } finally {
        setMonitorActionInProgress((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [appendAuditLog, fetchMonitorStatsData, toast]
  );

  const handleCreateMonitorSubmit = useCallback(
    async (formData) => {
      try {
        const res = await apiAdminCreateMonitor(formData);
        toast.success('Monitor provisioned successfully.');
        appendAuditLog('CREATE_MONITOR', `Admin created monitor for ${formData.url} owned by user ${formData.userId}`);
        await Promise.all([
          fetchMonitorsData(1, monitorLimit, monitorStatusFilter, monitorIntervalFilter, monitorSearchQuery),
          fetchMonitorStatsData(),
        ]);
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to create monitor';
        toast.error(msg);
        appendAuditLog('CREATE_MONITOR_FAILED', `Failed to create monitor: ${msg}`, 'error');
        throw err;
      }
    },
    [
      fetchMonitorsData,
      fetchMonitorStatsData,
      monitorLimit,
      monitorStatusFilter,
      monitorIntervalFilter,
      monitorSearchQuery,
      appendAuditLog,
      toast,
    ]
  );

  const handleUpdateMonitorSubmit = useCallback(
    async ({ id, url, interval, status }) => {
      try {
        const res = await apiAdminUpdateMonitor(id, { url, interval, status });
        toast.success('Monitor configuration saved.');
        appendAuditLog('UPDATE_MONITOR', `Admin updated monitor ${id} (${url}, ${interval}, ${status})`);

        setMonitors((prev) =>
          prev.map((m) => ((m._id || m.id) === id ? { ...m, url, interval, status } : m))
        );
        fetchMonitorStatsData();
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to update monitor';
        toast.error(msg);
        appendAuditLog('UPDATE_MONITOR_FAILED', `Failed to update monitor: ${msg}`, 'error');
        throw err;
      }
    },
    [appendAuditLog, fetchMonitorStatsData, toast]
  );

  const handleDeleteMonitorSubmit = useCallback(
    async (targetMonitor) => {
      const id = targetMonitor._id || targetMonitor.id;
      if (!id) return;

      try {
        await apiAdminDeleteMonitor(id);
        toast.success(`Monitor for ${targetMonitor.url} deleted.`);
        appendAuditLog('DELETE_MONITOR', `Admin deleted monitor ${targetMonitor.url} (${id})`);

        setMonitors((prev) => prev.filter((m) => (m._id || m.id) !== id));
        setSelectedMonitorIds((prev) => prev.filter((item) => item !== id));
        setTotalMonitors((prev) => Math.max(0, prev - 1));
        fetchMonitorStatsData();
        fetchIncidentsData();
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to delete monitor';
        toast.error(msg);
        appendAuditLog('DELETE_MONITOR_FAILED', `Failed to delete monitor: ${msg}`, 'error');
      }
    },
    [appendAuditLog, fetchMonitorStatsData, fetchIncidentsData, toast]
  );

  const handleClearResultsSubmit = useCallback(
    async (targetMonitor, { olderThanDays } = {}) => {
      const id = targetMonitor._id || targetMonitor.id;
      if (!id) return;

      try {
        const res = await apiAdminClearMonitorResults(id, olderThanDays);
        toast.success(`Cleared ${res.deletedCount || 0} check result records.`);
        appendAuditLog('CLEAR_MONITOR_RESULTS', `Purged ${res.deletedCount} results for ${targetMonitor.url}`);

        if (!olderThanDays) {
          setMonitors((prev) =>
            prev.map((m) => ((m._id || m.id) === id ? { ...m, lastResult: null, lastCheckedAt: null } : m))
          );
        }
        fetchMonitorStatsData();
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to clear monitor results';
        toast.error(msg);
        appendAuditLog('CLEAR_MONITOR_RESULTS_FAILED', `Failed to clear results: ${msg}`, 'error');
      }
    },
    [appendAuditLog, fetchMonitorStatsData, toast]
  );

  // Bulk Operations
  const handleBulkAction = useCallback(
    async (type, payload = {}) => {
      if (selectedMonitorIds.length === 0) return;

      try {
        if (type === 'pause') {
          await apiAdminBulkPauseMonitors({ monitorIds: selectedMonitorIds });
          toast.success(`Paused ${selectedMonitorIds.length} monitors.`);
          appendAuditLog('BULK_PAUSE_MONITORS', `Paused ${selectedMonitorIds.length} monitors`);
        } else if (type === 'resume') {
          await apiAdminBulkResumeMonitors({ monitorIds: selectedMonitorIds });
          toast.success(`Resumed ${selectedMonitorIds.length} monitors.`);
          appendAuditLog('BULK_RESUME_MONITORS', `Resumed ${selectedMonitorIds.length} monitors`);
        } else if (type === 'interval') {
          await apiAdminBulkUpdateInterval({
            monitorIds: selectedMonitorIds,
            interval: payload.interval,
          });
          toast.success(`Updated frequency to ${payload.interval} for ${selectedMonitorIds.length} monitors.`);
          appendAuditLog('BULK_UPDATE_INTERVAL', `Changed interval to ${payload.interval} for ${selectedMonitorIds.length} monitors`);
        } else if (type === 'delete') {
          await apiAdminBulkDeleteMonitors({ monitorIds: selectedMonitorIds });
          toast.success(`Deleted ${selectedMonitorIds.length} monitors and their history.`);
          appendAuditLog('BULK_DELETE_MONITORS', `Deleted ${selectedMonitorIds.length} monitors`);
          setSelectedMonitorIds([]);
        }

        await Promise.all([
          fetchMonitorsData(monitorPage, monitorLimit, monitorStatusFilter, monitorIntervalFilter, monitorSearchQuery),
          fetchMonitorStatsData(),
          fetchIncidentsData(),
        ]);
      } catch (err) {
        const msg = err?.message || err?.error || 'Bulk operation failed';
        toast.error(msg);
        appendAuditLog('BULK_OPERATION_FAILED', `Bulk operation error: ${msg}`, 'error');
      }
    },
    [
      selectedMonitorIds,
      fetchMonitorsData,
      fetchMonitorStatsData,
      fetchIncidentsData,
      monitorPage,
      monitorLimit,
      monitorStatusFilter,
      monitorIntervalFilter,
      monitorSearchQuery,
      appendAuditLog,
      toast,
    ]
  );

  const handleExportMonitorsCsv = useCallback(async () => {
    try {
      const res = await getAdminExportMonitors();
      const list = res?.data || monitors;
      if (!list.length) {
        toast.info('No monitor records available to export.');
        return;
      }
      const success = exportMonitorsToCsv(list, `webpulse-monitors-${Date.now()}.csv`);
      if (success) {
        toast.success(`Exported ${list.length} monitor records to CSV.`);
        appendAuditLog('EXPORT_MONITORS_CSV', `Exported ${list.length} monitor records.`);
      }
    } catch (err) {
      toast.error('Failed to export monitors dataset');
    }
  }, [monitors, appendAuditLog, toast]);

  // Checkbox selection handlers
  const handleToggleSelectMonitor = useCallback((id) => {
    setSelectedMonitorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAllMonitors = useCallback(
    (selectAll) => {
      if (!selectAll) {
        setSelectedMonitorIds([]);
      } else {
        const allIds = monitors.map((m) => m._id || m.id).filter(Boolean);
        setSelectedMonitorIds(allIds);
      }
    },
    [monitors]
  );

  const clearMonitorSelection = useCallback(() => {
    setSelectedMonitorIds([]);
  }, []);

  return {
    // User Accounts State & Actions
    users: processedUsers,
    rawUsers: users,
    rawUsersCount: users.length,
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

    // Uptime Monitor RBAC State & Actions
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

    // Monitor Modals & Triggers
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
  };
}
