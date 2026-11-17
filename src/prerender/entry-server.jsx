/* eslint-disable react-refresh/only-export-components */
import { renderToString } from 'react-dom/server';
import { createMemoryRouter, Navigate, RouterProvider, useParams, useLocation } from 'react-router-dom';
import { InitialDataProvider } from '../context/InitialDataContext';
import PublicLayout from '../routes/PublicLayout';
import LandingPage from '../pages/Access/LandingPage';
import AboutPage from '../pages/Access/AboutPage';
import ContactPage from '../pages/Access/ContactPage';
import PrivacyPolicyPage from '../pages/Access/PrivacyPolicyPage';
import TermsPage from '../pages/Access/TermsPage';
import DemoTTFBPage from '../pages/Demo/DemoTTFBPage';
import DemoLighthousePage from '../pages/Demo/DemoLighthousePage';
import DemoDnsPage from '../pages/Demo/DemoDnsPage';
import DemoRedirectsPage from '../pages/Demo/DemoRedirectsPage';
import DemoWhoisPage from '../pages/Demo/DemoWhoisPage';
import HostingReviewsListPage from '../pages/HostingReviews/HostingReviewsListPage';
import HostingReviewDetailPage from '../pages/HostingReviews/HostingReviewDetailPage';
import NotFound from '../pages/Errors/NotFound';

function HostingReviewSlugRedirect() {
  const { slug } = useParams();
  const location = useLocation();
  return <Navigate to={`/reviews/${slug || ''}${location.search}`} replace />;
}

const routes = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'about-us', element: <Navigate to="/about" replace /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'contact-me', element: <Navigate to="/contact" replace /> },
      { path: 'contact-us', element: <Navigate to="/contact" replace /> },
      { path: 'privacy', element: <PrivacyPolicyPage /> },
      { path: 'privacy-policy', element: <Navigate to="/privacy" replace /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'terms-of-service', element: <Navigate to="/terms" replace /> },
      { path: 'terms-of-use', element: <Navigate to="/terms" replace /> },
      { path: 'reviews', element: <HostingReviewsListPage /> },
      { path: 'reviews/:slug', element: <HostingReviewDetailPage /> },
      { path: 'hosting-reviews', element: <Navigate to="/reviews" replace /> },
      { path: 'hosting-reviews/:slug', element: <HostingReviewSlugRedirect /> },
      { path: 'tools', element: <Navigate to="/ttfb-test" replace /> },
      { path: 'ttfb-test', element: <DemoTTFBPage /> },
      { path: 'fullsite-report', element: <DemoLighthousePage /> },
      { path: 'dns-checker', element: <DemoDnsPage /> },
      { path: 'redirection-checker', element: <DemoRedirectsPage /> },
      { path: 'whois-lookup', element: <DemoWhoisPage /> },
      // Underscore aliases
      { path: 'ttfb_test', element: <Navigate to="/ttfb-test" replace /> },
      { path: 'fullsite_report', element: <Navigate to="/fullsite-report" replace /> },
      { path: 'dns_checker', element: <Navigate to="/dns-checker" replace /> },
      { path: 'redirection_checker', element: <Navigate to="/redirection-checker" replace /> },
      { path: 'whois_lookup', element: <Navigate to="/whois-lookup" replace /> },
      // Backward compatibility redirects for legacy /tools/* paths
      { path: 'tools/ttfb', element: <Navigate to="/ttfb-test" replace /> },
      { path: 'tools/lighthouse', element: <Navigate to="/fullsite-report" replace /> },
      { path: 'tools/dns', element: <Navigate to="/dns-checker" replace /> },
      { path: 'tools/redirects', element: <Navigate to="/redirection-checker" replace /> },
      { path: 'tools/whois', element: <Navigate to="/whois-lookup" replace /> },
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export function render(url = '/', initialData = null) {
  const router = createMemoryRouter(routes, {
    initialEntries: [url],
    initialIndex: 0,
  });
  return renderToString(
    <InitialDataProvider initialData={initialData}>
      <RouterProvider router={router} />
    </InitialDataProvider>
  );
}

