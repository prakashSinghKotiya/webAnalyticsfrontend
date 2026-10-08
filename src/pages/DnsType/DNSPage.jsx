import { useCallback, useState } from 'react';
import {
  DnsHistorySection,
  DnsInputSection,
  DnsResultSection,
} from './components';
import useDns from './useDns';

/**
 * DNSPage — Authoritative Domain Name System (DNS) Record Inspector.
 *
 * Organized strictly into 3 clear, responsive sections:
 *  - Section 1: DnsInputSection (Domain input, record selector pills, presets, query trigger)
 *  - Section 2: DnsResultSection (DNSChecker-style record dropdown accordion, stats, utilities, security insights)
 *  - Section 3: DnsHistorySection (MongoDB persistent query history with server-side pagination)
 */
export default function DNSPage() {
  const {
    status,
    error,
    result,
    history,
    historyLoading,
    historyPagination,
    historyFilter,
    isScanning,
    scan,
    selectEntry,
    handlePageChange,
    handleFilterChange,
    handleRefresh,
  } = useDns();

  const [domain, setDomain] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const handleSubmit = useCallback(() => {
    scan(domain);
  }, [domain, scan]);

  const handleSelectHistory = useCallback(
    (entry) => {
      setDomain(entry.hostname || entry.url || '');
      selectEntry(entry);
    },
    [selectEntry],
  );

  const handleReRun = useCallback(() => {
    if (result?.hostname) {
      scan(result.hostname);
    } else if (domain) {
      scan(domain);
    }
  }, [domain, result, scan]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* ── Section 1: Input ──────────────────────────────────────────────── */}
      <DnsInputSection
        domain={domain}
        onDomainChange={setDomain}
        isScanning={isScanning}
        onSubmit={handleSubmit}
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      {/* ── Section 2: Showing Result ─────────────────────────────────────── */}
      <DnsResultSection
        result={result}
        isScanning={isScanning}
        error={status === 'error' ? error : null}
        onReRun={handleReRun}
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      {/* ── Section 3: History Results ────────────────────────────────────── */}
      <DnsHistorySection
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
