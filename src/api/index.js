// Auth API
export { sendOtp, verifyOtp } from './auth';

// User API
export { registerUser, loginUser, logoutUser, getUserDetails } from './user';

// Admin API
export { getAllUsers, forceLogoutUser, deleteUser } from './admin';

// TTFB API
export { findTTFB, findTTFBAllRegions, getTtfbResults, getTtfbById, TTFB_REGIONS, ALL_REGIONS } from './ttfb';

// Lighthouse API
export { generateLighthouseReport, getLighthouseResults, getLighthouseById } from './lighthouse';

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
export { dnsLookup, lookupDnsRecords, getDnsResults, getDnsById } from './dnsType';

// Redirect Check API
export { checkRedirects, getRedirectResults } from './redirectCheck';

// WHOIS API
export { whoisLookup, getWhoisResults } from './whoisLookup';

// Socket
export {
  getSocket,
  connectSocket,
  disconnectSocket,
  subscribeToEvents,
  getConnectionState,
  subscribeToConnectionState,
  emitSocketEvent,
  emitWithAck,
  joinRoom,
  leaveRoom,
  isSocketConnected,
  SOCKET_URL,
  EMIT,
  ON,
} from './socket';

// Axios instances
export { axiosWithCreds, axiosWithoutCreds } from './axiosInstance';
