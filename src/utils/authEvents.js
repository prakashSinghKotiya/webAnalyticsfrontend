/**
 * Tiny event bus for auth-related signals.
 *
 * Why: the axios interceptor layer must be able to tell the AuthContext
 * "the session expired" without importing React or the context (which would
 * create a circular import). Both sides import only this module.
 */

let authExpiredHandler = null;

/**
 * Register the single handler invoked when the API layer reports a 401.
 * Returns an unsubscribe function.
 */
export function onAuthExpired(handler) {
  if (typeof handler !== 'function') return () => {};
  authExpiredHandler = handler;
  return () => {
    if (authExpiredHandler === handler) authExpiredHandler = null;
  };
}

/** Called by the axios response interceptor on 401 responses. */
export function notifyAuthExpired() {
  if (typeof authExpiredHandler === 'function') {
    try {
      authExpiredHandler();
    } catch (err) {
      // Never let a listener error break the interceptor chain.
      console.error('[authEvents] authExpired handler threw:', err);
    }
  }
}
