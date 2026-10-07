/**
 * PagePlaceholder — consistent scaffold shell for feature pages.
 * Keeps the router/nav fully functional while each module's UI is built out.
 */
export default function PagePlaceholder({ icon, title, description, badge = 'Module scaffolded' }) {
  return (
    <section className="fade-up flex flex-col items-center justify-center rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] px-6 py-16 text-center shadow-[var(--shadow-card)]">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-bright)] bg-[var(--cyan-dim)] text-[var(--cyan)]">
        {icon}
      </div>
      <h1 className="font-['Outfit',sans-serif] mb-2 text-2xl font-bold tracking-tight text-[var(--text)]">{title}</h1>
      <p className="mb-6 max-w-md text-sm leading-relaxed text-[var(--muted-2)]">{description}</p>
      <span className="font-['JetBrains_Mono',monospace] inline-flex items-center gap-2 rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-[var(--cyan)]">
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
        {badge}
      </span>
    </section>
  );
}
