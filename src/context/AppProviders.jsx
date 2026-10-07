import { AuthProvider } from './AuthContext';
import { SocketProvider } from './SocketContext';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';

/**
 * AppProviders — the single place where global providers are composed.
 *
 * Kept in its own `.jsx` file (it returns JSX) so the context barrel can stay
 * a plain `.js` re-export and never collide with Vite's extension resolution
 * (`.js` is resolved before `.jsx`).
 *
 * Order matters:
 *  1. Theme     → applies data-theme before anything paints
 *  2. Toast     → any provider/page can raise notifications
 *  3. Socket    → connection status; the socket lifecycle is driven by auth
 *  4. Auth      → session bootstrap, drives socket connect/disconnect
 */
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SocketProvider>
          <AuthProvider>{children}</AuthProvider>
        </SocketProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default AppProviders;