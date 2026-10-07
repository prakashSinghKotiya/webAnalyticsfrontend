import { memo } from 'react';
import { LAB_METRICS_INFO, rateMetricValue } from '../lighthouse.utils';

function LabMetricCard({ metricKey, metricData }) {
  const info = LAB_METRICS_INFO[metricKey] || {
    name: metricKey,
    short: metricKey,
    description: '',
    good: 1000,
    poor: 3000,
  };

  const rawValue = metricData?.value;
  const display = metricData?.display || (rawValue != null ? String(rawValue) : '—');
  const rating = rateMetricValue(metricKey, rawValue);

  // Calculate relative fill percentage (0 to 100) based on thresholds
  let fillPct = 50;
  if (rawValue != null) {
    const val = Number(rawValue);
    if (val <= info.good) {
      fillPct = Math.min(40, (val / info.good) * 40);
    } else if (val <= info.poor) {
      fillPct = 40 + ((val - info.good) / (info.poor - info.good)) * 35;
    } else {
      fillPct = Math.min(100, 75 + ((val - info.poor) / info.poor) * 25);
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 transition hover:border-[var(--border-mid)]">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
                {info.short}
              </span>
              <span className="truncate text-xs text-[var(--muted-2)]">({info.name})</span>
            </div>
          </div>
          <span
            className="flex-none rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              color: rating.color,
              backgroundColor: `${rating.color}18`,
              border: `1px solid ${rating.color}40`,
            }}
          >
            {rating.label}
          </span>
        </div>

        <p
          className="mt-2 font-['JetBrains_Mono',monospace] text-2xl font-bold tracking-tight tabular-nums"
          style={{ color: rating.color }}
        >
          {display}
        </p>

        <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">{info.description}</p>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-[var(--muted)]">
          <span>0</span>
          <span>&le; {info.good}{info.unit} (Good)</span>
          <span>&gt; {info.poor}{info.unit}</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bar-track)]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(5, Math.min(100, fillPct))}%`, backgroundColor: rating.color }}
          />
        </div>
      </div>
    </div>
  );
}

function LighthouseLabMetrics({ labMetrics }) {
  if (!labMetrics || Object.keys(labMetrics).length === 0) return null;

  const metricKeys = ['FCP', 'LCP', 'TBT', 'CLS', 'SpeedIndex', 'TTFB'];

  return (
    <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
            Lab Diagnostic Metrics
          </h2>
          <p className="text-xs text-[var(--muted-2)]">
            Simulated page load performance under standard network conditions
          </p>
        </div>
        <span className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--cyan)]">
          Lighthouse Engine
        </span>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricKeys.map((key) => {
          const metricData = labMetrics[key];
          return <LabMetricCard key={key} metricKey={key} metricData={metricData} />;
        })}
      </div>
    </div>
  );
}

export default memo(LighthouseLabMetrics);

