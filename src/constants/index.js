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
  TOOLS: '/tools',
  TOOLS_TTFB: '/tools/ttfb',
  TOOLS_LIGHTHOUSE: '/tools/lighthouse',
  TOOLS_DNS: '/tools/dns',
  TOOLS_REDIRECTS: '/tools/redirects',
  TOOLS_WHOIS: '/tools/whois',
  // Backward-compatibility aliases for legacy demo route keys
  DEMO_TTFB: '/tools/ttfb',
  DEMO_LIGHTHOUSE: '/tools/lighthouse',
  DEMO_DNS: '/tools/dns',
  DEMO_REDIRECTS: '/tools/redirects',
  DEMO_WHOIS: '/tools/whois',
  DASHBOARD: '/dashboard',
  TTFB: '/ttfb',
  LIGHTHOUSE: '/lighthouse',
  UPTIME: '/uptime',
  WHOIS: '/whois',
  DNS: '/dns',
  REDIRECTS: '/redirects',
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
