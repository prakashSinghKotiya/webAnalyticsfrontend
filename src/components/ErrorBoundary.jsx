import { Component } from 'react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ROUTES } from '../constants';

function ErrorFallback({ title, message, detail, showHomeLink = true }) {
  return (
    <div role="alert" className="flex min-h-screen items-center justify-center bg-[var(--bg-deep)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--red)]/30 bg-[var(--red)]/10 text-[var(--red)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="font-['Outfit',sans-serif] mb-2 text-xl font-bold text-[var(--text)]">{title}</h1>
        <p className="mb-1 text-sm text-[var(--muted-2)]">{message}</p>
        {detail ? (
          <p className="font-['JetBrains_Mono',monospace] mb-6 mt-3 break-words rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left text-xs text-[var(--muted)]">
            {detail}
          </p>
        ) : null}
        {showHomeLink ? (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to={ROUTES.HOME}
              className="inline-block rounded-[10px] bg-gradient-to-br from-[var(--cyan)] to-[#0099ff] px-5 py-2.5 text-sm font-bold text-white no-underline shadow-[0_0_20px_var(--cyan-mid)] transition hover:-translate-y-px"
            >
              Back to home
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer rounded-[10px] border border-[var(--border-mid)] bg-[var(--surface-2)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-[var(--border-bright)]"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * RouteErrorElement — used as `errorElement` in the data router.
 * Catches render errors and loader/action errors for that route subtree,
 * so one broken page never takes down the whole app.
 */
export function RouteErrorElement() {
  const error = useRouteError();

  // 404s thrown via router navigation land here too.
  if (isRouteErrorResponse(error)) {
    return (
      <ErrorFallback
        title={`${error.status} ${error.statusText || 'Error'}`}
        message={error.data?.message || "The page you're looking for doesn't exist or an error occurred."}
      />
    );
  }

  const isDev = import.meta.env.DEV;
  return (
    <ErrorFallback
      title="Something went wrong"
      message="An unexpected error occurred while rendering this page."
      // Never leak stack traces to end users — dev only.
      detail={isDev ? error?.message || String(error) : undefined}
    />
  );
}

/**
 * ErrorBoundary — classic class boundary for subtrees rendered outside the
 * router's errorElement coverage (e.g. provider-level crashes in RootLayout).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Hook for future telemetry (Sentry etc.).
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          title="Something went wrong"
          message="An unexpected error occurred. Please try again."
          detail={import.meta.env.DEV ? this.state.error?.message : undefined}
        />
      );
    }
    return this.props.children;
  }
}
