import { useCallback, useState } from 'react';
import {
  RedirectHistorySection,
  RedirectInputSection,
  RedirectResultSection,
} from './components';
import useRedirects from './useRedirects';

/**
 * RedirectsPage — Complete HTTP Redirect Chain Inspector.
 *
 * Organized strictly into 3 clear, responsive sections:
 *  - Section 1: RedirectInputSection (URL input, presets, trace trigger)
 *  - Section 2: RedirectResultSection (Summary stats, hop-by-hop progression, SEO diagnostics)
 *  - Section 3: RedirectHistorySection (Persistent trace history, reload, delete)
 */
export default function RedirectsPage() {
  const {
    status,
    error,
    result,
    history,
    historyLoading,
    historyPagination,
    historyFilter,
    isChecking,
    trace,
    selectEntry,
    handlePageChange,
    handleFilterChange,
    handleRefresh,
  } = useRedirects();

  const [url, setUrl] = useState('');

  const handleSubmit = useCallback(() => {
    trace(url);
  }, [trace, url]);

  const handleSelectHistory = useCallback(
    (entry) => {
      setUrl(entry.inputUrl || '');
      selectEntry(entry);
    },
    [selectEntry],
  );

  const handleReRun = useCallback(() => {
    if (result?.inputUrl) {
      trace(result.inputUrl);
    } else if (url) {
      trace(url);
    }
  }, [result, trace, url]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* ── Section 1: Input ──────────────────────────────────────────────── */}
      <RedirectInputSection
        url={url}
        onUrlChange={setUrl}
        isChecking={isChecking}
        onSubmit={handleSubmit}
      />

      {/* ── Section 2: Showing Result ─────────────────────────────────────── */}
      <RedirectResultSection
        result={result}
        isChecking={isChecking}
        error={status === 'error' ? error : null}
        onReRun={handleReRun}
      />

      {/* ── Section 3: History Results ────────────────────────────────────── */}
      <RedirectHistorySection
        history={history}
        isLoading={historyLoading}
        pagination={historyPagination}
        activeId={result?.id || result?.dbId}
        filter={historyFilter}
        onSelect={handleSelectHistory}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
