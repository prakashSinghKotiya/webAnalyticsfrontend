import { formatDateTime } from '../admin.utils';

export default function AdminAuditLogs({ auditLogs }) {
  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--muted)]">
        No administrative actions recorded in this session.
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'error':
        return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'info':
        return 'border-[var(--border-bright)] bg-[var(--cyan-dim)] text-[var(--cyan)]';
      default:
        return 'border-[var(--green)]/30 bg-[var(--green-dim)] text-[var(--green)]';
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--border)] px-5 py-3.5 bg-[var(--surface-2)]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--cyan)]" />
          <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
            Session Activity Trail
          </h3>
        </div>
        <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">
          {auditLogs.length} events logged
        </span>
      </div>

      <div className="divide-y divide-[var(--border)] max-h-[500px] overflow-y-auto">
        {auditLogs.map((log) => (
          <div key={log.id} className="p-4 transition hover:bg-[var(--surface-2)]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-['JetBrains_Mono',monospace] rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${getStatusBadge(
                    log.status
                  )}`}
                >
                  {log.action}
                </span>
                <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)]">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
              <p className="text-xs text-[var(--text-2)]">
                {log.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

