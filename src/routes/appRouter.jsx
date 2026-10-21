import { lazy, useEffect } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { RouteErrorElement } from '../components/ErrorBoundary';
import RootLayout from './RootLayout';
import AppLayout from './AppLayout';
import { AdminRoute, ProtectedRoute, PublicRoute } from './ProtectedRoute';
import FullScreenLoader from '../components/FullScreenLoader';
import { getLandingUrl } from '../utils/subdomainNav';

// Auth pages
import Login from '../pages/Access/Login';
import Register from '../pages/Access/Register';

// Lazy-loaded application feature pages
const Home = lazy(() => import('../pages/Home/Home'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const TTFBPage = lazy(() => import('../pages/TTFB/TTFBPage'));
const LighthousePage = lazy(() => import('../pages/Lighthouse/LighthousePage'));
const UptimePage = lazy(() => import('../pages/Uptime/UptimePage'));
const WhoisPage = lazy(() => import('../pages/Whois/WhoisPage'));
const DNSPage = lazy(() => import('../pages/DnsType/DNSPage'));
const RedirectsPage = lazy(() => import('../pages/Redirects/RedirectsPage'));
const AdminPanel = lazy(() => import('../pages/Admin/AdminPanel'));
const NotFound = lazy(() => import('../pages/Errors/NotFound'));

/**
 * Redirects visitors who landed on a demo or public landing route
 * while on the app subdomain back to the landing subdomain.
 */
function RedirectToLanding() {
  const location = useLocation();

  useEffect(() => {
    const targetUrl = getLandingUrl(`${location.pathname}${location.search}`);
    window.location.replace(targetUrl);
  }, [location]);

  return <FullScreenLoader label="Redirecting to Demo..." />;
}

/**
 * App Subdomain Router (webpulse.monitormyhost.com)
 * Serves login, registration, and all authenticated monitoring services.
 */
export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      // Bare "/" on app domain redirects guests to /login and authenticated users to /home
      {
        index: true,
        element: (
          <PublicRoute>
            <Navigate to="/login" replace />
          </PublicRoute>
        ),
      },

      // ── AUTHENTICATION ROUTES ─────────────────────────────────────────
      {
        path: 'login',
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute>
            <Register />
          </PublicRoute>
        ),
      },

      // ── PROTECTED APPLICATION SHELL ───────────────────────────────────
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorElement />,
        children: [
          { path: 'home', element: <Home /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'ttfb', element: <TTFBPage /> },
          { path: 'lighthouse', element: <LighthousePage /> },
          { path: 'uptime', element: <UptimePage /> },
          { path: 'whois', element: <WhoisPage /> },
          { path: 'dns', element: <DNSPage /> },
          { path: 'redirects', element: <RedirectsPage /> },
          {
            path: 'admin',
            element: (
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            ),
          },
        ],
      },

      // ── DEMO ROUTES REDIRECT TO LANDING SUBDOMAIN ──────────────────────
      { path: 'demo', element: <RedirectToLanding /> },
      { path: 'demo/*', element: <RedirectToLanding /> },

      // ── ERRORS ─────────────────────────────────────────────────────────
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default appRouter;

