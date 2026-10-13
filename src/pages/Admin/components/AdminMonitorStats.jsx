import { memo } from 'react';

/**
 * AdminMonitorStats — Minimalist KPI Metric Cards for Uptime Telemetry.
 */
function AdminMonitorStats({ stats, onSelectStatusFilter }) {
  if (!stats) return null;

  const total = stats.totalMonitors || 0;
  const active = stats.activeMonitors || 0;
  const paused = stats.pausedMonitors || 0;
  const up = stats.health?.up || 0;
  const down = stats.health?.down || 0;
  const pending = stats.health?.pending || 0;
  const totalChecks = stats.totalChecksRecorded || 0;
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;
  const upPercent = total > 0 ? Math.round((up / total) * 100) : 0;

  const cards = [
    {
      id: 'total',
      title: 'Total Monitors',
      value: total,
      subtitle: `${stats.totalUsersWithMonitors || 0} unique tenant owners`,
      color: 'var(--cyan)',
      bgColor: 'var(--cyan-dim)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      badge: `${totalChecks.toLocaleString()} checks run`,
      filterStatus: 'all',
    },
    {
      id: 'operational',
      title: 'Operational (UP)',
      value: up,
      subtitle: `${upPercent}% fleet availability`,
      color: 'var(--green)',
      bgColor: 'var(--green-dim)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      badge: 'Online',
      filterStatus: 'UP',
    },
    {
      id: 'outages',
      title: 'Outages / Down',
      value: down,
      subtitle: down > 0 ? 'Requires administrative attention' : 'Zero active outages detected',
      color: down > 0 ? 'var(--red)' : 'var(--muted-2)',
      bgColor: down > 0 ? 'var(--red-dim)' : 'var(--surface-3)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      badge: down > 0 ? 'Degraded' : 'All Clear',
      isCritical: down > 0,
      filterStatus: 'DOWN',
    },
    {
      id: 'state',
      title: 'Scheduler State',
      value: `${active} Active`,
      subtitle: `${paused} paused monitors`,
      color: '#38bdf8',
      bgColor: 'rgba(56,189,248,0.12)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
      badge: `${activePercent}% active ratio`,
      filterStatus: 'active',
    },
  ];

  const intervals = stats.intervalBreakdown || {};

  return (
    <div className="mb-6 space-y-4">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const isClickable = Boolean(onSelectStatusFilter);
          return (
            <div
              key={c.id}
              onClick={() => isClickable && onSelectStatusFilter(c.filterStatus)}
              className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--border-bright)] hover:shadow-lg ${
                isClickable ? 'cursor-pointer hover:-translate-y-0.5' : ''
              } ${c.isCritical ? 'border-red-500/40 bg-red-500/[0.04]' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-[var(--muted-2)]">
                  {c.title}
                </span>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-xl transition group-hover:scale-110"
                  style={{
                    backgroundColor: c.bgColor,
                    color: c.color,
                  }}
                >
                  {c.icon}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-2">
                <span
                  className="font-['JetBrains_Mono',monospace] text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl"
                  style={{ color: c.isCritical ? 'var(--red)' : undefined }}
                >
                  {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
                </span>
                {c.badge && (
                  <span
                    className={`font-['JetBrains_Mono',monospace] text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      c.isCritical
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        : 'bg-[var(--surface-3)] text-[var(--muted-2)] border border-[var(--border-mid)]'
                    }`}
                  >
                    {c.badge}
                  </span>
                )}
              </div>

              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {c.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Interval Telemetry Distribution Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-3 text-xs">
        <div className="flex items-center gap-2 text-[var(--muted-2)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
          <span className="font-medium text-[var(--text)]">Telemetry Frequencies:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.entries({
            '1m': '1 Min (High)',
            '5m': '5 Min (Std)',
            '10m': '10 Min',
            '30m': '30 Min',
            '1h': '1 Hour',
          }).map(([key, label]) => {
            const count = intervals[key] || 0;
            return (
              <div
                key={key}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1 text-[11px]"
              >
                <span className="text-[var(--muted)]">{label}:</span>
                <span className="font-['JetBrains_Mono',monospace] font-semibold text-[var(--cyan)]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(AdminMonitorStats);

