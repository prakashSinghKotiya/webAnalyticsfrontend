/**
 * Central application constants.
 * Single source of truth — never hardcode route paths, roles or storage keys.
 */

/** Route paths. Import ROUTES instead of typing string literals. */
export const ROUTES = Object.freeze({
  PUBLIC_HOME: '/',
  HOME: '/home',
  LOGIN: '/login',
  REGISTER: '/register',
  ABOUT: '/about',
  CONTACT: '/contact',
  TOOLS: '/ttfb-test',
  TOOLS_TTFB: '/ttfb-test',
  TOOLS_LIGHTHOUSE: '/fullsite-report',
  TOOLS_DNS: '/dns-checker',
  TOOLS_REDIRECTS: '/redirection-checker',
  TOOLS_WHOIS: '/whois-lookup',
  // Backward-compatibility aliases for legacy demo route keys
  DEMO_TTFB: '/ttfb-test',
  DEMO_LIGHTHOUSE: '/fullsite-report',
  DEMO_DNS: '/dns-checker',
  DEMO_REDIRECTS: '/redirection-checker',
  DEMO_WHOIS: '/whois-lookup',
  DASHBOARD: '/dashboard',
  TTFB: '/ttfb-test',
  LIGHTHOUSE: '/fullsite-report',
  UPTIME: '/uptime-monitor',
  WHOIS: '/whois-lookup',
  DNS: '/dns-checker',
  REDIRECTS: '/redirection-checker',
  ADMIN: '/admin',
  NOT_FOUND: '/404',
});

/** User roles — keep in sync with the backend. Ordered from least to most privileged. */
export const ROLES = Object.freeze({
  USER: 'User',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'SuperAdmin',
});

/** Roles allowed past the AdminRoute guard. */
export const ADMIN_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  'admin',
  'superadmin',
  'ADMIN',
  'SUPERADMIN',
]);

/** localStorage keys (prefixed to avoid collisions). */
export const STORAGE_KEYS = Object.freeze({
  THEME: 'wp-theme',
  AUTH_TOKEN: 'authToken',
  GUEST_ID: 'guestId',
});

/** Supported themes. */
export const THEMES = Object.freeze({
  DARK: 'dark',
  LIGHT: 'light',
});

/** Production subdomains configuration */
export const SUBDOMAINS = Object.freeze({
  LANDING_HOST: 'monitormyhost.com',
  APP_HOST: 'webpulse.monitormyhost.com',
});
