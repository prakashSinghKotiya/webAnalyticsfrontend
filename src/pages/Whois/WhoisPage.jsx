import { useCallback, useState } from 'react';
import {
  WhoisHistorySection,
  WhoisInputSection,
  WhoisResultSection,
} from './components';
import useWhois from './useWhois';

/**
 * WhoisPage — Authoritative WHOIS & RDAP Domain Inspector.
 *
 * Organized strictly into 3 clear, responsive sections:
 *  - Section 1: WhoisInputSection (Domain input, presets, lookup trigger)
 *  - Section 2: WhoisResultSection (Summary stats, lifecycle dates, nameservers, DNSSEC security)
 *  - Section 3: WhoisHistorySection (MongoDB persistent query history with server-side pagination)
 */
export default function WhoisPage() {
  const {
    status,
    error,
    result,
    history,
    historyLoading,
    historyPagination,
    historyFilter,
    isLookingUp,
    lookup,
    selectEntry,
    handlePageChange,
    handleFilterChange,
    handleRefresh,
  } = useWhois();

  const [domain, setDomain] = useState('');

  const handleSubmit = useCallback(() => {
    lookup(domain);
  }, [domain, lookup]);

  const handleSelectHistory = useCallback(
    (entry) => {
      setDomain(entry.domain || '');
      selectEntry(entry);
    },
    [selectEntry],
  );

  const handleReRun = useCallback(() => {
    if (result?.domain) {
      lookup(result.domain);
    } else if (domain) {
      lookup(domain);
    }
  }, [domain, lookup, result]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* ── Section 1: Input ──────────────────────────────────────────────── */}
      <WhoisInputSection
        domain={domain}
        onDomainChange={setDomain}
        isLookingUp={isLookingUp}
        onSubmit={handleSubmit}
      />

      {/* ── Section 2: Showing Result ─────────────────────────────────────── */}
      <WhoisResultSection
        result={result}
        isLookingUp={isLookingUp}
        error={status === 'error' ? error : null}
        onReRun={handleReRun}
      />

      {/* ── Section 3: History Results ────────────────────────────────────── */}
      <WhoisHistorySection
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
