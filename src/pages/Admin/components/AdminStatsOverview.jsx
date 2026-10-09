import { useSocket } from '../../../context';

export default function AdminStatsOverview({ stats }) {
  const { isConnected, isReconnecting } = useSocket();

  const socketStatusText = isConnected
    ? 'Active & Healthy'
    : isReconnecting
    ? 'Reconnecting…'
    : 'Offline Mode';

  const socketStatusColor = isConnected
    ? 'text-[var(--green)]'
    : isReconnecting
    ? 'text-[var(--orange)]'
    : 'text-[var(--red)]';

  const cards = [
    {
      title: 'Total Accounts',
      value: stats.total,
      subtitle: `${stats.displayed} loaded in view`,
      color: 'var(--cyan)',
      bgColor: 'var(--cyan-dim)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: 'Privileged Staff',
      value: stats.admins,
      subtitle: 'Admins & SuperAdmins',
      color: '#a855f7',
      bgColor: 'rgba(168,85,247,0.12)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      title: 'Pro / Enterprise',
      value: stats.proUsers,
      subtitle: 'Premium tier accounts',
      color: 'var(--green)',
      bgColor: 'var(--green-dim)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      title: 'Telemetry Gateway',
      value: isConnected ? 'Online' : 'Offline',
      subtitle: socketStatusText,
      valueClass: socketStatusColor,
      color: isConnected ? 'var(--green)' : 'var(--orange)',
      bgColor: isConnected ? 'var(--green-dim)' : 'var(--orange-dim)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="group relative overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] transition hover:border-[var(--border-bright)] hover:shadow-[var(--shadow-card-hover)]"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-['JetBrains_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                {card.title}
              </p>
              <h3
                className={`font-['Outfit',sans-serif] mt-1.5 text-2xl font-bold tracking-tight text-[var(--text)] ${
                  card.valueClass || ''
                }`}
              >
                {card.value}
              </h3>
              <p className="mt-1 text-xs text-[var(--muted-2)]">{card.subtitle}</p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-bright)]/40 transition group-hover:scale-110"
              style={{
                backgroundColor: card.bgColor,
                color: card.color,
              }}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

