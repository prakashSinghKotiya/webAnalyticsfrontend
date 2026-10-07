import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeToConnectionState } from '../api/socket';

const SocketContext = createContext(null);

/**
 * SocketProvider — exposes the socket connection state reactively.
 *
 * The socket itself is a singleton managed by `api/socket.js` (connected/
 * disconnected by the AuthProvider on login/logout); this context only makes
 * its status observable to the UI — connection banners, status dots, etc.
 */
export function SocketProvider({ children }) {
  const [state, setState] = useState(() => ({ status: 'idle', error: null, attempt: 0 }));

  useEffect(() => subscribeToConnectionState(setState), []);

  const value = useMemo(
    () => ({
      ...state,
      isConnected: state.status === 'connected',
      isReconnecting: state.status === 'reconnecting',
      isUnauthorized: state.status === 'unauthorized',
    }),
    [state],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/** Socket connection state: { status, error, attempt, isConnected, ... }. */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
}

export default SocketContext;
