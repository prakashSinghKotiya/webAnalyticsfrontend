/**
 * Context barrel — the single entry point for every provider and hook.
 *
 * Kept as `.js` (no JSX here) so it never collides with Vite's extension
 * resolution; all JSX lives in the individual provider files.
 *
 *   import { AppProviders, useAuth, useToast } from '../context';
 */
export { AppProviders } from './AppProviders';
export { default as AppProvidersDefault } from './AppProviders';

// ── Hooks ────────────────────────────────────────────────────────────────────
export { useAuth, useAuthState, useAuthActions } from './AuthContext';
export { useSocket } from './SocketContext';
export { useTheme } from './ThemeContext';
export { useToast } from './ToastContext';

// ── Providers (for advanced/partial mounting) ───────────────────────────────
export { AuthProvider } from './AuthContext';
export { SocketProvider } from './SocketContext';
export { ThemeProvider } from './ThemeContext';
export { ToastProvider } from './ToastContext';
