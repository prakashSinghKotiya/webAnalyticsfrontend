import { createContext, useContext, useMemo, useState, useCallback } from 'react';

const InitialDataContext = createContext(null);

/**
 * InitialDataProvider — Provides server-rendered initial state to React components
 * during both SSR (via `initialData` prop) and client hydration (via `window.__INITIAL_DATA__`).
 *
 * This ensures that components with asynchronous data dependencies (such as hosting reviews)
 * render their complete HTML markup on the server without flashes of loading skeletons,
 * and hydrate cleanly on the client without hydration mismatches.
 */
export function InitialDataProvider({ children, initialData = null }) {
  const [data, setData] = useState(() => {
    // 1. Server-side or explicit prop injection
    if (initialData) return initialData;

    // 2. Client-side browser hydration from window.__INITIAL_DATA__
    if (typeof window !== 'undefined' && window.__INITIAL_DATA__) {
      return window.__INITIAL_DATA__;
    }

    return null;
  });

  const clearInitialData = useCallback(() => {
    setData(null);
    if (typeof window !== 'undefined') {
      window.__INITIAL_DATA__ = null;
    }
  }, []);

  const value = useMemo(() => {
    return {
      data,
      clearInitialData,
    };
  }, [data, clearInitialData]);

  return (
    <InitialDataContext.Provider value={value}>
      {children}
    </InitialDataContext.Provider>
  );
}

/**
 * Hook to access initial server-injected page data.
 * Returns the data object (e.g. { reviewsList, reviewDetail, moreReviews, url }) or null.
 */
export function useInitialData() {
  const ctx = useContext(InitialDataContext);
  return ctx?.data || null;
}

export default InitialDataContext;
