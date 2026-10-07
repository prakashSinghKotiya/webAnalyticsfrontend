import { memo } from 'react';
import { AUDIT_CATEGORIES, rateScore } from '../lighthouse.utils';

function CircularGauge({ score, label, description }) {
  const rating = rateScore(score);
  const numericScore = score != null ? Math.round(Number(score)) : 0;

  // SVG Gauge calculations
  const size = 110;
  const strokeWidth = 9;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = score != null ? circumference - (numericScore / 100) * circumference : circumference;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 text-center transition hover:border-[var(--border-mid)] hover:shadow-md">
      <div className="relative mb-3 flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="var(--ring-track)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Value Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={rating.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-['Outfit',sans-serif] text-3xl font-extrabold tracking-tight tabular-nums"
            style={{ color: rating.color }}
          >
            {score != null ? numericScore : '—'}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: rating.color }}
          >
            {rating.label}
          </span>
        </div>
      </div>

      <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
        {label}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-2)]">
        {description}
      </p>
    </div>
  );
}

function LighthouseScoresOverview({ scores }) {
  if (!scores) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {AUDIT_CATEGORIES.map((cat) => (
          <CircularGauge
            key={cat.key}
            score={scores[cat.key]}
            label={cat.label}
            description={cat.description}
          />
        ))}
      </div>

      {/* Score Rating Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-xs text-[var(--muted-2)]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--red)]" />
          <span>0–49 (Poor)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--orange)]" />
          <span>50–89 (Needs Improvement)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--green)]" />
          <span>90–100 (Good)</span>
        </div>
      </div>
    </div>
  );
}

export default memo(LighthouseScoresOverview);

