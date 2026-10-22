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

  return <FullScreenLoader label="Redirecting to Tools..." />;
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
          { path: 'ttfb-test', element: <TTFBPage /> },
          { path: 'fullsite-report', element: <LighthousePage /> },
          { path: 'uptime-monitor', element: <UptimePage /> },
          { path: 'whois-lookup', element: <WhoisPage /> },
          { path: 'dns-checker', element: <DNSPage /> },
          { path: 'redirection-checker', element: <RedirectsPage /> },
          // Legacy authenticated routes backward compatibility
          { path: 'ttfb', element: <Navigate to="/ttfb-test" replace /> },
          { path: 'lighthouse', element: <Navigate to="/fullsite-report" replace /> },
          { path: 'uptime', element: <Navigate to="/uptime-monitor" replace /> },
          { path: 'whois', element: <Navigate to="/whois-lookup" replace /> },
          { path: 'dns', element: <Navigate to="/dns-checker" replace /> },
          { path: 'redirects', element: <Navigate to="/redirection-checker" replace /> },
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

      // ── PUBLIC MARKETING & TOOLS ROUTES REDIRECT TO MAIN DOMAIN ───────
      { path: 'about', element: <RedirectToLanding /> },
      { path: 'about-us', element: <RedirectToLanding /> },
      { path: 'contact', element: <RedirectToLanding /> },
      { path: 'contact-me', element: <RedirectToLanding /> },
      { path: 'contact-us', element: <RedirectToLanding /> },
      { path: 'tools', element: <RedirectToLanding /> },
      { path: 'tools/*', element: <RedirectToLanding /> },
      { path: 'demo', element: <RedirectToLanding /> },
      { path: 'demo/*', element: <RedirectToLanding /> },

      // ── ERRORS ─────────────────────────────────────────────────────────
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default appRouter;

