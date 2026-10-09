import { useSocket } from '../../../context';

export default function AdminSystemHealth({ stats, onRefresh, refreshing }) {
  const { isConnected, isReconnecting, socket } = useSocket();

  const services = [
    { name: 'User Authentication & RBAC', status: 'Operational', type: 'Core API' },
    { name: 'Admin Control Plane API', status: 'Operational', type: 'REST Endpoint' },
    { name: 'Real-time WebSocket Gateway', status: isConnected ? 'Operational' : isReconnecting ? 'Reconnecting' : 'Disconnected', type: 'Socket.IO' },
    { name: 'TTFB Multi-Region Probes', status: 'Operational', type: 'Worker Pool' },
    { name: 'FullSite Report Quality Engine', status: 'Operational', type: 'Headless Chrome' },
    { name: '24/7 Uptime Poller (BullMQ)', status: 'Operational', type: 'Redis Queue' },
    { name: 'DNS & Record Resolver', status: 'Operational', type: 'Network Stack' },
    { name: 'WHOIS & Registrar Service', status: 'Operational', type: 'Network Stack' },
  ];

  return (
    <div className="space-y-6">
      {/* Top telemetry cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)] uppercase tracking-wider">
            Socket Connection
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: isConnected ? 'var(--green)' : 'var(--orange)',
                boxShadow: isConnected ? '0 0 10px var(--green)' : 'none',
              }}
            />
            <h4 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
              {isConnected ? 'Active & Healthy' : isReconnecting ? 'Reconnecting…' : 'Offline'}
            </h4>
          </div>
          <p className="mt-1 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)] truncate">
            ID: {socket?.id || 'none'}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)] uppercase tracking-wider">
            Environment Target
          </span>
          <h4 className="font-['Outfit',sans-serif] mt-2 text-lg font-bold text-[var(--text)]">
            {import.meta.env.MODE?.toUpperCase() || 'PRODUCTION'}
          </h4>
          <p className="mt-1 font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)] truncate">
            API: {import.meta.env.VITE_API_URL || 'Configured'}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)] uppercase tracking-wider">
            Platform Monitored
          </span>
          <h4 className="font-['Outfit',sans-serif] mt-2 text-lg font-bold text-[var(--text)]">
            {stats.total} User Records
          </h4>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            {stats.admins} Administrator accounts
          </p>
        </div>
      </div>

      {/* Services status list */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="border-b border-[var(--border)] px-5 py-4 bg-[var(--surface-2)]/60 flex items-center justify-between">
          <div>
            <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
              Telemetry Microservices & Worker Health
            </h3>
            <p className="text-xs text-[var(--muted-2)]">
              Live status across backend analytics worker queues and proxy gateways
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] disabled:opacity-50"
          >
            {refreshing ? 'Probing…' : 'Probe Services'}
          </button>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {services.map((svc) => {
            const isOk = svc.status === 'Operational';
            return (
              <div
                key={svc.name}
                className="flex items-center justify-between px-5 py-3.5 transition hover:bg-[var(--surface-2)]/40"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOk ? 'bg-[var(--green)]' : 'bg-[var(--orange)]'
                    }`}
                  />
                  <div>
                    <span className="text-sm font-medium text-[var(--text)]">
                      {svc.name}
                    </span>
                    <span className="ml-2 font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)] uppercase">
                      [{svc.type}]
                    </span>
                  </div>
                </div>

                <span
                  className={`font-['JetBrains_Mono',monospace] rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                    isOk
                      ? 'border-[var(--green)]/30 bg-[var(--green-dim)] text-[var(--green)]'
                      : 'border-[var(--orange)]/30 bg-[var(--orange-dim)] text-[var(--orange)]'
                  }`}
                >
                  {svc.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

