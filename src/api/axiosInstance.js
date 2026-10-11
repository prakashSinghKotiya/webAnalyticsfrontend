import axios from "axios";
import { notifyAuthExpired } from "../utils/authEvents";
import {
  getAuthToken,
  getGuestId,
  setGuestId,
  removeAuthToken,
} from "../utils/tokenStorage";

const BASE_URL = import.meta.env.VITE_API_URL || "https://your-railway-app.up.railway.app";

// Axios instance WITH credentials (for authenticated & session routes)
export const axiosWithCreds = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Sends cookies for PC / Android while supporting iOS via dual-auth headers
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios instance WITHOUT credentials (for OTP/public auth routes)
export const axiosWithoutCreds = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Alias for convenience and alignment with standard API client patterns
export const api = axiosWithCreds;

// Helper to attach dual-auth headers to request config
function attachAuthHeaders(config) {
  // Ensure headers object exists
  if (!config.headers) {
    config.headers = {};
  }

  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers["x-session-id"] = token;
  }

  const guestId = getGuestId();
  if (guestId) {
    config.headers["x-guest-id"] = guestId;
  }

  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }

  return config;
}

// Helper to extract header value safely across Axios versions
function extractHeader(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") {
    return headers.get(name) || headers.get(name.toLowerCase());
  }
  return headers[name] || headers[name.toLowerCase()] || null;
}

// Attach dual-auth headers to outgoing requests
axiosWithCreds.interceptors.request.use(attachAuthHeaders, (error) => Promise.reject(error));

// Also allow public/OTP requests to attach guestId if available
axiosWithoutCreds.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {};
  const guestId = getGuestId();
  if (guestId) {
    config.headers["x-guest-id"] = guestId;
  }
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptors with dual-auth capture and robust error handling
axiosWithCreds.interceptors.response.use(
  (response) => {
    // Capture any new or refreshed x-guest-id returned by the server (iOS fallback)
    const returnedGuestId = extractHeader(response.headers, "x-guest-id");
    if (returnedGuestId && !getAuthToken()) {
      setGuestId(returnedGuestId);
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    // Global 401 handling: notify the auth layer so it can clear state and
    // let route guards redirect. Keeps session expiry in sync app-wide.
    // Requests with _skipAuthExpired (e.g. initial guest checkAuth) bypass this.
    if (status === 401 && !error?.config?._skipAuthExpired) {
      console.warn("[API] Unauthorized - session may have expired");
      removeAuthToken();
      notifyAuthExpired();
    }

    return Promise.reject(
      data || {
        error: error.message || "Something went wrong",
        status: status || 500,
      }
    );
  }
);

axiosWithoutCreds.interceptors.response.use(
  (response) => {
    const returnedGuestId = extractHeader(response.headers, "x-guest-id");
    if (returnedGuestId && !getAuthToken()) {
      setGuestId(returnedGuestId);
    }
    return response;
  },
  (error) => {
    const data = error?.response?.data;
    return Promise.reject(
      data || {
        error: error.message || "Something went wrong",
      }
    );
  }
);

export default api;
