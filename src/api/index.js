// Auth API
export { sendOtp, verifyOtp, loginWithGoogle } from './auth';

// User API
export { registerUser, loginUser, logoutUser, getUserDetails } from './user';

// Admin API
export {
  getAllUsers,
  forceLogoutUser,
  deleteUser,
  getAdminMonitorStats,
  getAdminMonitors,
  getAdminMonitorIncidents,
  getAdminMonitorDetails,
  adminCreateMonitor,
  adminUpdateMonitor,
  adminTriggerCheck,
  adminPauseMonitor,
  adminResumeMonitor,
  adminDeleteMonitor,
  adminBulkPauseMonitors,
  adminBulkResumeMonitors,
  adminBulkUpdateInterval,
  adminBulkDeleteMonitors,
  adminClearMonitorResults,
  getAdminExportMonitors,
} from './admin';

// Demo API (Guest session, unified polling, infrastructure health)
export {
  initializeDemoSession,
  initDemoSession,
  resetDemoSessionCache,
  getDemoSessionData,
  runDemoJob,
  getDemoStatus,
  getDemoHealth,
  pollDemoResult,
} from './demo';

// TTFB API
export {
  findTTFB,
  findTTFBAllRegions,
  getTtfbResults,
  getTtfbById,
  getTtfbStatus,
  TTFB_REGIONS,
  ALL_REGIONS,
} from './ttfb';

// Lighthouse API
export {
  generateLighthouseReport,
  getLighthouseResults,
  getLighthouseById,
  getLighthouseStatus,
} from './lighthouse';

// Uptime API
export { 
  getMonitors, 
  createMonitor, 
  updateMonitor, 
  deleteMonitor, 
  pauseMonitor, 
  resumeMonitor,
  getRunningMonitorDetails,
  getRecentMonitorResults,
  UPTIME_INTERVALS,
  UPTIME_STATUSES,
} from './uptime';

// DNS API
export {
  dnsLookup,
  lookupDnsRecords,
  getDnsResults,
  getDnsById,
  getDnsStatus,
} from './dnsType';

// Redirect Check API
export {
  checkRedirects,
  getRedirectResults,
  getRedirectById,
  getRedirectStatus,
} from './redirectCheck';

// WHOIS API
export {
  whoisLookup,
  getWhoisResults,
  getWhoisById,
  getWhoisStatus,
} from './whoisLookup';

// Socket
export {
  getSocket,
  connectSocket,
  reconnectSocket,
  disconnectSocket,
  subscribeToEvents,
  getConnectionState,
  subscribeToConnectionState,
  emitSocketEvent,
  emitWithAck,
  joinRoom,
  leaveRoom,
  isSocketConnected,
  waitForSocket,
  registerCatchupJob,
  unregisterCatchupJob,
  emitCatchup,
  resetSocketAuth,
  SOCKET_URL,
  EMIT,
  ON,
} from './socket';

// Axios instances
export { axiosWithCreds, axiosWithoutCreds, api } from './axiosInstance';
