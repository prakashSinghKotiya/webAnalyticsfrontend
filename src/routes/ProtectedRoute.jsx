import { Navigate, useLocation } from 'react-router-dom';
import { ADMIN_ROLES, SUPER_ADMIN_ROLES, ROUTES } from '../constants';
import { useAuthState } from '../context/AuthContext';
import FullScreenLoader from '../components/FullScreenLoader';

/**
 * Guard components.
 *
 * Auth state comes from the session bootstrap (cookie-based), so guards only
 * decide between "render", "redirect", or "wait". When a session expires
 * mid-app, the 401 interceptor clears auth state and these guards redirect
 * automatically — no manual navigation needed.
 */

function useAuthGate() {
  const { user, isAuthenticated, loading } = useAuthState();
  const location = useLocation();
  return { user, isAuthenticated, loading, location };
}

/** Renders children only for authenticated users; remembers the intended destination. */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, location } = useAuthGate();

  if (loading) return <FullScreenLoader label="Checking session…" />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}

/** Renders children only for guests; bounces logged-in users back where they came from. */
export function PublicRoute({ children }) {
  const { isAuthenticated, loading, location } = useAuthGate();

  if (loading) return <FullScreenLoader label="Checking session…" />;

  if (isAuthenticated) {
    const from = location.state?.from?.pathname;
    return <Navigate to={from && from !== ROUTES.LOGIN ? from : ROUTES.HOME} replace />;
  }

  return children;
}

/** Admin-only area: requires an authenticated user with an admin role. */
export function AdminRoute({ children }) {
  const { user, isAuthenticated, loading, location } = useAuthGate();

  if (loading) return <FullScreenLoader label="Checking session…" />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const role = (user?.role || '').toLowerCase();
  const isAllowed = role === 'admin' || role === 'superadmin' || ADMIN_ROLES.includes(user?.role);

  if (!isAllowed) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}

/** SuperAdmin-only area: requires an authenticated user with SuperAdmin role. */
export function SuperAdminRoute({ children }) {
  const { user, isAuthenticated, loading, location } = useAuthGate();

  if (loading) return <FullScreenLoader label="Checking session…" />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const role = (user?.role || '').toLowerCase();
  const isSuper = role === 'superadmin' || role === 'super_admin' || SUPER_ADMIN_ROLES.includes(user?.role);

  if (!isSuper) {
    return <Navigate to={ROUTES.ADMIN} replace />;
  }

  return children;
}
