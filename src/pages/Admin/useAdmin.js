import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getAllUsers,
  forceLogoutUser as apiForceLogout,
  deleteUser as apiDeleteUser,
  promoteUserToAdmin as apiPromoteUserToAdmin,
  demoteAdminToUser as apiDemoteAdminToUser,
  updateUserRole as apiUpdateUserRole,
  getUserRole as apiGetUserRole,
  getRoleAuditLogs as apiGetRoleAuditLogs,
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
  getAdminRunners as apiGetAdminRunners,
  adminCreateRunner as apiAdminCreateRunner,
  adminSetDefaultRunner as apiAdminSetDefaultRunner,
  adminActivateRunner as apiAdminActivateRunner,
  adminToggleRunner as apiAdminToggleRunner,
  adminTestRunner as apiAdminTestRunner,
  adminDeleteRunner as apiAdminDeleteRunner,
  adminMoveRunnerMonitors as apiAdminMoveRunnerMonitors,
  adminAssignMonitorRunner as apiAdminAssignMonitorRunner,
  adminBulkAssignMonitorRunner as apiAdminBulkAssignMonitorRunner,
  subscribeToEvents,
} from '../../api';
import { useToast } from '../../context';
import {
  getUserId,
  exportUsersToCsv,
  exportMonitorsToCsv,
  isSuperAdmin,
  canPromoteToAdmin,
  canDemoteToUser,
  canDeleteUser,
  canForceLogoutUser,
  getDeleteRestrictionReason,
  getForceLogoutRestrictionReason,
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
      response.pagination?.totalUsers ??
      response.pagination?.total ??
      response.totalUsers ??
      response.total ??
      response.count ??
      list.length;

    totalPages =
      response.pagination?.totalPages ??
      response.totalPages ??
      response.pages ??
      Math.max(1, Math.ceil(total / limit));
  }

  // Normalize each user to ensure id, _id, plan, and plans are safely accessible
  const normalizedList = list.map((u) => {
    if (!u || typeof u !== 'object') return u;
    const plan = u.plan || u.plans || 'free';
    const id = u.id != null ? u.id : u._id;
    return {
      ...u,
      id,
      _id: u._id != null ? u._id : id,
      plan,
      plans: u.plans || plan,
    };
  });

  return { list: normalizedList, total, totalPages };
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
  const [monitorRunnerFilter, setMonitorRunnerFilter] = useState('all');

  const [selectedMonitorIds, setSelectedMonitorIds] = useState([]);
  const [monitorActionInProgress, setMonitorActionInProgress] = useState({});

  // Modals for monitors
  const [monitorModal, setMonitorModal] = useState({ open: false, mode: 'create', monitor: null });
  const [monitorInspectModal, setMonitorInspectModal] = useState({ open: false, monitor: null });
  const [monitorBulkModal, setMonitorBulkModal] = useState({ open: false, type: null, targetMonitor: null });

  // ==========================================
  // RUNNER ENGINE STATE
  // ==========================================
  const [runners, setRunners] = useState([]);
  const [defaultMonitorCount, setDefaultMonitorCount] = useState(0);
  const [runnersLoading, setRunnersLoading] = useState(false);
  const [runnersRefreshing, setRunnersRefreshing] = useState(false);
  const [runnersError, setRunnersError] = useState(null);
  const [runnerActionInProgress, setRunnerActionInProgress] = useState({});

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

  // ==========================================
  // SERVER ROLE AUDIT LOGS (SUPER_ADMIN)
  // ==========================================
  const [serverAuditLogs, setServerAuditLogs] = useState([]);
  const [serverAuditPagination, setServerAuditPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [serverAuditPage, setServerAuditPage] = useState(1);
  const [serverAuditLimit, setServerAuditLimit] = useState(20);
  const [serverAuditLoading, setServerAuditLoading] = useState(false);
  const [serverAuditError, setServerAuditError] = useState(null);

  const isSuperAdminUser = useMemo(() => isSuperAdmin(currentUser), [currentUser]);

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

  // Fetch Server-side Database Role Audit Logs (SuperAdmin only)
  const fetchServerAuditLogs = useCallback(
    async (currentPage = serverAuditPage, currentLimit = serverAuditLimit) => {
      if (!isSuperAdmin(currentUser)) return;
      try {
        setServerAuditLoading(true);
        setServerAuditError(null);
        const res = await apiGetRoleAuditLogs(currentPage, currentLimit);
        if (!mountedRef.current) return;
        if (res?.success && Array.isArray(res.data)) {
          setServerAuditLogs(res.data);
          if (res.pagination) {
            setServerAuditPagination(res.pagination);
          }
        }
      } catch (err) {
        if (!mountedRef.current) return;
        console.warn('[useAdmin] Error fetching role audit logs:', err?.message);
        setServerAuditError(err?.message || err?.error || 'Failed to fetch security role audit logs');
      } finally {
        if (mountedRef.current) setServerAuditLoading(false);
      }
    },
    [currentUser, serverAuditPage, serverAuditLimit]
  );

  useEffect(() => {
    if (isSuperAdmin(currentUser)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch
      fetchServerAuditLogs(serverAuditPage, serverAuditLimit);
    }
  }, [currentUser, serverAuditPage, serverAuditLimit, fetchServerAuditLogs]);

  // ==========================================
  // USERS DATA FETCHING
  // ==========================================
  const fetchUsers = useCallback(
    async (
      currentPage = page,
      currentLimit = limit,
      currentSearch = searchQuery,
      currentRole = roleFilter,
      currentPlan = planFilter,
      currentSortBy = sortBy,
      currentSortOrder = sortOrder
    ) => {
      try {
        setError(null);
        const data = await getAllUsers(currentPage, currentLimit, currentSearch, {
          role: currentRole,
          plan: currentPlan,
          sortBy: currentSortBy,
          sortOrder: currentSortOrder,
        });
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
    [page, limit, searchQuery, roleFilter, planFilter, sortBy, sortOrder]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch
    fetchUsers(page, limit, searchQuery, roleFilter, planFilter, sortBy, sortOrder);
  }, [page, limit, fetchUsers, searchQuery, roleFilter, planFilter, sortBy, sortOrder]);

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
      currentSearch = monitorSearchQuery,
      currentRunner = monitorRunnerFilter
    ) => {
      try {
        setMonitorError(null);
        const res = await getAdminMonitors({
          page: currentPage,
          limit: currentLimit,
          status: currentStatus,
          interval: currentInterval,
          runnerId: currentRunner,
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
    [monitorPage, monitorLimit, monitorStatusFilter, monitorIntervalFilter, monitorSearchQuery, monitorRunnerFilter]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch
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

  const fetchRunners = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setRunnersLoading(true);
        setRunnersError(null);
        const res = await apiGetAdminRunners();
        if (!mountedRef.current) return;
        if (res?.success && Array.isArray(res.runners)) {
          setRunners(res.runners);
          if (res.defaultMonitorCount !== undefined) {
            setDefaultMonitorCount(res.defaultMonitorCount);
          }
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err?.message || err?.error || 'Failed to fetch execution runners';
        setRunnersError(msg);
        if (!silent) toast.error(msg);
      } finally {
        if (mountedRef.current) {
          setRunnersLoading(false);
          setRunnersRefreshing(false);
        }
      }
    },
    [toast]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch
    fetchRunners({ silent: true });
  }, [fetchRunners]);

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
              ...(payload.hostinginfo ? { hostinginfo: payload.hostinginfo } : {}),
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
    const query = searchQuery ? searchQuery.trim().toLowerCase() : '';

    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all' && (u.role || 'User').toLowerCase() !== roleFilter.toLowerCase()) {
        return false;
      }
      // Plan filter
      const userPlan = (u.plan || u.plans || 'free').toLowerCase();
      if (planFilter !== 'all' && userPlan !== planFilter.toLowerCase()) {
        return false;
      }
      // Client-side search fallback
      if (query) {
        const uId = String(getUserId(u)).toLowerCase();
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        if (
          !name.includes(query) &&
          !email.includes(query) &&
          !role.includes(query) &&
          !userPlan.includes(query) &&
          !uId.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [users, roleFilter, planFilter, searchQuery]);

  const stats = useMemo(() => {
    let adminsCount = 0;
    let superAdminsCount = 0;
    let proCount = 0;
    users.forEach((u) => {
      const r = (u.role || '').toLowerCase();
      if (r === 'superadmin' || r === 'super_admin') {
        superAdminsCount++;
      } else if (r === 'admin') {
        adminsCount++;
      }
      const p = (u.plan || u.plans || '').toLowerCase();
      if (p === 'pro' || p === 'enterprise') proCount++;
    });

    return {
      total: totalUsers,
      displayed: processedUsers.length,
      admins: adminsCount,
      superAdmins: superAdminsCount,
      totalStaff: adminsCount + superAdminsCount,
      proUsers: proCount,
      freeUsers: Math.max(0, processedUsers.length - proCount),
    };
  }, [totalUsers, processedUsers, users]);

  // ==========================================
  // USER ACTIONS
  // ==========================================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers(page, limit, searchQuery, roleFilter, planFilter, sortBy, sortOrder);
    toast.success('Accounts list updated');
  }, [fetchUsers, page, limit, searchQuery, roleFilter, planFilter, sortBy, sortOrder, toast]);

  const handleExportCsv = useCallback(() => {
    if (!processedUsers.length) {
      toast.info('No users available to export.');
      return;
    }
    const success = exportUsersToCsv(processedUsers, `monitormyhost-users-${Date.now()}.csv`);
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

  const promptPromoteUser = useCallback((user) => {
    setConfirmModal({ open: true, type: 'promote', user });
  }, []);

  const promptDemoteUser = useCallback((user) => {
    setConfirmModal({ open: true, type: 'demote', user });
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal({ open: false, type: null, user: null });
  }, []);

  const handleForceLogout = useCallback(
    async (targetUser) => {
      const targetId = getUserId(targetUser);
      if (!targetId) return;

      if (!canForceLogoutUser(currentUser, targetUser)) {
        const reason = getForceLogoutRestrictionReason(currentUser, targetUser);
        toast.error(reason || 'Access denied: You cannot force logout this account.');
        closeConfirmModal();
        return;
      }

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
    [currentUser, closeConfirmModal, appendAuditLog, toast]
  );

  const handleDeleteUser = useCallback(
    async (targetUser) => {
      const targetId = getUserId(targetUser);
      if (!targetId) return;

      if (!canDeleteUser(currentUser, targetUser)) {
        const reason = getDeleteRestrictionReason(currentUser, targetUser);
        toast.error(reason || 'Access denied: You cannot delete this account.');
        closeConfirmModal();
        return;
      }

      setActionInProgress((prev) => ({ ...prev, [targetId]: 'delete' }));
      closeConfirmModal();

      try {
        await apiDeleteUser(targetId);
        toast.success(`User ${targetUser.name || targetUser.email} has been removed.`);
        appendAuditLog('DELETE_USER', `Soft-deleted user ${targetUser.name || targetUser.email} (${targetId})`);

        setUsers((prev) => prev.filter((u) => String(getUserId(u)) !== String(targetId)));
        setTotalUsers((prev) => Math.max(0, prev - 1));

        if (inspectUser && String(getUserId(inspectUser)) === String(targetId)) {
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

  // SuperAdmin Role Management Actions
  const handlePromoteUser = useCallback(
    async (targetUser) => {
      const targetId = getUserId(targetUser);
      if (!targetId) return;

      if (!canPromoteToAdmin(currentUser, targetUser)) {
        toast.error('You do not have permission to promote this user.');
        closeConfirmModal();
        return;
      }

      setActionInProgress((prev) => ({ ...prev, [targetId]: 'promote' }));
      closeConfirmModal();

      try {
        const res = await apiPromoteUserToAdmin(targetId);
        toast.success(`User ${targetUser.name || targetUser.email} has been promoted to Admin.`);
        appendAuditLog(
          'PROMOTE_TO_ADMIN',
          `Promoted ${targetUser.name || targetUser.email} (ID: ${targetId}) to Admin role.`
        );

        setUsers((prev) =>
          prev.map((u) => (String(getUserId(u)) === String(targetId) ? { ...u, role: 'Admin' } : u))
        );
        if (inspectUser && String(getUserId(inspectUser)) === String(targetId)) {
          setInspectUser((prev) => ({ ...prev, role: 'Admin' }));
        }

        if (isSuperAdmin(currentUser)) {
          fetchServerAuditLogs(serverAuditPage, serverAuditLimit);
        }
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to promote user to Admin';
        toast.error(msg);
        appendAuditLog('PROMOTE_TO_ADMIN_FAILED', `Failed to promote ${targetUser.name}: ${msg}`, 'error');
      } finally {
        setActionInProgress((prev) => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
      }
    },
    [currentUser, closeConfirmModal, inspectUser, appendAuditLog, toast, fetchServerAuditLogs, serverAuditPage, serverAuditLimit]
  );

  const handleDemoteUser = useCallback(
    async (targetUser) => {
      const targetId = getUserId(targetUser);
      if (!targetId) return;

      if (!canDemoteToUser(currentUser, targetUser)) {
        toast.error('You do not have permission to demote this user.');
        closeConfirmModal();
        return;
      }

      setActionInProgress((prev) => ({ ...prev, [targetId]: 'demote' }));
      closeConfirmModal();

      try {
        const res = await apiDemoteAdminToUser(targetId);
        toast.success(
          `Admin ${targetUser.name || targetUser.email} demoted to regular User. Active sessions and sockets invalidated.`
        );
        appendAuditLog(
          'DEMOTE_TO_USER',
          `Demoted Admin ${targetUser.name || targetUser.email} (ID: ${targetId}) to regular User. Sessions purged.`
        );

        setUsers((prev) =>
          prev.map((u) => (String(getUserId(u)) === String(targetId) ? { ...u, role: 'User' } : u))
        );
        if (inspectUser && String(getUserId(inspectUser)) === String(targetId)) {
          setInspectUser((prev) => ({ ...prev, role: 'User' }));
        }

        if (isSuperAdmin(currentUser)) {
          fetchServerAuditLogs(serverAuditPage, serverAuditLimit);
        }
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to demote Admin';
        toast.error(msg);
        appendAuditLog('DEMOTE_TO_USER_FAILED', `Failed to demote ${targetUser.name}: ${msg}`, 'error');
      } finally {
        setActionInProgress((prev) => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
      }
    },
    [currentUser, closeConfirmModal, inspectUser, appendAuditLog, toast, fetchServerAuditLogs, serverAuditPage, serverAuditLimit]
  );

  const handleUpdateUserRole = useCallback(
    async (targetUser, newRole) => {
      const targetId = getUserId(targetUser);
      if (!targetId) return;

      if (!isSuperAdmin(currentUser)) {
        toast.error('SuperAdmin privileges required to update user roles.');
        return;
      }

      setActionInProgress((prev) => ({ ...prev, [targetId]: 'roleUpdate' }));

      try {
        const res = await apiUpdateUserRole(targetId, newRole);
        toast.success(`Role for ${targetUser.name || targetUser.email} updated to ${newRole}.`);
        appendAuditLog(
          'UPDATE_USER_ROLE',
          `Changed role of ${targetUser.name || targetUser.email} (ID: ${targetId}) to ${newRole}.`
        );

        setUsers((prev) =>
          prev.map((u) => (String(getUserId(u)) === String(targetId) ? { ...u, role: newRole } : u))
        );
        if (inspectUser && String(getUserId(inspectUser)) === String(targetId)) {
          setInspectUser((prev) => ({ ...prev, role: newRole }));
        }

        if (isSuperAdmin(currentUser)) {
          fetchServerAuditLogs(serverAuditPage, serverAuditLimit);
        }
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || `Failed to update role to ${newRole}`;
        toast.error(msg);
        appendAuditLog('UPDATE_USER_ROLE_FAILED', `Failed role change: ${msg}`, 'error');
      } finally {
        setActionInProgress((prev) => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
      }
    },
    [currentUser, inspectUser, appendAuditLog, toast, fetchServerAuditLogs, serverAuditPage, serverAuditLimit]
  );

  const handleGetUserRole = useCallback(async (userId) => {
    return apiGetUserRole(userId);
  }, []);

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
      monitorRunnerFilter,
      fetchRunners,
      appendAuditLog,
      toast,
    ]
  );

  const handleUpdateMonitorSubmit = useCallback(
    async ({ id, url, interval, status, runnerId }) => {
      try {
        const res = await apiAdminUpdateMonitor(id, { url, interval, status, runnerId });
        toast.success('Monitor configuration saved.');
        appendAuditLog('UPDATE_MONITOR', `Admin updated monitor ${id} (${url}, ${interval}, ${status})`);

        await Promise.all([
          fetchMonitorsData(),
          fetchMonitorStatsData(),
          fetchRunners({ silent: true }),
        ]);
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to update monitor';
        toast.error(msg);
        appendAuditLog('UPDATE_MONITOR_FAILED', `Failed to update monitor: ${msg}`, 'error');
        throw err;
      }
    },
    [appendAuditLog, fetchMonitorsData, fetchMonitorStatsData, fetchRunners, toast]
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
        } else if (type === 'assignRunner') {
          const res = await apiAdminBulkAssignMonitorRunner({
            monitorIds: selectedMonitorIds,
            runnerId: payload.runnerId !== undefined ? payload.runnerId : null,
          });
          toast.success(res?.message || `Assigned ${res?.updatedCount || selectedMonitorIds.length} monitors to runner.`);
          appendAuditLog('BULK_ASSIGN_RUNNER', `Assigned ${selectedMonitorIds.length} monitors to runner`);
          setSelectedMonitorIds([]);
        } else if (type === 'delete') {
          await apiAdminBulkDeleteMonitors({ monitorIds: selectedMonitorIds });
          toast.success(`Deleted ${selectedMonitorIds.length} monitors and their history.`);
          appendAuditLog('BULK_DELETE_MONITORS', `Deleted ${selectedMonitorIds.length} monitors`);
          setSelectedMonitorIds([]);
        }

        await Promise.all([
          fetchMonitorsData(monitorPage, monitorLimit, monitorStatusFilter, monitorIntervalFilter, monitorSearchQuery, monitorRunnerFilter),
          fetchMonitorStatsData(),
          fetchIncidentsData(),
          fetchRunners({ silent: true }),
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
      monitorRunnerFilter,
      fetchRunners,
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
      const success = exportMonitorsToCsv(list, `monitormyhost-monitors-${Date.now()}.csv`);
      if (success) {
        toast.success(`Exported ${list.length} monitor records to CSV.`);
        appendAuditLog('EXPORT_MONITORS_CSV', `Exported ${list.length} monitor records.`);
      }
    } catch {
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

  // ==========================================
  // RUNNER ENGINE ACTIONS
  // ==========================================
  const handleSetDefaultRunner = useCallback(
    async (runnerId) => {
      if (!runnerId) return;
      setRunnerActionInProgress((prev) => ({ ...prev, [runnerId]: 'setDefault' }));
      try {
        const res = await apiAdminSetDefaultRunner(runnerId);
        toast.success(res?.message || 'Default runner updated successfully');
        appendAuditLog('SET_DEFAULT_RUNNER', `Admin set runner #${runnerId} as default engine`);
        await Promise.all([
          fetchRunners({ silent: true }),
          fetchMonitorsData(),
        ]);
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to set default runner';
        toast.error(msg);
        appendAuditLog('SET_DEFAULT_RUNNER_FAILED', `Failed to set runner #${runnerId} as default: ${msg}`, 'error');
        throw err;
      } finally {
        setRunnerActionInProgress((prev) => {
          const next = { ...prev };
          delete next[runnerId];
          return next;
        });
      }
    },
    [appendAuditLog, fetchRunners, fetchMonitorsData, toast]
  );

  const handleToggleRunner = useCallback(
    async (runnerId) => {
      if (!runnerId) return;
      setRunnerActionInProgress((prev) => ({ ...prev, [runnerId]: 'toggle' }));
      try {
        const res = await apiAdminToggleRunner(runnerId);
        toast.success(res?.message || `Runner ${res?.runner?.isActive ? 'enabled' : 'disabled'} successfully`);
        appendAuditLog('TOGGLE_RUNNER', `Admin toggled runner #${runnerId} state to ${res?.runner?.isActive ? 'active' : 'disabled'}`);
        await fetchRunners({ silent: true });
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to toggle runner';
        toast.error(msg);
        appendAuditLog('TOGGLE_RUNNER_FAILED', `Failed to toggle runner #${runnerId}: ${msg}`, 'error');
        throw err;
      } finally {
        setRunnerActionInProgress((prev) => {
          const next = { ...prev };
          delete next[runnerId];
          return next;
        });
      }
    },
    [appendAuditLog, fetchRunners, toast]
  );

  const handleMoveRunnerMonitors = useCallback(
    async (sourceId, payload) => {
      setRunnerActionInProgress((prev) => ({ ...prev, move: true }));
      try {
        const res = await apiAdminMoveRunnerMonitors(sourceId, payload);
        toast.success(`Successfully moved ${res?.movedCount ?? 0} monitor(s) to target runner`);
        appendAuditLog('MOVE_MONITORS', `Moved ${res?.movedCount ?? 0} monitors from ${res?.from?.name || sourceId} to ${res?.to?.name || payload?.toRunnerId || 'Default'}`);
        await Promise.all([
          fetchRunners({ silent: true }),
          fetchMonitorsData(),
        ]);
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to move monitors';
        toast.error(msg);
        appendAuditLog('MOVE_MONITORS_FAILED', `Failed to move monitors: ${msg}`, 'error');
        throw err;
      } finally {
        setRunnerActionInProgress((prev) => {
          const next = { ...prev };
          delete next.move;
          return next;
        });
      }
    },
    [appendAuditLog, fetchRunners, fetchMonitorsData, toast]
  );

  const handleAssignMonitorRunner = useCallback(
    async (monitorId, runnerId) => {
      setMonitorActionInProgress((prev) => ({ ...prev, [monitorId]: 'assignRunner' }));
      try {
        const res = await apiAdminAssignMonitorRunner(monitorId, runnerId);
        toast.success(res?.message || 'Monitor runner routing updated');
        appendAuditLog('ASSIGN_RUNNER', `Assigned monitor #${monitorId} to runner: ${res?.monitor?.runner?.name || 'System Default'}`);
        await Promise.all([
          fetchMonitorsData(),
          fetchRunners({ silent: true }),
        ]);
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to assign runner';
        toast.error(msg);
        appendAuditLog('ASSIGN_RUNNER_FAILED', `Failed to assign runner for monitor #${monitorId}: ${msg}`, 'error');
        throw err;
      } finally {
        setMonitorActionInProgress((prev) => {
          const next = { ...prev };
          delete next[monitorId];
          return next;
        });
      }
    },
    [appendAuditLog, fetchMonitorsData, fetchRunners, toast]
  );

  const handleBulkAssignMonitorRunner = useCallback(
    async (monitorIds, runnerId) => {
      if (!monitorIds || monitorIds.length === 0) return;
      setMonitorActionInProgress((prev) => ({ ...prev, bulkAssign: true }));
      try {
        const res = await apiAdminBulkAssignMonitorRunner({ monitorIds, runnerId });
        toast.success(res?.message || `Assigned ${res?.assignedCount || monitorIds.length} monitors to runner`);
        appendAuditLog('BULK_ASSIGN_RUNNER', `Bulk assigned ${monitorIds.length} monitors to runner: ${res?.runner?.name || 'System Default'}`);
        clearMonitorSelection();
        await Promise.all([
          fetchMonitorsData(),
          fetchRunners({ silent: true }),
        ]);
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to bulk assign runner';
        toast.error(msg);
        appendAuditLog('BULK_ASSIGN_RUNNER_FAILED', `Failed to bulk assign runner: ${msg}`, 'error');
        throw err;
      } finally {
        setMonitorActionInProgress((prev) => {
          const next = { ...prev };
          delete next.bulkAssign;
          return next;
        });
      }
    },
    [appendAuditLog, clearMonitorSelection, fetchMonitorsData, fetchRunners, toast]
  );

  const handleActivateRunner = useCallback(
    async (runnerId) => {
      return handleSetDefaultRunner(runnerId);
    },
    [handleSetDefaultRunner]
  );

  const handleTestRunner = useCallback(
    async (runnerId, testUrl) => {
      if (!runnerId) return;
      setRunnerActionInProgress((prev) => ({ ...prev, [`test_${runnerId}`]: true }));
      try {
        const res = await apiAdminTestRunner(runnerId, testUrl);
        if (res?.ok) {
          toast.success(`Probe succeeded via ${res.runner || 'runner'} in ${res.ms || 0}ms`);
        } else {
          toast.warning(`Probe completed: ${res.status || 'DOWN'} (${res.error || 'Check failed'})`);
        }
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Runner test failed';
        toast.error(msg);
        throw err;
      } finally {
        setRunnerActionInProgress((prev) => {
          const next = { ...prev };
          delete next[`test_${runnerId}`];
          return next;
        });
      }
    },
    [toast]
  );

  const handleCreateRunner = useCallback(
    async ({ name, type, config }) => {
      setRunnerActionInProgress((prev) => ({ ...prev, create: true }));
      try {
        const res = await apiAdminCreateRunner({ name, type, config });
        toast.success(res?.message || 'Runner created successfully');
        appendAuditLog('CREATE_RUNNER', `Registered runner '${name}' (${type})`);
        fetchRunners({ silent: true });
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to create runner';
        toast.error(msg);
        appendAuditLog('CREATE_RUNNER_FAILED', `Failed to register '${name}': ${msg}`, 'error');
        throw err;
      } finally {
        setRunnerActionInProgress((prev) => {
          const next = { ...prev };
          delete next.create;
          return next;
        });
      }
    },
    [appendAuditLog, fetchRunners, toast]
  );

  const handleDeleteRunner = useCallback(
    async (runnerId) => {
      if (!runnerId) return;
      setRunnerActionInProgress((prev) => ({ ...prev, [runnerId]: 'delete' }));
      try {
        const res = await apiAdminDeleteRunner(runnerId);
        toast.success(res?.message || 'Runner deleted successfully');
        appendAuditLog('DELETE_RUNNER', `Removed runner ID #${runnerId}`);
        setRunners((prev) => prev.filter((r) => r.id !== runnerId));
        return res;
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to delete runner';
        toast.error(msg);
        appendAuditLog('DELETE_RUNNER_FAILED', `Failed to delete runner #${runnerId}: ${msg}`, 'error');
        throw err;
      } finally {
        setRunnerActionInProgress((prev) => {
          const next = { ...prev };
          delete next[runnerId];
          return next;
        });
      }
    },
    [appendAuditLog, toast]
  );

  const activeRunner = useMemo(
    () => runners.find((r) => r.isDefault) || runners.find((r) => r.isActive) || runners[0] || null,
    [runners]
  );

  const defaultRunner = useMemo(
    () => runners.find((r) => r.isDefault) || runners.find((r) => r.type === 'local') || runners[0] || null,
    [runners]
  );

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
    promptPromoteUser,
    promptDemoteUser,
    closeConfirmModal,
    handleForceLogout,
    handleDeleteUser,
    handlePromoteUser,
    handleDemoteUser,
    handleUpdateUserRole,
    handleGetUserRole,
    inspectUser,
    setInspectUser,
    auditLogs,
    handleRefresh,
    handleExportCsv,

    // SuperAdmin Exclusive Role & Audit Log Telemetry
    isSuperAdminUser,
    serverAuditLogs,
    serverAuditPagination,
    serverAuditPage,
    setServerAuditPage,
    serverAuditLimit,
    setServerAuditLimit,
    serverAuditLoading,
    serverAuditError,
    fetchServerAuditLogs,

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
    monitorRunnerFilter,
    setMonitorRunnerFilter,
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

    // Execution Runners Engine
    runners,
    activeRunner,
    defaultRunner,
    defaultMonitorCount,
    runnersLoading,
    runnersRefreshing,
    runnersError,
    runnerActionInProgress,
    fetchRunners,
    handleActivateRunner,
    handleSetDefaultRunner,
    handleToggleRunner,
    handleMoveRunnerMonitors,
    handleAssignMonitorRunner,
    handleBulkAssignMonitorRunner,
    handleTestRunner,
    handleCreateRunner,
    handleDeleteRunner,
  };
}
