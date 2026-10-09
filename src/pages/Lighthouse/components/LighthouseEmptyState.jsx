import { memo } from 'react';

const HIGHLIGHTS = [
  {
    title: '4 Core Pillars',
    desc: 'Comprehensive score analysis across Performance, Accessibility, Best Practices, and SEO.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    title: 'Core Web Vitals',
    desc: 'Real user field metrics (CrUX) for LCP, INP, and CLS over the last 28 days of traffic.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: 'Lab Diagnostics',
    desc: 'Simulated throttling benchmarks for FCP, LCP, TBT, Speed Index, and network response.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: 'Opportunities & Savings',
    desc: 'Granular optimization issues with estimated millisecond savings and recommendations.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

function LighthouseEmptyState() {
  return (
    <div className="fade-up rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-10">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)]">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </span>

        <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)] sm:text-2xl">
          Automated FullSite Performance Audits
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-2)]">
          Audit any public web page URL using Google PageSpeed Insights engine. Enter a target address above to
          generate a comprehensive report in real time.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HIGHLIGHTS.map((h, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition hover:border-[var(--border-mid)]"
          >
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--cyan-dim)] text-[var(--cyan)]">
              {h.icon}
            </div>
            <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">{h.title}</h3>
            <p className="mt-1 text-xs text-[var(--muted-2)] leading-relaxed">{h.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(LighthouseEmptyState);

