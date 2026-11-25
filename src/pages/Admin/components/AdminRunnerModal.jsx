import { useState, useEffect, memo } from 'react';

const ENV_VAR_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

const extractLambdaRegion = (rawUrl) => {
  try {
    const { hostname } = new URL(rawUrl.trim());
    const match = hostname.match(/\.lambda-url\.([a-z0-9-]+)\.on\.aws$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

/**
 * AdminRunnerModal — Dialog to register or edit an Uptime Execution Runner.
 * Supported types: AWS Lambda (Function URL), Remote HTTP VPS, or Local Worker Pool.
 */
function AdminRunnerModal({
  open,
  mode = 'create', // 'create' | 'edit'
  runner = null,
  onClose,
  onSubmit,
  loading = false,
}) {
  const isEdit = mode === 'edit' && Boolean(runner);

  const [name, setName] = useState('');
  const [type, setType] = useState('lambda'); // 'local' | 'lambda' | 'http'
  const [lambdaUrl, setLambdaUrl] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [region, setRegion] = useState('ap-south-1');
  const [regionTouched, setRegionTouched] = useState(false);
  const [httpUrl, setHttpUrl] = useState('');
  const [secretEnv, setSecretEnv] = useState('UPTIME_LAMBDA_SECRET');
  const [batchSize, setBatchSize] = useState('50');
  const [concurrency, setConcurrency] = useState('20');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) {
      setName('');
      setType('lambda');
      setLambdaUrl('');
      setFunctionName('');
      setRegion('ap-south-1');
      setRegionTouched(false);
      setHttpUrl('');
      setSecretEnv('UPTIME_LAMBDA_SECRET');
      setBatchSize('50');
      setConcurrency('20');
      setValidationError('');
      return;
    }

    if (isEdit && runner) {
      const cfg = runner.config || {};
      setName(runner.name || '');
      setType(runner.type || 'lambda');
      setLambdaUrl(runner.type === 'lambda' ? (cfg.url || '') : '');
      setFunctionName(cfg.functionName || '');
      setRegion(cfg.region || 'ap-south-1');
      setRegionTouched(Boolean(cfg.region));
      setHttpUrl(runner.type === 'http' ? (cfg.url || '') : '');
      setSecretEnv(
        cfg.secretEnv ||
          (runner.type === 'lambda' ? 'UPTIME_LAMBDA_SECRET' : 'RUNNER_SECRET')
      );
      setBatchSize(cfg.batchSize ? String(cfg.batchSize) : '50');
      setConcurrency(cfg.concurrency ? String(cfg.concurrency) : '20');
      setValidationError('');
    } else {
      setName('');
      setType('lambda');
      setLambdaUrl('');
      setFunctionName('');
      setRegion('ap-south-1');
      setRegionTouched(false);
      setHttpUrl('');
      setSecretEnv('UPTIME_LAMBDA_SECRET');
      setBatchSize('50');
      setConcurrency('20');
      setValidationError('');
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, isEdit, runner]);

  if (!open) return null;

  const handleTypeSelect = (nextType) => {
    if (isEdit) return;
    setType(nextType);
    if (nextType === 'lambda' && (!secretEnv || secretEnv === 'RUNNER_SECRET')) {
      setSecretEnv('UPTIME_LAMBDA_SECRET');
    } else if (nextType === 'http' && (!secretEnv || secretEnv === 'UPTIME_LAMBDA_SECRET')) {
      setSecretEnv('RUNNER_SECRET');
    }
  };

  const handleLambdaUrlChange = (value) => {
    setLambdaUrl(value);
    if (!regionTouched) {
      const detected = extractLambdaRegion(value);
      if (detected) {
        setRegion(detected);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Runner name is required.');
      return;
    }

    const config = {};
    const parsedBatch = parseInt(batchSize, 10);
    if (batchSize !== '' && !Number.isNaN(parsedBatch)) {
      if (parsedBatch < 10 || parsedBatch > 100) {
        setValidationError('Batch size must be between 10 and 100 monitors per job.');
        return;
      }
      config.batchSize = parsedBatch;
    }

    if (type === 'lambda') {
      const trimmedUrl = lambdaUrl.trim();
      if (!trimmedUrl) {
        setValidationError('AWS Lambda Function URL is required (e.g. https://xxxx.lambda-url.ap-south-1.on.aws/).');
        return;
      }
      if (!trimmedUrl.startsWith('https://')) {
        setValidationError('AWS Lambda Function URL must strictly use HTTPS.');
        return;
      }
      try {
        new URL(trimmedUrl);
      } catch {
        setValidationError('Invalid AWS Lambda Function URL format.');
        return;
      }

      const trimmedSecretEnv = secretEnv.trim() || 'UPTIME_LAMBDA_SECRET';
      if (!ENV_VAR_NAME_REGEX.test(trimmedSecretEnv)) {
        setValidationError('Secret env var name must contain only letters, numbers, and underscores (e.g. LAMBDA_US_EAST_SECRET).');
        return;
      }

      config.url = trimmedUrl;
      config.secretEnv = trimmedSecretEnv;
      if (region.trim()) {
        config.region = region.trim();
      }
      if (functionName.trim()) {
        config.functionName = functionName.trim();
      }
    } else if (type === 'http') {
      const trimmedUrl = httpUrl.trim();
      if (!trimmedUrl) {
        setValidationError('Remote runner endpoint URL is required.');
        return;
      }
      if (!trimmedUrl.startsWith('https://')) {
        setValidationError('Remote runner URL must strictly use HTTPS (e.g. https://runner.domain.com/run-checks).');
        return;
      }
      const trimmedSecretEnv = secretEnv.trim() || 'RUNNER_SECRET';
      if (!ENV_VAR_NAME_REGEX.test(trimmedSecretEnv)) {
        setValidationError('Secret env var name must contain only letters, numbers, and underscores.');
        return;
      }
      config.url = trimmedUrl;
      config.secretEnv = trimmedSecretEnv;
    } else if (type === 'local') {
      const parsedConc = parseInt(concurrency, 10);
      if (Number.isNaN(parsedConc) || parsedConc < 1 || parsedConc > 100) {
        setValidationError('Local concurrency must be between 1 and 100.');
        return;
      }
      config.concurrency = parsedConc;
    }

    try {
      await onSubmit({
        name: trimmedName,
        type,
        config,
      });
    } catch (err) {
      setValidationError(err?.message || err?.error || 'Failed to save runner.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </div>
            <div>
              <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                {isEdit ? `Edit Runner — ${runner.name}` : 'Register Execution Runner'}
              </h2>
              <p className="text-xs text-[var(--muted-2)]">
                {isEdit
                  ? 'Update endpoint URL, secret env var mapping, region, or batch size'
                  : 'Configure a stateless probe execution runner for batched uptime checks'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {validationError && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800 font-medium dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
              {validationError}
            </div>
          )}

          {/* Runner Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
              Runner Display Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AWS Lambda Mumbai, AWS Lambda Singapore, Secondary VPS"
              className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]"
              required
            />
          </div>

          {/* Runner Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5">
              Runner Execution Engine {isEdit ? '(Locked)' : '*'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'lambda',
                  title: 'AWS Lambda',
                  desc: 'Function URL invocation',
                  badge: 'Recommended',
                },
                {
                  id: 'http',
                  title: 'Remote HTTP',
                  desc: 'Dedicated VPS probe',
                  badge: 'Distributed',
                },
                {
                  id: 'local',
                  title: 'Local Process',
                  desc: 'Bounded worker pool',
                  badge: 'Internal',
                },
              ].map((opt) => {
                const isSelected = type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isEdit}
                    onClick={() => handleTypeSelect(opt.id)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      isEdit ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                    } ${
                      isSelected
                        ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-[0_0_12px_var(--cyan-dim)]'
                        : 'border-[var(--border-mid)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{opt.title}</span>
                      <span className="text-[9px] rounded bg-[var(--surface-3)] px-1 py-0.2 text-[var(--muted-2)] font-mono">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--muted-2)] leading-tight">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type-Specific Configurations */}
          {type === 'lambda' && (
            <div className="space-y-3 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/40 p-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                  AWS Lambda Function URL (Strict HTTPS) *
                </label>
                <input
                  type="url"
                  value={lambdaUrl}
                  onChange={(e) => handleLambdaUrlChange(e.target.value)}
                  placeholder="https://xxxxxxxxxxxxxxxx.lambda-url.ap-south-1.on.aws/"
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  required
                />
                <p className="mt-1 text-[10px] text-[var(--muted-2)]">
                  Each Lambda instance has its own Function URL. Region is auto-detected from AWS URLs.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                    Secret Env Var Name
                  </label>
                  <input
                    type="text"
                    value={secretEnv}
                    onChange={(e) => setSecretEnv(e.target.value)}
                    placeholder="UPTIME_LAMBDA_SECRET"
                    className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  />
                  <p className="mt-1 text-[10px] text-[var(--muted-2)]">
                    Backend <code className="text-[var(--cyan)]">.env</code> key sent as <code className="text-[var(--cyan)]">x-runner-secret</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                    AWS Region
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => {
                      setRegionTouched(true);
                      setRegion(e.target.value);
                    }}
                    placeholder="e.g. ap-south-1, us-east-1"
                    className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                    Lambda Function Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                    placeholder="e.g. uptime-checker-mumbai"
                    className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                    Batch Size (10-100)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  />
                </div>
              </div>
            </div>
          )}

          {type === 'http' && (
            <div className="space-y-3 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/40 p-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                  Remote Endpoint URL (Strict HTTPS) *
                </label>
                <input
                  type="url"
                  value={httpUrl}
                  onChange={(e) => setHttpUrl(e.target.value)}
                  placeholder="https://runner1.yourdomain.com/run-checks"
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  required
                />
                <p className="mt-1 text-[10px] text-[var(--muted-2)]">
                  The backend validates this URL and blocks private/SSRF IP ranges.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                    Secret Env Var Name
                  </label>
                  <input
                    type="text"
                    value={secretEnv}
                    onChange={(e) => setSecretEnv(e.target.value)}
                    placeholder="RUNNER_SECRET"
                    className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                    Batch Size (10-100)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                  />
                </div>
              </div>
            </div>
          )}

          {type === 'local' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/40 p-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                  Worker Pool Concurrency
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={concurrency}
                  onChange={(e) => setConcurrency(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                />
                <p className="mt-1 text-[10px] text-[var(--muted-2)]">
                  Simultaneous probe sockets per batch.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1">
                  Batch Size (10-100)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 font-['JetBrains_Mono',monospace] text-xs text-[var(--text)] outline-none focus:border-[var(--cyan)]"
                />
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)]/60 p-3 text-[11px] text-[var(--muted-2)]">
            <div className="flex items-start gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>
                <strong className="text-[var(--text)]">Zero-Secrets Database Policy:</strong> Only the env var name (e.g. <code className="text-[var(--cyan)]">UPTIME_LAMBDA_SECRET</code> or <code className="text-[var(--cyan)]">LAMBDA_US_EAST_SECRET</code>) is stored in PostgreSQL; the actual secret value stays strictly in backend <code className="text-[var(--cyan)]">.env</code>.
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--surface-3)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--cyan)] px-5 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white dark:border-black border-t-transparent" />
                  <span>{isEdit ? 'Saving…' : 'Registering…'}</span>
                </>
              ) : isEdit ? (
                'Save Runner Config'
              ) : (
                'Create New Server'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(AdminRunnerModal);
