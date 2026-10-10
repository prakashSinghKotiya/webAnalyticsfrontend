import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RouteErrorElement } from '../components/ErrorBoundary';

import RootLayout from './RootLayout';
import AppLayout from './AppLayout';
import { AdminRoute, ProtectedRoute, PublicRoute } from './ProtectedRoute';

// Auth pages — in the initial bundle for fastest first paint
import Login from '../pages/Access/Login';
import Register from '../pages/Access/Register';

// Lazy-loaded feature pages — one chunk each
const LandingPage   = lazy(() => import('../pages/Access/LandingPage'));
const DemoTTFBPage = lazy(() => import('../pages/Demo/DemoTTFBPage'));
const DemoLighthousePage = lazy(() => import('../pages/Demo/DemoLighthousePage'));
const DemoDnsPage = lazy(() => import('../pages/Demo/DemoDnsPage'));
const DemoRedirectsPage = lazy(() => import('../pages/Demo/DemoRedirectsPage'));
const DemoWhoisPage = lazy(() => import('../pages/Demo/DemoWhoisPage'));
const Home          = lazy(() => import('../pages/Home/Home'));
const Dashboard     = lazy(() => import('../pages/Dashboard/Dashboard'));
const TTFBPage      = lazy(() => import('../pages/TTFB/TTFBPage'));
const LighthousePage = lazy(() => import('../pages/Lighthouse/LighthousePage'));
const UptimePage    = lazy(() => import('../pages/Uptime/UptimePage'));
const WhoisPage     = lazy(() => import('../pages/Whois/WhoisPage'));
const DNSPage       = lazy(() => import('../pages/DnsType/DNSPage'));
const RedirectsPage = lazy(() => import('../pages/Redirects/RedirectsPage'));
const AdminPanel    = lazy(() => import('../pages/Admin/AdminPanel'));
const NotFound      = lazy(() => import('../pages/Errors/NotFound'));

/**
 * Route tree:
 *
 *  /                  → RootLayout (providers + error boundary + suspense)
 *    index            → LandingPage          (public)
 *    /demo            → Navigate to /demo/ttfb
 *    /demo/ttfb       → DemoTTFBPage         (public demo)
 *    /demo/lighthouse → DemoLighthousePage   (public demo)
 *    /demo/dns        → DemoDnsPage          (public demo)
 *    /demo/redirects  → DemoRedirectsPage    (public demo)
 *    /demo/whois      → DemoWhoisPage        (public demo)
 *    /login           → PublicRoute → Login  (guest only, bounces authed users)
 *    /register        → PublicRoute → Register
 *    ProtectedRoute → AppLayout (top-nav shell — all tool pages live here)
 *      /dashboard
 *      /ttfb
 *      /lighthouse
 *      /uptime
 *      /whois
 *      /dns
 *      /redirects
 *      /admin         → AdminRoute (role-gated)
 *    /404  *          → NotFound
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      // ── PUBLIC ─────────────────────────────────────────────────────────
      { index: true, element: <LandingPage /> },
      { path: 'demo', element: <Navigate to="/demo/ttfb" replace /> },
      { path: 'demo/ttfb', element: <DemoTTFBPage /> },
      { path: 'demo/lighthouse', element: <DemoLighthousePage /> },
      { path: 'demo/dns', element: <DemoDnsPage /> },
      { path: 'demo/redirects', element: <DemoRedirectsPage /> },
      { path: 'demo/whois', element: <DemoWhoisPage /> },
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

      // ── PROTECTED SHELL ────────────────────────────────────────────────
      // Single ProtectedRoute wraps AppLayout (sidebar + topbar).
      // All tool pages are children so they share the shell automatically.
      {
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorElement />,
        children: [
          { path: 'home',       element: <Home /> },
          { path: 'dashboard',  element: <Dashboard /> },
          { path: 'ttfb',       element: <TTFBPage /> },
          { path: 'lighthouse', element: <LighthousePage /> },
          { path: 'uptime',     element: <UptimePage /> },
          { path: 'whois',      element: <WhoisPage /> },
          { path: 'dns',        element: <DNSPage /> },
          { path: 'redirects',  element: <RedirectsPage /> },
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

      // ── ERRORS ─────────────────────────────────────────────────────────
      { path: '404', element: <NotFound /> },
      { path: '*',   element: <NotFound /> },
    ],
  },
]);

export default router;
