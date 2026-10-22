import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { ErrorBoundary } from '../components';
import { getRouteMetadata } from '../seo/routes.js';

/** Scrolls to top on navigation in browser environment */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}

/**
 * SEOHead — Dynamically updates <head> metadata (Title, Description, Canonical, OG, Twitter, JSON-LD)
 * on client-side SPA route transitions to ensure 100% crawlability and perfect social sharing.
 */
function SEOHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Helper to update or create meta tags
    const updateMeta = (attr, key, val) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    // Helper to update or create link tags
    const updateLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    const metadata = getRouteMetadata(pathname);

    // 404 / Unknown path handling: never cannibalize homepage metadata or canonical
    if (!metadata) {
      document.title = '404 — Page Not Found | MonitorMyHost';

      updateMeta('name', 'robots', 'noindex, nofollow');
      updateMeta('name', 'description', 'The page you requested could not be found.');

      // Remove any canonical link to prevent pointing to the homepage
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) canonicalEl.remove();

      // Remove any JSON-LD schema on 404
      const jsonLdEl = document.getElementById('json-ld-seo-live');
      if (jsonLdEl) jsonLdEl.remove();
      document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());

      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.remove();

      updateMeta('property', 'og:title', '404 — Page Not Found | MonitorMyHost');
      updateMeta('property', 'og:description', 'The page you requested could not be found.');
      updateMeta('name', 'twitter:title', '404 — Page Not Found | MonitorMyHost');
      updateMeta('name', 'twitter:description', 'The page you requested could not be found.');
      return;
    }

    // Clean up any robots noindex meta if navigating away from a 404 page
    const robotsEl = document.querySelector('meta[name="robots"]');
    if (robotsEl) robotsEl.remove();

    // Document Title
    document.title = metadata.title;

    // Standard SEO Meta
    updateMeta('name', 'description', metadata.description);
    if (metadata.keywords) updateMeta('name', 'keywords', metadata.keywords);
    if (metadata.canonical) updateLink('canonical', metadata.canonical);

    // Open Graph / Facebook / LinkedIn
    updateMeta('property', 'og:title', metadata.ogTitle || metadata.title);
    updateMeta('property', 'og:description', metadata.description);
    if (metadata.canonical) updateMeta('property', 'og:url', metadata.canonical);
    updateMeta('property', 'og:site_name', 'MonitorMyHost');
    updateMeta('property', 'og:type', 'website');
    updateMeta('property', 'og:image', 'https://monitormyhost.com/og-image.png');

    // Twitter Card
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:title', metadata.twitterTitle || metadata.title);
    updateMeta('name', 'twitter:description', metadata.description);
    updateMeta('name', 'twitter:image', 'https://monitormyhost.com/og-image.png');

    // Structured Data JSON-LD — In-place update using #json-ld-seo-live
    if (metadata.structuredData) {
      let script = document.getElementById('json-ld-seo-live');
      if (!script) {
        script = document.querySelector('script[type="application/ld+json"]');
        if (script) {
          script.id = 'json-ld-seo-live';
        } else {
          script = document.createElement('script');
          script.id = 'json-ld-seo-live';
          script.type = 'application/ld+json';
          document.head.appendChild(script);
        }
      }
      script.textContent = JSON.stringify(metadata.structuredData);

      // Clean up any duplicate application/ld+json tags that don't match our live ID
      document.querySelectorAll('script[type="application/ld+json"]:not(#json-ld-seo-live)').forEach((s) => s.remove());
    } else {
      const script = document.getElementById('json-ld-seo-live');
      if (script) script.remove();
    }
  }, [pathname]);

  return null;
}

/**
 * PublicLayout — Dedicated layout for public marketing and free tool routes.
 *
 * Rule 3 Compliant:
 * - Absolutely NO AuthProvider (no session bootstrap, no auto-login API calls)
 * - Absolutely NO SocketProvider (no socket singletons or connection state listeners)
 * - Absolutely NO GoogleOAuthProvider (no external OAuth client initialization)
 * - Pure, lightweight rendering for maximum Core Web Vitals and zero JS bloat.
 * - Statically imported public routes render immediately with zero Suspense DOM teardown.
 */
export default function PublicLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <SEOHead />
          <Outlet />
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}
