import { useState, useEffect } from 'react';
import {
  formatDateTime,
  getRelativeTime,
  getUserInitials,
  copyToClipboard,
  getEnquiryTopicBadgeConfig,
} from '../admin.utils';

export default function AdminContactInspectModal({ message, onClose, onPromptDelete }) {
  const [copiedField, setCopiedField] = useState(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!message) return null;

  const badge = getEnquiryTopicBadgeConfig(message.enquiryTopic);
  const initials = getUserInitials(message.name);

  const handleCopy = async (text, fieldName) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1800);
    }
  };

  const mailtoHref = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
    `Re: [MonitorMyHost] ${badge.fullLabel} Inquiry`
  )}&body=${encodeURIComponent(
    `Hi ${message.name},\n\nThank you for contacting the MonitorMyHost team regarding your ${badge.fullLabel.toLowerCase()} inquiry.\n\n---\nOriginal Message (Ticket ID: ${message.id}):\n${message.message}\n`
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5 sm:p-6 bg-[var(--surface-2)]/40">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-bright)] bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)] font-['JetBrains_Mono',monospace] text-base font-bold text-[var(--cyan)] shadow-sm">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="contact-modal-title"
                  className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]"
                >
                  {message.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badge.className}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} />
                  {badge.fullLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={mailtoHref}
                  className="font-['JetBrains_Mono',monospace] text-xs text-[var(--cyan)] hover:underline"
                >
                  {message.email}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(message.email, 'email')}
                  className="cursor-pointer text-[var(--muted)] hover:text-[var(--text)] transition border-none bg-transparent"
                  title="Copy email"
                >
                  {copiedField === 'email' ? (
                    <span className="text-[10px] font-bold text-[var(--green)]">Copied!</span>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-bright)] transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-['JetBrains_Mono',monospace] text-xs">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
              <span className="text-[11px] text-[var(--muted)] block">Submitted Timestamp:</span>
              <span className="font-semibold text-[var(--text)] mt-0.5 block">
                {formatDateTime(message.createdAt)} ({getRelativeTime(message.createdAt)})
              </span>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--muted)]">Message ID:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(message.id, 'id')}
                  className="cursor-pointer text-[var(--cyan)] hover:underline border-none bg-transparent text-[11px]"
                >
                  {copiedField === 'id' ? 'Copied!' : 'Copy UUID'}
                </button>
              </div>
              <span className="font-semibold text-[var(--text-2)] mt-0.5 block truncate text-[11px]" title={message.id}>
                {message.id}
              </span>
            </div>
          </div>

          {/* Full Message Body Container */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
                Inquiry Message
              </label>
              <button
                type="button"
                onClick={() => handleCopy(message.message, 'message')}
                className="cursor-pointer flex items-center gap-1 text-xs font-semibold text-[var(--cyan)] hover:underline border-none bg-transparent"
              >
                {copiedField === 'message' ? (
                  <span className="text-[var(--green)]">Copied Message!</span>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <div className="rounded-2xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-4 sm:p-5 text-xs sm:text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap select-text max-h-[340px] overflow-y-auto font-sans">
              {message.message}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted)] font-['JetBrains_Mono',monospace]">
              <span>Length: {message.message?.length || 0} characters</span>
              <span>Words: {message.message?.trim().split(/\s+/).filter(Boolean).length || 0}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] p-4 sm:p-5 bg-[var(--surface-2)]/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)] active:scale-95"
            >
              Close
            </button>
            {onPromptDelete && (
              <button
                type="button"
                onClick={() => onPromptDelete(message)}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition active:scale-95"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={mailtoHref}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>Reply via Email Client</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
