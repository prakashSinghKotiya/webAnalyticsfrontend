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
export const ADMIN_ROLES = Object.freeze([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

/** localStorage keys (prefixed to avoid collisions). */
export const STORAGE_KEYS = Object.freeze({
  THEME: 'wp-theme',
});

/** Supported themes. */
export const THEMES = Object.freeze({
  DARK: 'dark',
  LIGHT: 'light',
});
