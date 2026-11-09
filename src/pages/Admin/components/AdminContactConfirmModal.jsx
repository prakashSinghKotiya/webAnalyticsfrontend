import { useEffect, useRef } from 'react';
import { getEnquiryTopicBadgeConfig, getRelativeTime } from '../admin.utils';

export default function AdminContactConfirmModal({
  open,
  message,
  onClose,
  onConfirm,
  loading = false,
}) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onClose]);

  if (!open || !message) return null;

  const badge = getEnquiryTopicBadgeConfig(message.enquiryTopic);

  const handleConfirm = () => {
    if (onConfirm && !loading) {
      onConfirm(message);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-delete-modal-title"
      aria-describedby="contact-delete-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h3
              id="contact-delete-modal-title"
              className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]"
            >
              Delete Contact Inquiry?
            </h3>
            <p id="contact-delete-modal-desc" className="mt-1.5 text-xs text-[var(--muted-2)] leading-relaxed">
              Are you sure you want to permanently delete this inquiry from{' '}
              <strong className="text-[var(--text)]">{message.name}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Message snippet preview box */}
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--cyan)] truncate max-w-[200px]">
              {message.email}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badge.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} />
              {badge.label}
            </span>
          </div>
          <p className="line-clamp-2 text-xs text-[var(--muted-2)] italic font-sans leading-relaxed">
            &ldquo;{message.message}&rdquo;
          </p>
          <div className="text-[10px] text-[var(--muted)] font-['JetBrains_Mono',monospace] flex items-center justify-between pt-1 border-t border-[var(--border)]">
            <span>Ticket: …{message.id?.slice(-8)}</span>
            <span>{getRelativeTime(message.createdAt)}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-xs shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Deleting…</span>
              </>
            ) : (
              <span>Delete Permanently</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
