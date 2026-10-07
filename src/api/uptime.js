import { axiosWithCreds } from "./axiosInstance";

export const UPTIME_INTERVALS = Object.freeze([
  { value: '1m', label: '1 minute (high frequency)' },
  { value: '5m', label: '5 minutes (recommended)' },
  { value: '10m', label: '10 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
]);

export const UPTIME_STATUSES = Object.freeze({
  ACTIVE: 'active',
  PAUSED: 'paused',
});

// Get all monitors for current user
export const getMonitors = async () => {
  const { data } = await axiosWithCreds.get('/uptime/monitors');
  return data;
};

// Create new monitor
export const createMonitor = async (url, interval = '5m') => {
  const { data } = await axiosWithCreds.post('/uptime/create', {
    url,
    interval,
  });
  return data;
};

// Update monitor
export const updateMonitor = async (id, { url, interval, status }) => {
  const { data } = await axiosWithCreds.put(
    `/uptime/update/${encodeURIComponent(id)}`,
    { url, interval, status }
  );
  return data;
};

// Delete monitor
export const deleteMonitor = async (id) => {
  const { data } = await axiosWithCreds.post(
    `/uptime/delete/${encodeURIComponent(id)}`
  );
  return data;
};

// Pause monitor
export const pauseMonitor = async (id) => {
  const { data } = await axiosWithCreds.patch(
    `/uptime/pause/${encodeURIComponent(id)}`
  );
  return data;
};

// Resume monitor
export const resumeMonitor = async (id) => {
  const { data } = await axiosWithCreds.patch(
    `/uptime/resume/${encodeURIComponent(id)}`
  );
  return data;
};

// Fetch single running monitor details
export const getRunningMonitorDetails = async (id) => {
  const { data } = await axiosWithCreds.get(`/uptime/monitor/${encodeURIComponent(id)}`);
  return data;
};

// Fetch recent results of a specific monitor with server-side pagination
export const getRecentMonitorResults = async (id, { page = 1, limit = 6, status } = {}) => {
  const params = { page, limit };
  if (status && status !== 'ALL') {
    params.status = status;
  }
  const { data } = await axiosWithCreds.get(
    `/uptime/monitor/${encodeURIComponent(id)}/results`,
    { params }
  );
  return data;
};
