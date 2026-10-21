import { SUBDOMAINS } from '../constants';

/**
 * Subdomain and Cross-Domain Navigation Utilities
 * Enables single-build deployment across:
 *  - monitormyhost.com (Landing page & Demos)
 *  - webpulse.monitormyhost.com (Login, Register & Authenticated App)
 */

export const LANDING_HOSTNAME = SUBDOMAINS.LANDING_HOST || 'monitormyhost.com';
export const APP_HOSTNAME = SUBDOMAINS.APP_HOST || 'webpulse.monitormyhost.com';

export const LANDING_ORIGIN = 'https://monitormyhost.com';
export const APP_ORIGIN = 'https://webpulse.monitormyhost.com';

/** Check if current runtime is a local development environment */
export function isLocalhost(hostname) {
  const host = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.localhost')
  );
}

/**
 * Determines which subdomain mode is currently active.
 * Order of precedence:
 *  1. Query parameter ?subdomain=... (on localhost for quick testing)
 *  2. Session storage wp_dev_subdomain (on localhost)
 *  3. VITE_SUBDOMAIN environment variable (if provided)
 *  4. Production hostname matching:
 *     - webpulse.monitormyhost.com -> 'app'
 *     - monitormyhost.com (and www / landing aliases) -> 'landing'
 *  5. Path heuristic on localhost (/demo or / -> landing, others -> app)
 */
export function getActiveSubdomain() {
  if (typeof window === 'undefined') return 'landing';

  const hostname = window.location.hostname.toLowerCase();

  // 1 & 2: Localhost testing overrides
  if (isLocalhost(hostname)) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const querySub = urlParams.get('subdomain');
      if (querySub) {
        const normalized = querySub.toLowerCase().trim();
        sessionStorage.setItem('wp_dev_subdomain', normalized);
        return normalized;
      }

      const stored = sessionStorage.getItem('wp_dev_subdomain');
      if (stored) {
        return stored.toLowerCase().trim();
      }
    } catch {
      // Storage access may be restricted in some iframe contexts
    }
  }

  // 3: Explicit build-time or dev environment variable override
  const envSub = import.meta.env?.VITE_SUBDOMAIN;
  if (envSub) {
    return envSub.toLowerCase().trim();
  }

  // 4: Production hostname matching
  // Check App subdomain first to avoid prefix collisions
  if (
    hostname === APP_HOSTNAME ||
    hostname.startsWith('webpulse.') ||
    hostname.includes('webpulse')
  ) {
    return 'app';
  }

  // Check Landing / Main domain (monitormyhost.com, www.monitormyhost.com, landing.monitormyhost.com)
  if (
    hostname === LANDING_HOSTNAME ||
    hostname === 'www.monitormyhost.com' ||
    hostname === 'landing.monitormyhost.com' ||
    hostname.startsWith('landing.') ||
    hostname.includes('monitormyhost')
  ) {
    return 'landing';
  }

  // 5: Fallback on localhost based on current route
  if (isLocalhost(hostname)) {
    const path = window.location.pathname;
    if (path === '/' || path.startsWith('/demo')) {
      return 'landing';
    }
    return 'app';
  }

  // Default fallback is landing
  return 'landing';
}

/** Returns true if running in the Landing Subdomain / Main domain context */
export function isLandingSubdomain() {
  const sub = getActiveSubdomain();
  return (
    sub === 'landing' ||
    sub === LANDING_HOSTNAME ||
    sub === 'monitormyhost.com' ||
    sub === 'www.monitormyhost.com'
  );
}

/** Returns true if running in the App (WebPulse) Subdomain context */
export function isAppSubdomain() {
  return !isLandingSubdomain();
}

/**
 * Returns the fully-qualified base URL for the landing / main domain.
 * Hardcoded to https://monitormyhost.com (or localhost origin in dev)
 */
export function getLandingBaseUrl() {
  if (typeof window !== 'undefined' && isLocalhost(window.location.hostname)) {
    return window.location.origin;
  }
  return LANDING_ORIGIN;
}

/**
 * Returns the fully-qualified base URL for the app subdomain.
 * Hardcoded to https://webpulse.monitormyhost.com (or localhost origin in dev)
 */
export function getAppBaseUrl() {
  if (typeof window !== 'undefined' && isLocalhost(window.location.hostname)) {
    return window.location.origin;
  }
  return APP_ORIGIN;
}

/**
 * Construct an absolute URL pointing to a path on the landing / main domain.
 */
export function getLandingUrl(path = '/') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && isLocalhost(window.location.hostname)) {
    const separator = cleanPath.includes('?') ? '&' : '?';
    return `${window.location.origin}${cleanPath}${separator}subdomain=landing`;
  }
  return `${getLandingBaseUrl()}${cleanPath}`;
}

/**
 * Construct an absolute URL pointing to a path on the app subdomain.
 */
export function getAppUrl(path = '/login') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && isLocalhost(window.location.hostname)) {
    const separator = cleanPath.includes('?') ? '&' : '?';
    return `${window.location.origin}${cleanPath}${separator}subdomain=app`;
  }
  return `${getAppBaseUrl()}${cleanPath}`;
}

/** Programmatically navigate to the Login page on the app subdomain */
export function goToLogin(fromPath) {
  const path = fromPath ? `/login?from=${encodeURIComponent(fromPath)}` : '/login';
  window.location.href = getAppUrl(path);
}

/** Programmatically navigate to the Register page on the app subdomain */
export function goToRegister(fromPath) {
  const path = fromPath ? `/register?from=${encodeURIComponent(fromPath)}` : '/register';
  window.location.href = getAppUrl(path);
}

/** Programmatically navigate to an authenticated tool or dashboard */
export function goToApp(path = '/home') {
  window.location.href = getAppUrl(path);
}

/** Programmatically navigate to the public landing page */
export function goToLanding(path = '/') {
  window.location.href = getLandingUrl(path);
}
