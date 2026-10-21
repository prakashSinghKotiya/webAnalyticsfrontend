import { lazy, useEffect } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { RouteErrorElement } from '../components/ErrorBoundary';
import RootLayout from './RootLayout';
import FullScreenLoader from '../components/FullScreenLoader';
import { getAppUrl } from '../utils/subdomainNav';

// Public feature pages
const LandingPage = lazy(() => import('../pages/Access/LandingPage'));
const DemoTTFBPage = lazy(() => import('../pages/Demo/DemoTTFBPage'));
const DemoLighthousePage = lazy(() => import('../pages/Demo/DemoLighthousePage'));
const DemoDnsPage = lazy(() => import('../pages/Demo/DemoDnsPage'));
const DemoRedirectsPage = lazy(() => import('../pages/Demo/DemoRedirectsPage'));
const DemoWhoisPage = lazy(() => import('../pages/Demo/DemoWhoisPage'));
const NotFound = lazy(() => import('../pages/Errors/NotFound'));

/**
 * Redirects visitors who landed on an app route (e.g. /login, /dashboard)
 * while on the landing subdomain over to the WebPulse app subdomain.
 */
function RedirectToApp() {
  const location = useLocation();

  useEffect(() => {
    const targetUrl = getAppUrl(`${location.pathname}${location.search}`);
    window.location.replace(targetUrl);
  }, [location]);

  return <FullScreenLoader label="Redirecting to WebPulse..." />;
}

/**
 * Landing Domain Router (monitormyhost.com)
 * Serves only public marketing, home, and demo experiences.
 * Any request to authenticated routes is seamlessly redirected to webpulse.
 */
export const landingRouter = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      // ── PUBLIC LANDING & DEMOS ─────────────────────────────────────────
      { index: true, element: <LandingPage /> },
      { path: 'demo', element: <Navigate to="/demo/ttfb" replace /> },
      { path: 'demo/ttfb', element: <DemoTTFBPage /> },
      { path: 'demo/lighthouse', element: <DemoLighthousePage /> },
      { path: 'demo/dns', element: <DemoDnsPage /> },
      { path: 'demo/redirects', element: <DemoRedirectsPage /> },
      { path: 'demo/whois', element: <DemoWhoisPage /> },

      // ── SEAMLESS REDIRECTS TO APP SUBDOMAIN ────────────────────────────
      { path: 'login', element: <RedirectToApp /> },
      { path: 'register', element: <RedirectToApp /> },
      { path: 'dashboard', element: <RedirectToApp /> },
      { path: 'home', element: <RedirectToApp /> },
      { path: 'ttfb', element: <RedirectToApp /> },
      { path: 'lighthouse', element: <RedirectToApp /> },
      { path: 'uptime', element: <RedirectToApp /> },
      { path: 'whois', element: <RedirectToApp /> },
      { path: 'dns', element: <RedirectToApp /> },
      { path: 'redirects', element: <RedirectToApp /> },
      { path: 'admin', element: <RedirectToApp /> },

      // ── ERROR HANDLING ────────────────────────────────────────────────
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default landingRouter;

