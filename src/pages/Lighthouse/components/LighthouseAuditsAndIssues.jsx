import { memo, useMemo, useState } from 'react';

const CATEGORY_NAMES = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  seo: 'SEO',
};

function IssueRow({ issue }) {
  const isHighImpact = issue.score === 0 || (issue.savingsMs && issue.savingsMs > 300);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition hover:border-[var(--border-mid)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-['Outfit',sans-serif] text-sm font-semibold text-[var(--text)]">
            {issue.title}
          </span>
          {isHighImpact && (
            <span className="rounded-full bg-[var(--red)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--red)]">
              High Impact
            </span>
          )}
        </div>
        <p className="mt-1 truncate font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
          Audit ID: {issue.id}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {issue.savingsMs ? (
          <span className="rounded-lg border border-[var(--orange)]/30 bg-[var(--orange)]/10 px-2.5 py-1 font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--orange)]">
            Est. Savings: {Math.round(issue.savingsMs)}ms
          </span>
        ) : null}

        {issue.displayValue ? (
          <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-2.5 py-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--text-2)]">
            {issue.displayValue}
          </span>
        ) : null}

        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
          style={{
            backgroundColor: issue.score === 0 ? 'rgba(255, 77, 106, 0.15)' : 'rgba(255, 154, 0, 0.15)',
            color: issue.score === 0 ? 'var(--red)' : 'var(--orange)',
          }}
          title={`Audit Score: ${issue.score != null ? Math.round(issue.score * 100) : 0}`}
        >
          {issue.score != null ? Math.round(issue.score * 100) : '!'}
        </span>
      </div>
    </div>
  );
}

function LighthouseAuditsAndIssues({ issues }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const flattenedIssues = useMemo(() => {
    if (!issues) return [];
    const list = [];
    Object.entries(issues).forEach(([catKey, auditList]) => {
      if (Array.isArray(auditList)) {
        auditList.forEach((audit) => {
          list.push({ ...audit, categoryKey: catKey });
        });
      }
    });
    return list;
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return flattenedIssues.filter((item) => {
      const matchTab = activeTab === 'all' || item.categoryKey === activeTab;
      const matchSearch =
        !search.trim() ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.id?.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [flattenedIssues, activeTab, search]);

  if (!issues || flattenedIssues.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 text-center sm:p-8">
        <div className="flex flex-col items-center justify-center py-6">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--green-dim)] text-[var(--green)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
            All Passed! No Significant Issues Found
          </h3>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            The page passed all critical audits for performance, accessibility, best practices, and SEO.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
            Opportunities & Diagnostic Issues ({flattenedIssues.length})
          </h2>
          <p className="text-xs text-[var(--muted-2)]">
            Actionable recommendations to improve page speed and user experience
          </p>
        </div>

        {/* Search filter */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter issues…"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--cyan)] focus:outline-none"
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === 'all'
              ? 'bg-[var(--cyan)] text-black'
              : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)]'
          }`}
        >
          All ({flattenedIssues.length})
        </button>
        {Object.entries(CATEGORY_NAMES).map(([key, name]) => {
          const count = issues[key]?.length || 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === key
                  ? 'bg-[var(--cyan)] text-black'
                  : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--border-bright)]'
              }`}
            >
              {name} ({count})
            </button>
          );
        })}
      </div>

      {/* Issues list */}
      <div className="flex flex-col gap-2.5">
        {filteredIssues.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--muted-2)]">No matching audits found.</p>
        ) : (
          filteredIssues.map((issue) => (
            <IssueRow key={`${issue.categoryKey}-${issue.id}`} issue={issue} categoryKey={issue.categoryKey} />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(LighthouseAuditsAndIssues);
