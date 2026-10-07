/**
 * FullScreenLoader — branded loading screen used for:
 *  - auth bootstrap (guards deciding where to route)
 *  - Suspense fallback for lazy-loaded routes
 */
export default function FullScreenLoader({ label = 'Loading…' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] text-[var(--muted)]"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--cyan)]" />
      <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-[0.15em]">{label}</p>
    </div>
  );
}
