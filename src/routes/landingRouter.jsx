import { lazy, useEffect } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { RouteErrorElement } from '../components/ErrorBoundary';
import PublicLayout from './PublicLayout';
import FullScreenLoader from '../components/FullScreenLoader';
import { getAppUrl } from '../utils/subdomainNav';

// Public feature pages
const LandingPage = lazy(() => import('../pages/Access/LandingPage'));
const DemoTTFBPage = lazy(() => import('../pages/Demo/DemoTTFBPage'));
const DemoLighthousePage = lazy(() => import('../pages/Demo/DemoLighthousePage'));
const DemoDnsPage = lazy(() => import('../pages/Demo/DemoDnsPage'));
const DemoRedirectsPage = lazy(() => import('../pages/Demo/DemoRedirectsPage'));
const DemoWhoisPage = lazy(() => import('../pages/Demo/DemoWhoisPage'));
const AboutPage = lazy(() => import('../pages/Access/AboutPage'));
const ContactPage = lazy(() => import('../pages/Access/ContactPage'));
const NotFound = lazy(() => import('../pages/Errors/NotFound'));

/**
 * Redirects visitors who landed on an app route (e.g. /login, /dashboard)
 * while on the landing subdomain over to the MonitorMyHost app subdomain.
 */
function RedirectToApp() {
  const location = useLocation();

  useEffect(() => {
    const targetUrl = getAppUrl(`${location.pathname}${location.search}`);
    window.location.replace(targetUrl);
  }, [location]);

  return <FullScreenLoader label="Redirecting to MonitorMyHost..." />;
}

/**
 * Landing Domain Router (monitormyhost.com)
 * Serves only public marketing, home, and demo experiences.
 * Any request to authenticated routes is seamlessly redirected to the app subdomain.
 */
export const landingRouter = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      // ── PUBLIC LANDING & MARKETING PAGES ──────────────────────────────
      { index: true, element: <LandingPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'about-us', element: <Navigate to="/about" replace /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'contact-me', element: <Navigate to="/contact" replace /> },
      { path: 'contact-us', element: <Navigate to="/contact" replace /> },
      { path: 'tools', element: <Navigate to="/tools/ttfb" replace /> },
      { path: 'tools/ttfb', element: <DemoTTFBPage /> },
      { path: 'tools/lighthouse', element: <DemoLighthousePage /> },
      { path: 'tools/dns', element: <DemoDnsPage /> },
      { path: 'tools/redirects', element: <DemoRedirectsPage /> },
      { path: 'tools/whois', element: <DemoWhoisPage /> },

      // Backward compatibility redirects from /demo/* to /tools/*
      { path: 'demo', element: <Navigate to="/tools/ttfb" replace /> },
      { path: 'demo/ttfb', element: <Navigate to="/tools/ttfb" replace /> },
      { path: 'demo/lighthouse', element: <Navigate to="/tools/lighthouse" replace /> },
      { path: 'demo/dns', element: <Navigate to="/tools/dns" replace /> },
      { path: 'demo/redirects', element: <Navigate to="/tools/redirects" replace /> },
      { path: 'demo/whois', element: <Navigate to="/tools/whois" replace /> },
      { path: 'demo/*', element: <Navigate to="/tools/ttfb" replace /> },

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

