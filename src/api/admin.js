import { axiosWithCreds } from "./axiosInstance";

// ==========================================
// USER ACCOUNT RBAC API
// ==========================================

// Admin: Get all users (paginated with optional search & filters)
export const getAllUsers = async (page = 1, limit = 10, search = '', filters = {}) => {
  const params = { page, limit };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (filters?.role && filters.role !== 'all') {
    params.role = filters.role;
  }
  if (filters?.plan && filters.plan !== 'all') {
    params.plan = filters.plan;
  }
  if (filters?.sortBy) {
    params.sortBy = filters.sortBy;
  }
  if (filters?.sortOrder) {
    params.sortOrder = filters.sortOrder;
  }
  const { data } = await axiosWithCreds.get("/admin/getusers", {
    params,
  });
  return data;
};

// Admin: Force logout a user
export const forceLogoutUser = async (userId) => {
  const cleanId = encodeURIComponent(String(userId));
  try {
    const { data } = await axiosWithCreds.post(`/admin/users/${cleanId}/logout`);
    return data;
  } catch {
    const { data } = await axiosWithCreds.post(`/admin/${cleanId}/logout`);
    return data;
  }
};

// Admin: Soft delete a user
export const deleteUser = async (userId) => {
  const cleanId = encodeURIComponent(String(userId));
  try {
    const { data } = await axiosWithCreds.delete(`/admin/users/${cleanId}`);
    return data;
  } catch {
    const { data } = await axiosWithCreds.post(`/admin/${cleanId}`);
    return data;
  }
};

// ==========================================
// SUPER_ADMIN EXCLUSIVE ROLE MANAGEMENT API
// ==========================================

// SuperAdmin: Promote a regular user to Admin
export const promoteUserToAdmin = async (userId) => {
  const cleanId = encodeURIComponent(String(userId));
  const { data } = await axiosWithCreds.post(`/admin/users/${cleanId}/promote`);
  return data;
};

// SuperAdmin: Demote an Admin to regular User (revokes sessions and disconnects sockets)
export const demoteAdminToUser = async (userId) => {
  const cleanId = encodeURIComponent(String(userId));
  const { data } = await axiosWithCreds.post(`/admin/users/${cleanId}/demote`);
  return data;
};

// SuperAdmin: RESTful role update ('Admin' or 'User')
export const updateUserRole = async (userId, role) => {
  const cleanId = encodeURIComponent(String(userId));
  const { data } = await axiosWithCreds.patch(`/admin/users/${cleanId}/role`, { role });
  return data;
};

// SuperAdmin & Admin: Inspect user role details
export const getUserRole = async (userId) => {
  const cleanId = encodeURIComponent(String(userId));
  const { data } = await axiosWithCreds.get(`/admin/users/${cleanId}/role`);
  return data;
};

// SuperAdmin: Retrieve role change audit log telemetry
export const getRoleAuditLogs = async (page = 1, limit = 20) => {
  const params = { page, limit };
  const { data } = await axiosWithCreds.get("/admin/audit-logs", { params });
  return data;
};

// ==========================================
// UPTIME MONITOR RBAC API
// ==========================================

// 1. Monitor stats overview (total, active, paused, health UP/DOWN/PENDING, intervals)
export const getAdminMonitorStats = async () => {
  const { data } = await axiosWithCreds.get("/admin/monitors/stats");
  return data;
};

// 2. Paginated list of monitors across all users
export const getAdminMonitors = async ({
  page = 1,
  limit = 10,
  status,
  interval,
  runnerId,
  userId,
  search,
  sortBy = "createdAt",
  order = "desc",
} = {}) => {
  const params = { page, limit, sortBy, order };
  if (status && status !== "all") params.status = status;
  if (interval && interval !== "all") params.interval = interval;
  if (runnerId !== undefined && runnerId !== "" && runnerId !== "all") params.runnerId = runnerId;
  if (userId) params.userId = userId;
  if (search && search.trim()) params.search = search.trim();

  const { data } = await axiosWithCreds.get("/admin/monitors", { params });
  return data;
};

// 3. Current system outages & DOWN incident reports
export const getAdminMonitorIncidents = async () => {
  const { data } = await axiosWithCreds.get("/admin/monitors/incidents");
  return data;
};

// 4. Detailed monitor inspection with recent check results & owner metadata
export const getAdminMonitorDetails = async (id, params = {}) => {
  const { data } = await axiosWithCreds.get(`/admin/monitors/${encodeURIComponent(id)}`, { params });
  return data;
};

// 5. Admin provision / create a new monitor
export const adminCreateMonitor = async ({ url, interval = "15m", userId }) => {
  const { data } = await axiosWithCreds.post("/admin/monitors", {
    url,
    interval,
    userId,
  });
  return data;
};

// 6. Admin update monitor configuration (URL, interval, status)
export const adminUpdateMonitor = async (id, { url, interval, status }) => {
  const { data } = await axiosWithCreds.put(
    `/admin/monitors/${encodeURIComponent(id)}`,
    { url, interval, status }
  );
  return data;
};

// 7. Admin trigger on-demand ad-hoc health ping
export const adminTriggerCheck = async (id) => {
  const { data } = await axiosWithCreds.post(`/admin/monitors/${encodeURIComponent(id)}/check`);
  return data;
};

// 8. Admin pause a monitor
export const adminPauseMonitor = async (id) => {
  const { data } = await axiosWithCreds.patch(`/admin/monitors/${encodeURIComponent(id)}/pause`);
  return data;
};

// 9. Admin resume / activate a monitor
export const adminResumeMonitor = async (id) => {
  const { data } = await axiosWithCreds.patch(`/admin/monitors/${encodeURIComponent(id)}/resume`);
  return data;
};

// 10. Admin delete a single monitor
export const adminDeleteMonitor = async (id) => {
  const { data } = await axiosWithCreds.delete(`/admin/monitors/${encodeURIComponent(id)}`);
  return data;
};

// 11. Admin bulk pause monitors
export const adminBulkPauseMonitors = async ({ monitorIds, userId } = {}) => {
  const { data } = await axiosWithCreds.post("/admin/monitors/bulk/pause", {
    monitorIds,
    userId,
  });
  return data;
};

// 12. Admin bulk resume monitors
export const adminBulkResumeMonitors = async ({ monitorIds, userId } = {}) => {
  const { data } = await axiosWithCreds.post("/admin/monitors/bulk/resume", {
    monitorIds,
    userId,
  });
  return data;
};

// 13. Admin bulk update interval frequency
export const adminBulkUpdateInterval = async ({ monitorIds, interval, userId } = {}) => {
  const { data } = await axiosWithCreds.post("/admin/monitors/bulk/interval", {
    monitorIds,
    interval,
    userId,
  });
  return data;
};

// 14. Admin bulk delete monitors
export const adminBulkDeleteMonitors = async ({ monitorIds, userId } = {}) => {
  const { data } = await axiosWithCreds.post("/admin/monitors/bulk/delete", {
    monitorIds,
    userId,
  });
  return data;
};

// 15. Admin clear / purge check results history
export const adminClearMonitorResults = async (id, olderThanDays) => {
  const { data } = await axiosWithCreds.delete(
    `/admin/monitors/${encodeURIComponent(id)}/results`,
    {
      data: { olderThanDays },
    }
  );
  return data;
};

// 16. Admin export all monitors dataset
export const getAdminExportMonitors = async () => {
  const { data } = await axiosWithCreds.get("/admin/monitors/export");
  return data;
};

// ==========================================
// UPTIME RUNNER ENGINE MANAGEMENT API
// ==========================================

// 17. Fetch all registered uptime runners
export const getAdminRunners = async () => {
  const { data } = await axiosWithCreds.get("/admin/runners");
  return data;
};

// 18. Register a new uptime runner (local, lambda, or http)
export const adminCreateRunner = async ({ name, type, config }) => {
  const { data } = await axiosWithCreds.post("/admin/runners", {
    name,
    type,
    config,
  });
  return data;
};

// 19. Switch the globally active / default runner (sets isDefault: true atomically)
export const adminSetDefaultRunner = async (id) => {
  const { data } = await axiosWithCreds.put(`/admin/runners/${encodeURIComponent(id)}/default`);
  return data;
};

// Deprecated alias for adminSetDefaultRunner
export const adminActivateRunner = async (id) => {
  const { data } = await axiosWithCreds.put(`/admin/runners/${encodeURIComponent(id)}/activate`);
  return data;
};

// 20. Toggle runner active state (enable / disable, cannot disable default)
export const adminToggleRunner = async (id) => {
  const { data } = await axiosWithCreds.put(`/admin/runners/${encodeURIComponent(id)}/toggle`);
  return data;
};

// 21. Probe test runner connectivity and latency
export const adminTestRunner = async (id, testUrl) => {
  const body = testUrl ? { testUrl } : {};
  const { data } = await axiosWithCreds.post(
    `/admin/runners/${encodeURIComponent(id)}/test`,
    body
  );
  return data;
};

// 22. Delete an inactive runner (reassigns monitors to NULL)
export const adminDeleteRunner = async (id) => {
  const { data } = await axiosWithCreds.delete(`/admin/runners/${encodeURIComponent(id)}`);
  return data;
};

// 23. Move batch of monitors from one runner (or 'default') to another runner
export const adminMoveRunnerMonitors = async (sourceId, { toRunnerId, interval, limit, userId } = {}) => {
  const { data } = await axiosWithCreds.post(
    `/admin/runners/${encodeURIComponent(sourceId)}/move-monitors`,
    { toRunnerId, interval, limit, userId }
  );
  return data;
};

// 24. Assign a single monitor to a runner (or null for system default)
export const adminAssignMonitorRunner = async (monitorId, runnerId) => {
  const { data } = await axiosWithCreds.patch(
    `/admin/monitors/${encodeURIComponent(monitorId)}/runner`,
    { runnerId }
  );
  return data;
};

// 25. Bulk assign monitors to a runner (or null for system default)
export const adminBulkAssignMonitorRunner = async ({ monitorIds, runnerId }) => {
  const { data } = await axiosWithCreds.post("/admin/monitors/bulk-runner", {
    monitorIds,
    runnerId,
  });
  return data;
};


