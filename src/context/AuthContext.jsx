import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  getUserDetails,
  loginUser as apiLogin,
  logoutUser as apiLogout,
  registerUser as apiRegister,
  sendOtp as apiSendOtp,
} from '../api';
import { connectSocket, reconnectSocket, disconnectSocket } from '../api/socket';
import { onAuthExpired } from '../utils/authEvents';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getGuestId,
  removeGuestId,
} from '../utils/tokenStorage';

/**
 * Auth is split into two contexts:
 *
 *  - AuthStateContext  → user, isAuthenticated, loading (changes often)
 *  - AuthActionsContext → login/logout/register/... (stable references)
 *
 * Components that only trigger actions (e.g. a logout button) subscribe to
 * AuthActionsContext and do NOT re-render when auth state changes — a key
 * scalability win as the app grows.
 */

const AuthStateContext = createContext(null);
const AuthActionsContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** Fetch the session from the backend (dual-auth: token header + cookie). */
  const checkAuth = useCallback(async () => {
    try {
      const userData = await getUserDetails();
      if (!mountedRef.current) return null;
      setUser(userData);
      setIsAuthenticated(true);
      connectSocket();
      return userData;
    } catch {
      if (!mountedRef.current) return null;
      // If token is invalid or session has expired, clean up token
      removeAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Restore session once on mount (async bootstrap — state updates resolve
  // after the fetch, not synchronously in the effect body).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async session bootstrap
    checkAuth();
  }, [checkAuth]);

  // Global 401 sync: any API call that returns 401 clears auth state here.
  // Protected routes then redirect automatically via the guards — no
  // navigation code needed and no stale session anywhere in the UI.
  useEffect(() => onAuthExpired(() => {
    removeAuthToken();
    setUser(null);
    setIsAuthenticated(false);
    reconnectSocket();
  }), []);

  // Cross-tab authentication synchronization (syncs login/logout across tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        if (e.newValue) {
          checkAuth();
        } else {
          setUser(null);
          setIsAuthenticated(false);
          reconnectSocket();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  /* ------------------------- actions (stable) ------------------------- */

  const sendOtp = useCallback(async (email) => apiSendOtp(email), []);

  const register = useCallback(
    async ({ name, email, password, otp }) => {
      const guestId = getGuestId();
      return apiRegister({ name, email, password, otp, guestId });
    },
    [],
  );

  const login = useCallback(
    async (credentials) => {
      const guestId = getGuestId();
      const response = await apiLogin({ ...credentials, guestId });

      // Save token for cross-domain headers (iOS Safari support)
      const token = response?.token || response?.sessionId;
      if (token) {
        setAuthToken(token);
        removeGuestId(); // Clean up guest state once user is authenticated
      }

      // Immediately hydrate user object if returned by login payload
      if (response?.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      }

      // Reconnect socket with the new token to join the user's room
      reconnectSocket();

      // Hydrate full session details from backend
      await checkAuth();

      return response;
    },
    [checkAuth],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      // Even if the server call fails, clear local state — never trap the user.
      console.error('[auth] logout error:', error);
    } finally {
      removeAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      // Reconnect socket without auth tokens (can connect as guest when demo is used)
      reconnectSocket();
    }
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const actions = useMemo(
    () => ({ login, logout, register, sendOtp, updateUser, checkAuth }),
    [login, logout, register, sendOtp, updateUser, checkAuth],
  );

  const state = useMemo(
    () => ({ user, isAuthenticated, loading }),
    [user, isAuthenticated, loading],
  );

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthStateContext.Provider value={state}>{children}</AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  );
}

/** Read-only auth state: { user, isAuthenticated, loading }. */
export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (!context) throw new Error('useAuthState must be used within an AuthProvider');
  return context;
}

/** Stable auth actions: { login, logout, register, sendOtp, updateUser, checkAuth }. */
export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (!context) throw new Error('useAuthActions must be used within an AuthProvider');
  return context;
}

/**
 * Convenience hook — state + actions together.
 * Prefer useAuthState / useAuthActions in performance-sensitive components.
 */
export function useAuth() {
  return { ...useAuthState(), ...useAuthActions() };
}

export default AuthStateContext;
