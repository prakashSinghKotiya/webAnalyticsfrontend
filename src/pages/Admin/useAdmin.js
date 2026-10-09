import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAllUsers, forceLogoutUser as apiForceLogout, deleteUser as apiDeleteUser } from '../../api';
import { useToast } from '../../context';
import { getUserId, exportUsersToCsv } from './admin.utils';

/**
 * Defensive parser for diverse backend response formats.
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

export default function useAdmin(currentUser) {
  const toast = useToast();
  const mountedRef = useRef(true);

  // Data state
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Loading & status states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Action states
  const [actionInProgress, setActionInProgress] = useState({}); // { [userId]: 'logout' | 'delete' }
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, user: null });
  const [inspectUser, setInspectUser] = useState(null);

  // Session audit logs
  const [auditLogs, setAuditLogs] = useState(() => [
    {
      id: 'init-1',
      action: 'ADMIN_SESSION_STARTED',
      description: 'Admin Control Plane initialized',
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

  /**
   * Log an administrative event in the session audit trail.
   */
  const appendAuditLog = useCallback((action, description, status = 'success') => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      action,
      description,
      timestamp: new Date().toISOString(),
      status,
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 49)]); // keep recent 50 logs
  }, []);

  /**
   * Core fetcher for users list from backend API.
   */
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
        toast.error(msg);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, limit, searchQuery, toast]
  );

  // Initial fetch and fetch on page or limit changes
  useEffect(() => {
    fetchUsers(page, limit, searchQuery);
  }, [page, limit, fetchUsers, searchQuery]);

  /**
   * Trigger manual fresh reload
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers(page, limit, searchQuery);
    toast.success('User list updated');
  }, [fetchUsers, page, limit, searchQuery, toast]);

  /**
   * Filtered & sorted users for current view
   */
  const processedUsers = useMemo(() => {
    let result = [...users];

    // Client-side search refinement (matches name, email, id, role)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((u) => {
        const id = getUserId(u).toLowerCase();
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        return id.includes(q) || name.includes(q) || email.includes(q) || role.includes(q);
      });
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((u) => (u.role || '').toLowerCase() === roleFilter.toLowerCase());
    }

    // Plan filter
    if (planFilter !== 'all') {
      result = result.filter((u) => (u.plan || 'free').toLowerCase() === planFilter.toLowerCase());
    }

    // Sort
    result.sort((a, b) => {
      let valA;
      let valB;

      if (sortBy === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortBy === 'email') {
        valA = (a.email || '').toLowerCase();
        valB = (b.email || '').toLowerCase();
      } else if (sortBy === 'role') {
        valA = (a.role || '').toLowerCase();
        valB = (b.role || '').toLowerCase();
      } else {
        // createdAt
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, roleFilter, planFilter, sortBy, sortOrder]);

  /**
   * System summary stats derived from currently loaded/queried data
   */
  const stats = useMemo(() => {
    const adminCount = users.filter((u) => {
      const r = (u.role || '').toLowerCase();
      return r === 'admin' || r === 'superadmin';
    }).length;

    const proCount = users.filter((u) => {
      const p = (u.plan || '').toLowerCase();
      return p === 'pro' || p === 'enterprise';
    }).length;

    return {
      total: totalUsers || users.length,
      admins: adminCount,
      proUsers: proCount,
      displayed: processedUsers.length,
    };
  }, [users, totalUsers, processedUsers.length]);

  /**
   * Sorting column toggle
   */
  const handleSort = useCallback((field) => {
    setSortBy((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrder('asc');
      return field;
    });
  }, []);

  /**
   * Modal triggers
   */
  const promptForceLogout = useCallback((user) => {
    setConfirmModal({
      open: true,
      type: 'logout',
      user,
    });
  }, []);

  const promptDeleteUser = useCallback((user) => {
    setConfirmModal({
      open: true,
      type: 'delete',
      user,
    });
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal({ open: false, type: null, user: null });
  }, []);

  /**
   * Execute Force Logout
   */
  const handleForceLogout = useCallback(
    async (targetUser) => {
      const targetId = getUserId(targetUser);
      if (!targetId) return;

      // Prevent force-logging out self
      if (currentUser && getUserId(currentUser) === targetId) {
        toast.error("You cannot force logout your own active session from here.");
        return;
      }

      setActionInProgress((prev) => ({ ...prev, [targetId]: 'logout' }));
      closeConfirmModal();

      try {
        await apiForceLogout(targetId);
        toast.success(`User session for ${targetUser.name || targetUser.email} has been terminated.`);
        appendAuditLog('FORCE_LOGOUT', `Terminated session for ${targetUser.name || targetUser.email} (${targetId})`);
      } catch (err) {
        const msg = err?.message || err?.error || 'Failed to force logout user';
        toast.error(msg);
        appendAuditLog('FORCE_LOGOUT_FAILED', `Failed to log out ${targetUser.name}: ${msg}`, 'error');
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

  /**
   * Execute Delete / Soft-Delete User
   */
  const handleDeleteUser = useCallback(
    async (targetUser) => {
      const targetId = getUserId(targetUser);
      if (!targetId) return;

      // Prevent self-deletion
      if (currentUser && getUserId(currentUser) === targetId) {
        toast.error("You cannot delete your own active administrator account.");
        return;
      }

      setActionInProgress((prev) => ({ ...prev, [targetId]: 'delete' }));
      closeConfirmModal();

      try {
        await apiDeleteUser(targetId);
        toast.success(`User ${targetUser.name || targetUser.email} has been removed.`);
        appendAuditLog('DELETE_USER', `Soft-deleted user account ${targetUser.name || targetUser.email} (${targetId})`);

        // Optimistically remove or refresh
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

  /**
   * Export loaded users to CSV
   */
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

  return {
    // Data & state
    users: processedUsers,
    rawUsersCount: users.length,
    totalUsers,
    totalPages,
    page,
    limit,
    loading,
    refreshing,
    error,
    stats,

    // Filter & sort
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    planFilter,
    setPlanFilter,
    sortBy,
    sortOrder,
    handleSort,

    // Pagination
    setPage,
    setLimit,

    // Actions & Modals
    actionInProgress,
    confirmModal,
    promptForceLogout,
    promptDeleteUser,
    closeConfirmModal,
    handleForceLogout,
    handleDeleteUser,

    // Inspection
    inspectUser,
    setInspectUser,

    // Audit logs & System
    auditLogs,
    handleRefresh,
    handleExportCsv,
  };
}

