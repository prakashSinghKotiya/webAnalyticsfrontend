import { memo } from 'react';

const RANGES = [
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
];

/**
 * TimeRangeSelector
 * Segmented pills for switching between 24h, 7d, and 30d timeframes.
 */
function TimeRangeSelector({ currentRange, onChange, disabled = false }) {
  return (
    <div
      className="inline-flex items-center rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-1 shadow-xs"
      role="group"
      aria-label="Time Range Filter"
    >
      {RANGES.map(({ key, label }) => {
        const isActive = currentRange === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            disabled={disabled}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 disabled:opacity-50 ${
              isActive
                ? 'bg-[#064e3b] dark:bg-[#065f46] text-white shadow-xs'
                : 'text-[var(--muted-2)] hover:text-[var(--text)]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default memo(TimeRangeSelector);
