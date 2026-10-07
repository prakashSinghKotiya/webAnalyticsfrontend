import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppProviders } from '../context';
import { ErrorBoundary, FullScreenLoader } from '../components';

/** Scrolls to top on every navigation (respects the browser's back button). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * RootLayout — wraps every route:
 *  providers → error boundary → suspense → outlet
 *
 * - AppProviders: theme, toasts, socket status, auth session bootstrap.
 * - ErrorBoundary: catches provider-level crashes.
 * - Suspense: single fallback for ALL lazy-loaded route elements.
 */
export default function RootLayout() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<FullScreenLoader label="Loading module…" />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </AppProviders>
  );
}
