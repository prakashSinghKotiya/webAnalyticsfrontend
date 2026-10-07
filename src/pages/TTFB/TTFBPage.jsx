import { useCallback, useState } from 'react';
import { ALL_REGIONS } from '../../api/ttfb';
import HistoryPanel from './components/HistoryPanel';
import ResultPanel from './components/ResultPanel';
import UrlForm from './components/UrlForm';
import useTTFB from './useTTFB';

/**
 * TTFBPage — Time-To-First-Byte analyzer.
 *
 * Thin composition layer: all measurement logic lives in `useTTFB`, all
 * presentation lives in the memoized child panels. The only local state is the
 * form input, so the page re-renders on keystrokes while the (potentially
 * expensive) results and history panels stay put.
 */
export default function TTFBPage() {
  const {
    status,
    error,
    result,
    progress,
    history,
    historyLoading,
    historyPagination,
    historyFilter,
    isScanning,
    scan,
    selectEntry,
    fetchHistory,
    handlePageChange,
    handleFilterChange,
  } = useTTFB();

  const [url, setUrl] = useState('');
  const [region, setRegion] = useState(ALL_REGIONS);

  const handleSubmit = useCallback(() => {
    scan(url, region);
  }, [region, scan, url]);

  /** Re-run state restore: prefill the form and show the stored result. */
  const handleSelect = useCallback(
    (entry) => {
      setUrl(entry.url);
      setRegion(entry.region || ALL_REGIONS);
      selectEntry(entry);
    },
    [selectEntry],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* ── Input ───────────────────────────────────────────────────────── */}
      <section className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <header className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10" />
              <polyline points="12 12 18 6" />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)]">
              TTFB Analyzer
            </h1>
            <p className="text-xs text-[var(--muted-2)]">
              Measure time-to-first-byte from every probe region
            </p>
          </div>
        </header>

        <UrlForm
          url={url}
          region={region}
          isScanning={isScanning}
          onUrlChange={setUrl}
          onRegionChange={setRegion}
          onSubmit={handleSubmit}
        />
      </section>

      {/* ── Output ──────────────────────────────────────────────────────── */}
      <ResultPanel
        result={result}
        isScanning={isScanning}
        progress={progress}
        error={status === 'error' ? error : null}
      />

      {/* ── History ─────────────────────────────────────────────────────── */}
      <HistoryPanel
        history={history}
        isLoading={historyLoading}
        pagination={historyPagination}
        filter={historyFilter}
        activeId={result?.id || result?.dbId}
        onSelect={handleSelect}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onRefresh={fetchHistory}
      />
    </div>
  );
}
