import { renderToString } from 'react-dom/server';
import { createMemoryRouter, Navigate, RouterProvider } from 'react-router-dom';
import PublicLayout from '../routes/PublicLayout';
import LandingPage from '../pages/Access/LandingPage';
import AboutPage from '../pages/Access/AboutPage';
import ContactPage from '../pages/Access/ContactPage';
import DemoTTFBPage from '../pages/Demo/DemoTTFBPage';
import DemoLighthousePage from '../pages/Demo/DemoLighthousePage';
import DemoDnsPage from '../pages/Demo/DemoDnsPage';
import DemoRedirectsPage from '../pages/Demo/DemoRedirectsPage';
import DemoWhoisPage from '../pages/Demo/DemoWhoisPage';
import NotFound from '../pages/Errors/NotFound';

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
      { path: 'tools', element: <Navigate to="/ttfb-test" replace /> },
      { path: 'ttfb-test', element: <DemoTTFBPage /> },
      { path: 'fullsite-report', element: <DemoLighthousePage /> },
      { path: 'dns-checker', element: <DemoDnsPage /> },
      { path: 'redirection-checker', element: <DemoRedirectsPage /> },
      { path: 'whois-lookup', element: <DemoWhoisPage /> },
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

export function render(url = '/') {
  const router = createMemoryRouter(routes, {
    initialEntries: [url],
    initialIndex: 0,
  });
  return renderToString(<RouterProvider router={router} />);
}

