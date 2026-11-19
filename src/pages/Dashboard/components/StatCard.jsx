import { memo } from 'react';

/**
 * StatCard
 *
 * Modern stat card matching the MonitorMyHost design tokens:
 *  - Responsive padding & text
 *  - Status badge & color indicator
 *  - Theme-aware background and borders
 */
function StatCard({
  title,
  value,
  subtext,
  icon,
  badge,
  badgeType = 'neutral', // 'success' | 'warning' | 'danger' | 'neutral'
  className = '',
}) {
  const badgeStyles = {
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    neutral: 'bg-[var(--surface-2)] text-[var(--muted-2)] border-[var(--border)]',
  }[badgeType] || badgeStyles.neutral;

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-bright)] hover:shadow-[var(--shadow-card-hover)] ${className}`}
    >
      {/* Top Header: Title + Icon / Badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium tracking-wide uppercase text-[var(--muted-2)]">
          {title}
        </span>
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--cyan)]">
            {icon}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="my-2.5 flex items-baseline gap-2">
        <span className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
          {value}
        </span>
        {badge && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeStyles}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Footer Subtext / Trend */}
      {subtext && (
        <p className="truncate text-xs font-normal text-[var(--muted-2)]">
          {subtext}
        </p>
      )}
    </div>
  );
}

export default memo(StatCard);
