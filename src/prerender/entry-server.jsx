import { renderToString } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import PublicLayout from '../routes/PublicLayout';
import LandingPage from '../pages/Access/LandingPage';
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
      { path: 'tools/ttfb', element: <DemoTTFBPage /> },
      { path: 'tools/lighthouse', element: <DemoLighthousePage /> },
      { path: 'tools/dns', element: <DemoDnsPage /> },
      { path: 'tools/redirects', element: <DemoRedirectsPage /> },
      { path: 'tools/whois', element: <DemoWhoisPage /> },
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

