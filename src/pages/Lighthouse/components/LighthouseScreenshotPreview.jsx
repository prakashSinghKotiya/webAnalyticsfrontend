import { memo, useState } from 'react';
import { exportJsonReport, relativeTime } from '../lighthouse.utils';

function LighthouseScreenshotPreview({ report, onReRun }) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const handleCopy = () => {
    if (!report.finalUrl && !report.url) return;
    navigator.clipboard.writeText(report.finalUrl || report.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    exportJsonReport(report.raw || report);
  };

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
            Audit Overview & Snapshot
          </h2>
          <p className="text-xs text-[var(--muted-2)]">
            Page capture and environment telemetry from probe execution
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--text)]"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy URL</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export JSON</span>
          </button>

          {onReRun && (
            <button
              type="button"
              onClick={onReRun}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--cyan-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--cyan)] transition hover:bg-[var(--cyan-mid)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Re-run Audit</span>
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Screenshot Viewport Mockup */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          {report.screenshot ? (
            <div className="relative max-h-80 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-black shadow-md">
              <div className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-900 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500/80" />
                <span className="h-2 w-2 rounded-full bg-yellow-500/80" />
                <span className="h-2 w-2 rounded-full bg-green-500/80" />
                <span className="ml-2 truncate font-['JetBrains_Mono',monospace] text-[10px] text-zinc-400">
                  {report.finalUrl || report.url}
                </span>
              </div>
              <img
                src={report.screenshot}
                alt="Audited page final viewport screenshot"
                className="max-h-72 w-full object-contain object-top"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex h-56 w-full flex-col items-center justify-center text-center text-xs text-[var(--muted-2)]">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mb-2 text-[var(--muted)]"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>No viewport screenshot generated</span>
            </div>
          )}
        </div>

        {/* Audit Metadata Info */}
        <div className="flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
                Final Target URL
              </p>
              <p className="mt-1 truncate font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)]">
                {report.finalUrl || report.url}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
                  Strategy
                </p>
                <p className="mt-1 font-['Outfit',sans-serif] text-sm font-bold capitalize text-[var(--text)]">
                  {report.strategy || 'mobile'}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
                  Lighthouse Version
                </p>
                <p className="mt-1 font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--cyan)]">
                  v{report.lighthouseVersion || '12.x'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
                Analyzed Time
              </p>
              <p className="mt-1 text-xs text-[var(--text-2)]">
                {new Date(report.analyzedAt).toLocaleString()} ({relativeTime(report.analyzedAt)})
              </p>
            </div>
          </div>

          {report.warnings && report.warnings.length > 0 && (
            <div className="rounded-xl border border-[var(--orange)]/30 bg-[var(--orange)]/10 p-3 text-xs text-[var(--orange)]">
              <p className="font-semibold">Audit Engine Warnings:</p>
              <ul className="mt-1 list-disc pl-4">
                {report.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(LighthouseScreenshotPreview);

