import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { ErrorBoundary, FullScreenLoader } from '../components';
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
    const metadata = getRouteMetadata(pathname);
    if (!metadata) return;

    // Document Title
    document.title = metadata.title;

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

    // Structured Data JSON-LD
    if (metadata.structuredData) {
      let script = document.getElementById('json-ld-seo-live');
      if (!script) {
        script = document.createElement('script');
        script.id = 'json-ld-seo-live';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(metadata.structuredData);
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
 */
export default function PublicLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <SEOHead />
          <Suspense fallback={<FullScreenLoader label="Loading tool…" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}


