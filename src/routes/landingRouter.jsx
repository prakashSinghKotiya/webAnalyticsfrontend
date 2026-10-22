import { useEffect } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { RouteErrorElement } from '../components/ErrorBoundary';
import PublicLayout from './PublicLayout';
import FullScreenLoader from '../components/FullScreenLoader';
import { getAppUrl } from '../utils/subdomainNav';

// Public feature pages
import LandingPage from '../pages/Access/LandingPage';
import DemoTTFBPage from '../pages/Demo/DemoTTFBPage';
import DemoLighthousePage from '../pages/Demo/DemoLighthousePage';
import DemoDnsPage from '../pages/Demo/DemoDnsPage';
import DemoRedirectsPage from '../pages/Demo/DemoRedirectsPage';
import DemoWhoisPage from '../pages/Demo/DemoWhoisPage';
import AboutPage from '../pages/Access/AboutPage';
import ContactPage from '../pages/Access/ContactPage';
import NotFound from '../pages/Errors/NotFound';

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
 * Preserves query parameters across internal redirects.
 */
function RedirectWithSearch({ to }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
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
      // ── CANONICAL SERVICE TOOL DEMO ROUTES ─────────────────────────────
      { path: 'ttfb-test', element: <DemoTTFBPage /> },
      { path: 'fullsite-report', element: <DemoLighthousePage /> },
      { path: 'dns-checker', element: <DemoDnsPage /> },
      { path: 'redirection-checker', element: <DemoRedirectsPage /> },
      { path: 'whois-lookup', element: <DemoWhoisPage /> },

      // Backward compatibility redirects from /tools/* and /demo/* to canonical slugs (preserving search params)
      { path: 'tools', element: <RedirectWithSearch to="/ttfb-test" /> },
      { path: 'tools/ttfb', element: <RedirectWithSearch to="/ttfb-test" /> },
      { path: 'tools/lighthouse', element: <RedirectWithSearch to="/fullsite-report" /> },
      { path: 'tools/dns', element: <RedirectWithSearch to="/dns-checker" /> },
      { path: 'tools/redirects', element: <RedirectWithSearch to="/redirection-checker" /> },
      { path: 'tools/whois', element: <RedirectWithSearch to="/whois-lookup" /> },

      { path: 'demo', element: <RedirectWithSearch to="/ttfb-test" /> },
      { path: 'demo/ttfb', element: <RedirectWithSearch to="/ttfb-test" /> },
      { path: 'demo/lighthouse', element: <RedirectWithSearch to="/fullsite-report" /> },
      { path: 'demo/dns', element: <RedirectWithSearch to="/dns-checker" /> },
      { path: 'demo/redirects', element: <RedirectWithSearch to="/redirection-checker" /> },
      { path: 'demo/whois', element: <RedirectWithSearch to="/whois-lookup" /> },
      { path: 'demo/*', element: <RedirectWithSearch to="/ttfb-test" /> },

      // ── SEAMLESS REDIRECTS TO APP SUBDOMAIN ────────────────────────────
      { path: 'login', element: <RedirectToApp /> },
      { path: 'register', element: <RedirectToApp /> },
      { path: 'dashboard', element: <RedirectToApp /> },
      { path: 'home', element: <RedirectToApp /> },
      { path: 'uptime-monitor', element: <RedirectToApp /> },
      { path: 'uptime', element: <RedirectToApp /> },
      { path: 'ttfb', element: <RedirectWithSearch to="/ttfb-test" /> },
      { path: 'lighthouse', element: <RedirectWithSearch to="/fullsite-report" /> },
      { path: 'whois', element: <RedirectWithSearch to="/whois-lookup" /> },
      { path: 'dns', element: <RedirectWithSearch to="/dns-checker" /> },
      { path: 'redirects', element: <RedirectWithSearch to="/redirection-checker" /> },
      { path: 'admin', element: <RedirectToApp /> },

      // ── ERROR HANDLING ────────────────────────────────────────────────
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default landingRouter;

