import { useEffect, useRef, memo } from 'react';

/**
 * AdminReviewConfirmModal — Accessible confirm dialog for delete and unpublish actions.
 * Focuses confirm button on open, traps Escape key, manages loading state.
 */
function AdminReviewConfirmModal({
  open,
  type = 'delete', // 'delete' | 'unpublish'
  review = null,
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
      // Accessibility: focus the confirmation action on mount
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onClose]);

  if (!open || !review) return null;

  const isDelete = type === 'delete';
  const title = isDelete ? 'Delete Hosting Review?' : 'Unpublish Hosting Review?';
  const description = isDelete
    ? `Are you sure you want to permanently delete the review for "${review.providerName}" (${review.slug})? This action cannot be undone.`
    : `Are you sure you want to unpublish the review for "${review.providerName}"? It will immediately be hidden from the public website. The existing editorial content and stats snapshot will remain intact in draft state.`;
  const confirmText = isDelete ? 'Delete Permanently' : 'Unpublish Review';
  const confirmClass = isDelete
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-amber-600 hover:bg-amber-700 text-white';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isDelete ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            {isDelete ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h2 id="confirm-modal-title" className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
              {title}
            </h2>
            <p id="confirm-modal-desc" className="mt-2 text-xs sm:text-sm text-[var(--muted-2)] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--border-bright)] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-sm disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AdminReviewConfirmModal);
