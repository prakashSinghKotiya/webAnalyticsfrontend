import { useState, memo } from 'react';

/**
 * AdminRunnerTestModal — Probe tests connectivity and check latency of a specific runner.
 */
function AdminRunnerTestModal({
  open,
  runner,
  onClose,
  onTest,
  testing = false,
}) {
  const [testUrl, setTestUrl] = useState('https://httpbin.org/status/200');
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  if (!open || !runner) return null;

  const handleRunTest = async (e) => {
    e?.preventDefault();
    setTestError(null);
    setTestResult(null);

    const runnerId = runner.id;
    try {
      const res = await onTest(runnerId, testUrl.trim());
      setTestResult(res);
    } catch (err) {
      setTestError(err?.message || 'Runner test execution failed');
    }
  };

  const isUp = testResult?.ok || testResult?.status === 'UP';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div>
              <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                Probe Test Runner
              </h2>
              <p className="text-xs text-[var(--muted-2)]">
                Testing connectivity for <strong className="text-[var(--text)]">{runner.name}</strong> ({runner.type})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target test URL */}
          <form onSubmit={handleRunTest} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                Target Probe URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://httpbin.org/status/200"
                  className="flex-1 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  required
                />
                <button
                  type="submit"
                  disabled={testing}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--cyan)] px-4 py-2 font-bold text-white dark:text-slate-950 shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white dark:border-black border-t-transparent" />
                      <span>Probing…</span>
                    </>
                  ) : (
                    'Run Probe'
                  )}
                </button>
              </div>
            </div>

            {/* Quick URL presets */}
            <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
              <span>Presets:</span>
              <button
                type="button"
                onClick={() => setTestUrl('https://httpbin.org/status/200')}
                className="cursor-pointer underline hover:text-[var(--text)]"
              >
                httpbin 200
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setTestUrl('https://google.com')}
                className="cursor-pointer underline hover:text-[var(--text)]"
              >
                google.com
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setTestUrl('https://httpbin.org/status/500')}
                className="cursor-pointer underline hover:text-[var(--text)]"
              >
                httpbin 500 (Fail)
              </button>
            </div>
          </form>

          {/* Test Error */}
          {testError && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800 font-medium dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
              <strong className="block font-semibold">Test Execution Failed:</strong>
              <p className="mt-0.5">{testError}</p>
            </div>
          )}

          {/* Test Result Display */}
          {testResult && (
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text)] text-xs">Probe Telemetry</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    isUp
                      ? 'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green)]/40'
                      : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isUp ? 'bg-[var(--green)]' : 'bg-red-600 dark:bg-red-500'}`} />
                  {isUp ? 'HEALTHY (UP)' : 'FAILED (DOWN)'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-2.5">
                  <span className="text-[10px] text-[var(--muted)]">Execution Duration</span>
                  <p className="font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">
                    {testResult.ms != null ? `${testResult.ms} ms` : '—'}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-2.5">
                  <span className="text-[10px] text-[var(--muted)]">HTTP Response</span>
                  <p className="font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">
                    {testResult.httpStatus ? `HTTP ${testResult.httpStatus}` : testResult.error || 'N/A'}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-2.5">
                  <span className="text-[10px] text-[var(--muted)]">Runner Engine</span>
                  <p className="font-['JetBrains_Mono',monospace] font-bold text-[var(--cyan)] capitalize">
                    {testResult.type || runner.type}
                  </p>
                </div>
              </div>

              {testResult.error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-[11px] text-red-300">
                  <strong className="block">Reported Error:</strong>
                  {testResult.error}
                </div>
              )}

              {/* Raw Response JSON Preview */}
              {testResult.result && (
                <div>
                  <span className="text-[10px] font-semibold text-[var(--muted-2)] uppercase">Raw Probe Payload</span>
                  <pre className="mt-1 max-h-36 overflow-auto rounded-lg border border-[var(--border)] bg-black/40 p-2 font-['JetBrains_Mono',monospace] text-[10px] text-[var(--text-2)]">
                    {JSON.stringify(testResult.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Runner Configuration Details */}
          <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/30 p-3 text-[11px]">
            <span className="font-semibold text-[var(--text-2)]">Runner Metadata:</span>
            <div className="mt-1 font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted-2)] space-y-0.5">
              <p>ID: #{runner.id}</p>
              <p>Type: {runner.type}</p>
              <p>Config: {JSON.stringify(runner.config || {})}</p>
              <p>State: {runner.isActive ? 'Active (Current Global Engine)' : 'Standby'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[var(--border)] p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--surface-3)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AdminRunnerTestModal);

