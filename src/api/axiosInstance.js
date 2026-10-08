import axios from "axios";
import { notifyAuthExpired } from "../utils/authEvents";

const BASE_URL = import.meta.env.VITE_API_URL ;

// Axios instance WITH credentials (for authenticated routes)
export const axiosWithCreds = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios instance WITHOUT credentials (for public routes)
export const axiosWithoutCreds = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging (dev only)
if (import.meta.env.DEV) {
  axiosWithCreds.interceptors.request.use((config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
  
  axiosWithoutCreds.interceptors.request.use((config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
}

// Response interceptors with better error handling
axiosWithCreds.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    // Global 401 handling: notify the auth layer so it can clear state and
    // let route guards redirect. Keeps session expiry in sync app-wide.
    // Requests with _skipAuthExpired (e.g. initial guest checkAuth) bypass this.
    if (status === 401 && !error?.config?._skipAuthExpired) {
      console.warn("[API] Unauthorized - session may have expired");
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
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    return Promise.reject(
      data || {
        error: error.message || "Something went wrong",
      }
    );
  }
);
