import { memo } from 'react';

/**
 * DashboardErrorState
 * Error banner with Retry action.
 */
function DashboardErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center shadow-[var(--shadow-card)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--text)]">
        Unable to Load Telemetry Data
      </h2>
      <p className="mt-2 max-w-md text-sm text-[var(--muted-2)]">
        {message || 'An unexpected error occurred while communicating with the monitoring API.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-red-500 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry Connection
        </button>
      )}
    </div>
  );
}

export default memo(DashboardErrorState);
