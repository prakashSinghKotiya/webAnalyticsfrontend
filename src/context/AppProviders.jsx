import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthContext';
import { SocketProvider } from './SocketContext';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';

const GOOGLE_CLIENT_ID ="509013077515-94ku8d0b5ugdhf0c48lv7se278qp03od.apps.googleusercontent.com"

/**
 * AppProviders — the single place where global providers are composed.
 *
 * Kept in its own `.jsx` file (it returns JSX) so the context barrel can stay
 * a plain `.js` re-export and never collide with Vite's extension resolution
 * (`.js` is resolved before `.jsx`).
 *
 * Order matters:
 *  1. GoogleOAuth → supplies OAuth client context to auth flows
 *  2. Theme       → applies data-theme before anything paints
 *  3. Toast       → any provider/page can raise notifications
 *  4. Socket      → connection status; the socket lifecycle is driven by auth
 *  5. Auth        → session bootstrap, drives socket connect/disconnect
 */
export function AppProviders({ children }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <ToastProvider>
          <SocketProvider>
            <AuthProvider>{children}</AuthProvider>
          </SocketProvider>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default AppProviders;
