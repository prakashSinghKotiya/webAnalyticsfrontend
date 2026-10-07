const mono = "font-['JetBrains_Mono',monospace]"
function Row({ label, value }) {
  return <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-2 last:border-0"><span className="text-[var(--muted-2)]">{label}</span><span className="truncate text-[var(--text)]">{value}</span></div>
}
export function WhoisPreview() {
  return <div className={`${mono} p-4 text-[10px]`}><div className="mb-2 flex justify-between"><span className="text-[var(--green)]">example.com</span><span className="text-[8px] text-[var(--muted)]">SAMPLE LOOKUP</span></div><Row label="Registrar" value="Example Registrar" /><Row label="Registrant" value="Privacy protected" /><Row label="Expiry" value="2027-08-14" /><Row label="Name servers" value="ns1.example.com" /></div>
}
export function RedirectPreview() {
  return <div className={`${mono} p-4 text-[10px]`}><div className="mb-3 flex justify-between text-[var(--muted-2)]"><span>TRACE / example.com</span><span className="text-[8px]">SAMPLE</span></div>{[['01', '301', 'http://example.com'], ['02', '302', 'https://www.example.com'], ['03', '200 OK', 'https://example.com/home']].map(([hop, status, url]) => <div key={hop} className="flex items-center gap-2 py-2"><span className="text-[var(--muted)]">{hop}</span><span className={`rounded px-1.5 py-0.5 ${status === '200 OK' ? 'bg-[var(--green-dim)] text-[var(--green)]' : 'bg-[var(--orange-dim)] text-[var(--orange)]'}`}>{status}</span><span className="truncate text-[var(--text-2)]">{url}</span></div>)}<div className="mt-2 border-t border-[var(--border)] pt-2 text-[var(--green)]">2 redirect hops → final 200 OK</div></div>
}
export function DnsPreview() {
  return <div className={`${mono} p-4 text-[10px]`}><div className="mb-2 flex justify-between"><span className="text-[var(--green)]">DNS / example.com</span><span className="text-[8px] text-[var(--muted)]">SAMPLE RECORDS</span></div>{[['A', '192.0.2.1'], ['AAAA', '2001:db8::1'], ['MX', '10 mail.example.com'], ['TXT', 'v=spf1 -all']].map(([type, value]) => <div key={type} className="flex items-center gap-3 border-b border-[var(--border)] py-2 last:border-0"><span className="w-10 rounded bg-[var(--green-dim)] px-1.5 py-0.5 text-[var(--green)]">{type}</span><span className="truncate text-[var(--text-2)]">{value}</span></div>)}</div>
}
