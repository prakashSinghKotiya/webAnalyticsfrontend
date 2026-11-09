import { useState } from 'react';
import {
  formatDateTime,
  getRelativeTime,
  getUserInitials,
  copyToClipboard,
  getEnquiryTopicBadgeConfig,
} from '../admin.utils';

export default function AdminContactTable({
  messages = [],
  loading = false,
  onInspect,
  onResetFilters,
  onPromptDelete,
  deletingId = null,
}) {
  const [copiedEmailId, setCopiedEmailId] = useState(null);

  const handleCopy = async (text, id) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedEmailId(id);
      setTimeout(() => setCopiedEmailId(null), 1800);
    }
  };

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--surface-3)]" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-[var(--surface-3)]" />
                  <div className="h-3 w-52 rounded bg-[var(--surface-3)]" />
                </div>
              </div>
              <div className="hidden h-6 w-24 rounded-full bg-[var(--surface-3)] md:block" />
              <div className="hidden h-4 w-64 rounded bg-[var(--surface-3)] lg:block" />
              <div className="hidden h-4 w-28 rounded bg-[var(--surface-3)] sm:block" />
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-lg bg-[var(--surface-3)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-mid)] bg-[var(--surface)] px-6 py-16 text-center shadow-[var(--shadow-card)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-bright)] bg-[var(--cyan-dim)] text-[var(--cyan)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h3 className="mt-4 font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
          No Contact Inquiries Found
        </h3>
        <p className="mt-1.5 max-w-sm text-xs text-[var(--muted-2)]">
          No contact messages match your active filters or search terms. Submissions from the public Contact page will show up here in real time.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="cursor-pointer mt-5 rounded-xl border border-[var(--border-bright)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--cyan)] transition hover:bg-[var(--surface)] active:scale-95"
          >
            Clear Active Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      {/* ── DESKTOP TABLE VIEW (sm and up) ─────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-2)]/50 font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 font-semibold">
                Sender &amp; Contact
              </th>
              <th scope="col" className="px-3 py-3.5 font-semibold">
                Topic
              </th>
              <th scope="col" className="px-3 py-3.5 font-semibold">
                Message Preview
              </th>
              <th scope="col" className="px-3 py-3.5 font-semibold">
                Received
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-4 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {messages.map((msg) => {
              const badge = getEnquiryTopicBadgeConfig(msg.enquiryTopic);
              const initials = getUserInitials(msg.name);
              const isCopied = copiedEmailId === msg.id;
              const mailtoHref = `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent(
                `Re: [MonitorMyHost] ${badge.fullLabel} Inquiry`
              )}&body=${encodeURIComponent(
                `Hi ${msg.name},\n\nThank you for reaching out to MonitorMyHost regarding your ${badge.fullLabel.toLowerCase()} inquiry.\n\n---\nOriginal Message:\n"${msg.message}"\n`
              )}`;

              return (
                <tr
                  key={msg.id}
                  className="transition hover:bg-[var(--surface-2)]/60 group"
                >
                  {/* Sender column */}
                  <td className="py-3.5 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)] font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--cyan)] shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text)] truncate max-w-[160px] md:max-w-[200px]">
                          {msg.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={mailtoHref}
                            className="font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted-2)] hover:text-[var(--cyan)] truncate max-w-[150px] md:max-w-[190px]"
                            title={`Send email to ${msg.email}`}
                          >
                            {msg.email}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.email, msg.id)}
                            className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] transition border-none bg-transparent p-0.5"
                            title="Copy email address"
                          >
                            {isCopied ? (
                              <span className="text-[10px] font-bold text-[var(--green)]">Copied</span>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Topic badge column */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${badge.className}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} />
                      {badge.label}
                    </span>
                  </td>

                  {/* Message preview column */}
                  <td className="px-3 py-3.5 max-w-[260px] md:max-w-[340px] lg:max-w-[420px]">
                    <p className="line-clamp-2 text-xs text-[var(--text-2)] leading-relaxed">
                      {msg.message}
                    </p>
                  </td>

                  {/* Received date column */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text)]">
                      {getRelativeTime(msg.createdAt)}
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)] mt-0.5" title={msg.createdAt}>
                      {formatDateTime(msg.createdAt)}
                    </div>
                  </td>

                  {/* Actions column */}
                  <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspect && onInspect(msg)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)] active:scale-95"
                        title="View complete message"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>View</span>
                      </button>

                      <a
                        href={mailtoHref}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-2 py-1.5 text-xs font-semibold text-[var(--muted-2)] transition hover:border-[var(--green)] hover:text-[var(--green)] active:scale-95"
                        title="Reply via email client"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                        </svg>
                      </a>

                      {onPromptDelete && (
                        <button
                          type="button"
                          onClick={() => onPromptDelete(msg)}
                          disabled={deletingId === msg.id}
                          className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] p-1.5 text-xs font-semibold text-[var(--muted-2)] transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:opacity-40"
                          title="Delete inquiry"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS VIEW (Under sm) ───────────────────────────────── */}
      <div className="divide-y divide-[var(--border)] sm:hidden">
        {messages.map((msg) => {
          const badge = getEnquiryTopicBadgeConfig(msg.enquiryTopic);
          const initials = getUserInitials(msg.name);
          const isCopied = copiedEmailId === msg.id;
          const mailtoHref = `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent(
            `Re: [MonitorMyHost] ${badge.fullLabel} Inquiry`
          )}&body=${encodeURIComponent(
            `Hi ${msg.name},\n\nThank you for reaching out to MonitorMyHost regarding your ${badge.fullLabel.toLowerCase()} inquiry.\n\n---\nOriginal Message:\n"${msg.message}"\n`
          )}`;

          return (
            <div key={msg.id} className="p-4 space-y-3">
              {/* Card Header: Avatar + Name + Topic badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--cyan)]">
                    {initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text)]">{msg.name}</h4>
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)]">
                      {getRelativeTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badge.className}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} />
                  {badge.label}
                </span>
              </div>

              {/* Email Row */}
              <div className="flex items-center justify-between text-xs font-['JetBrains_Mono',monospace] bg-[var(--surface-2)]/60 rounded-lg px-2.5 py-1.5">
                <a href={mailtoHref} className="text-[var(--cyan)] hover:underline truncate">
                  {msg.email}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(msg.email, msg.id)}
                  className="cursor-pointer ml-2 text-[var(--muted)] hover:text-[var(--text)] transition border-none bg-transparent"
                >
                  {isCopied ? (
                    <span className="text-[10px] font-bold text-[var(--green)]">Copied</span>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Message text */}
              <p className="line-clamp-3 text-xs text-[var(--text-2)] leading-relaxed">
                {msg.message}
              </p>

              {/* Bottom Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => onInspect && onInspect(msg)}
                  className="cursor-pointer flex-1 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] py-2 text-center text-xs font-semibold text-[var(--text)] hover:border-[var(--cyan)]"
                >
                  View Full Message
                </button>
                <a
                  href={mailtoHref}
                  className="flex items-center justify-center rounded-xl bg-[var(--cyan-dim)] border border-[var(--cyan)]/30 px-3.5 py-2 text-xs font-semibold text-[var(--cyan)] hover:bg-[var(--cyan-dim)]/80"
                >
                  Reply
                </a>
                {onPromptDelete && (
                  <button
                    type="button"
                    onClick={() => onPromptDelete(msg)}
                    disabled={deletingId === msg.id}
                    className="cursor-pointer flex items-center justify-center rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/60 dark:bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition disabled:opacity-40"
                    title="Delete inquiry"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
