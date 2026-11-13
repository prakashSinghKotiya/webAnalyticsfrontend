import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { isLandingSubdomain } from './utils/subdomainNav';

const container = document.getElementById('root');

// Safely normalize pathnames by trimming trailing slashes (except root '/')
const normalizePath = (p) => (p ? p.replace(/\/+$/, '') || '/' : '/');
const prerenderedPath = container?.getAttribute('data-prerendered-path');
const currentPath = typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/';

// Only hydrate if:
// 1. We are in the landing domain context (monitormyhost.com), AND
// 2. The container has child DOM nodes from prerendering, AND
// 3. The prerendered path matches the current browser pathname.
// In all other cases (app subdomain dashboard.*, unknown routes, or fallback HTML),
// clear any mismatched DOM nodes and use createRoot to prevent React #418 hydration errors.
const canHydrate =
  isLandingSubdomain() &&
  container?.hasChildNodes() &&
  Boolean(prerenderedPath) &&
  normalizePath(prerenderedPath) === currentPath;

if (canHydrate) {
  hydrateRoot(
    container,
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  if (container?.hasChildNodes()) {
    container.replaceChildren();
  }
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

