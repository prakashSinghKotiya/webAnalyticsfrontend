import { axiosWithCreds } from "./axiosInstance";

// ==========================================
// USER ACCOUNT RBAC API
// ==========================================

// Admin: Get all users (paginated with optional search)
export const getAllUsers = async (page = 1, limit = 10, search = '') => {
  const params = { page, limit };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const { data } = await axiosWithCreds.get("/admin/getusers", {
    params,
  });
  return data;
};

// Admin: Force logout a user
export const forceLogoutUser = async (userId) => {
  const { data } = await axiosWithCreds.post(`/admin/${userId}/logout`);
  return data;
};

// Admin: Soft delete a user
export const deleteUser = async (userId) => {
  const { data } = await axiosWithCreds.post(`/admin/${userId}`);
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
  userId,
  search,
  sortBy = "createdAt",
  order = "desc",
} = {}) => {
  const params = { page, limit, sortBy, order };
  if (status && status !== "all") params.status = status;
  if (interval && interval !== "all") params.interval = interval;
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
export const getAdminMonitorDetails = async (id) => {
  const { data } = await axiosWithCreds.get(`/admin/monitors/${encodeURIComponent(id)}`);
  return data;
};

// 5. Admin provision / create a new monitor
export const adminCreateMonitor = async ({ url, interval = "5m", userId }) => {
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

