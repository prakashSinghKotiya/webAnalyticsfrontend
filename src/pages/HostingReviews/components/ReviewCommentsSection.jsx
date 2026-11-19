import { useState, useEffect, useCallback, useRef } from 'react';
import { getPublicComments, submitPublicComment } from '../../../api/hostingReviewApi';

/**
 * Formats relative time (e.g. "just now", "5m ago", "2d ago") with fallback to local date.
 */
function getRelativeTime(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const now = Date.now();
    const diffMs = now - d.getTime();
    if (diffMs < 0) return 'Just now';
    const sec = Math.floor(diffMs / 1000);
    if (sec < 45) return 'Just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Format full date and time for accessible title tooltip.
 */
function formatFullDateTime(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return '';
  }
}

export default function ReviewCommentsSection({ slug, providerName = 'this provider' }) {
  // Comment list state
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [listLoading, setListLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState(null);

  // Form state
  const [guestName, setGuestName] = useState('');
  const [body, setBody] = useState('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState(''); // Anti-bot honeypot
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for smooth navigation & autofocus
  const commentFormRef = useRef(null);
  const nameInputRef = useRef(null);
  const commentsTopRef = useRef(null);

  // Track active fetch requests to ignore stale responses
  const activeFetchIdRef = useRef(0);

  // Fetch comments for pagination (load more / retry)
  const fetchComments = useCallback(async (pageNum = 1, append = false) => {
    if (!slug) return;
    const currentFetchId = ++activeFetchIdRef.current;

    if (append) {
      setLoadingMore(true);
    } else {
      setListLoading(true);
      setListError(null);
    }

    try {
      const res = await getPublicComments(slug, { page: pageNum, limit: 10 });
      if (currentFetchId !== activeFetchIdRef.current) return; // Stale response

      if (res?.success) {
        setComments((prev) => (append ? [...prev, ...(res.comments || [])] : res.comments || []));
        setPagination(res.pagination || { page: pageNum, limit: 10, total: 0, totalPages: 1 });
      } else {
        setListError(res?.message || 'Failed to load comments');
      }
    } catch (err) {
      if (currentFetchId !== activeFetchIdRef.current) return;
      setListError(err?.message || 'Could not load comments. Please check your connection.');
    } finally {
      if (currentFetchId === activeFetchIdRef.current) {
        setListLoading(false);
        setLoadingMore(false);
      }
    }
  }, [slug]);

  // Initial fetch on slug change
  useEffect(() => {
    let ignore = false;
    if (!slug) return;

    activeFetchIdRef.current++;
    const currentFetchId = activeFetchIdRef.current;

    getPublicComments(slug, { page: 1, limit: 10 })
      .then((res) => {
        if (ignore || currentFetchId !== activeFetchIdRef.current) return;
        if (res?.success) {
          setComments(res.comments || []);
          setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } else {
          setListError(res?.message || 'Failed to load comments');
        }
      })
      .catch((err) => {
        if (ignore || currentFetchId !== activeFetchIdRef.current) return;
        setListError(err?.message || 'Could not load comments. Please check your connection.');
      })
      .finally(() => {
        if (!ignore && currentFetchId === activeFetchIdRef.current) {
          setListLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  // Handle Load More pagination
  const handleLoadMore = () => {
    if (loadingMore || pagination.page >= pagination.totalPages) return;
    fetchComments(pagination.page + 1, true);
  };

  // Handle Retry
  const handleRetry = () => {
    fetchComments(1, false);
  };

  // Scroll smoothly to add comment box and focus name field
  const handleScrollToAddComment = () => {
    if (commentFormRef.current) {
      commentFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 400);
    }
  };

  // Scroll smoothly back to comments list
  const handleScrollToComments = () => {
    if (commentsTopRef.current) {
      commentsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Reset error & success states
    setFieldErrors({});
    setGlobalError(null);
    setSuccessMessage(null);

    // Client-side quick check
    const trimmedName = guestName.trim();
    const trimmedBody = body.trim();
    const errors = {};

    if (!trimmedName) {
      errors.guestName = 'Please enter your display name.';
    } else if (trimmedName.length > 100) {
      errors.guestName = 'Display name cannot exceed 100 characters.';
    }

    if (!trimmedBody) {
      errors.body = 'Please enter a comment.';
    } else if (trimmedBody.length < 5) {
      errors.body = 'Comment must be at least 5 characters long.';
    } else if (trimmedBody.length > 2000) {
      errors.body = 'Comment cannot exceed 2000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        guestName: trimmedName,
        body: trimmedBody,
        ...(websiteHoneypot ? { website: websiteHoneypot } : {}),
      };

      const res = await submitPublicComment(slug, payload);

      if (res?.success) {
        // Clear form fields
        setGuestName('');
        setBody('');
        setWebsiteHoneypot('');
        setFieldErrors({});
        setSuccessMessage(res.message || 'Thanks! Your comment has been submitted.');

        // If backend operates in auto/post-moderation mode and returned the new comment, prepend it
        if (res.comment && typeof res.comment === 'object') {
          setComments((prev) => [res.comment, ...prev]);
          setPagination((prev) => ({ ...prev, total: (prev.total || 0) + 1 }));
        }
      } else {
        setGlobalError(res?.message || 'Could not submit your comment.');
      }
    } catch (err) {
      // 429 Rate limiting
      if (err?.status === 429 || err?.response?.status === 429) {
        setGlobalError('Too many comments submitted. Please try again later.');
        return;
      }

      // Backend validation error mapping (field-level)
      const data = err?.response?.data || err;
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        const mappedErrors = {};
        for (const issue of data.errors) {
          if (issue.field) mappedErrors[issue.field] = issue.message;
        }
        setFieldErrors(mappedErrors);
      } else if (Array.isArray(data?.details) && data.details.length > 0) {
        const mappedErrors = {};
        for (const issue of data.details) {
          if (issue.path) mappedErrors[issue.path] = issue.message;
        }
        setFieldErrors(mappedErrors);
      } else {
        setGlobalError(data?.message || data?.error || 'Unable to submit comment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = body.length;
  const isNearLimit = charCount >= 1800;
  const isOverLimit = charCount > 2000;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══════════════════════════════════════════════════════════════════════
          BOX 1 (TOP): POSTED COMMENTS & DISCUSSION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="comments"
        ref={commentsTopRef}
        aria-labelledby="comments-list-heading"
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 lg:p-8 scroll-mt-24 shadow-sm transition hover:shadow-md"
      >
        {/* ── Box 1 Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5 mb-6">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan-mid)]"
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  id="comments-list-heading"
                  className="font-['Outfit',sans-serif] text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]"
                >
                  Visitor Comments & Discussion
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-mid)] bg-[var(--surface-2)] px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--text-2)] shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-[var(--cyan)] animate-pulse" aria-hidden="true" />
                  {pagination.total} {pagination.total === 1 ? 'Comment' : 'Comments'}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[var(--muted-2)]">
                Real experiences, questions, and performance reviews for {providerName} from verified visitors.
              </p>
            </div>
          </div>

          {/* Quick Action Button: Jump down to Add Comment */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={handleScrollToAddComment}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] px-4 py-2 font-['Outfit',sans-serif] text-xs font-bold text-[var(--cyan)] shadow-xs hover:bg-[var(--cyan)]/20 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Write a Comment</span>
            </button>
          </div>
        </div>

        {/* ── Box 1 Body: Comment Feed ── */}
        <div className="space-y-4">
          {/* Loading Skeletons */}
          {listLoading && (
            <div className="space-y-3.5" aria-label="Loading comments...">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--surface-3,var(--border))]" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 rounded bg-[var(--surface-3,var(--border))]" />
                        <div className="h-3 w-20 rounded bg-[var(--surface-3,var(--border))]" />
                      </div>
                    </div>
                    <div className="h-3 w-16 rounded bg-[var(--surface-3,var(--border))]" />
                  </div>
                  <div className="mt-3.5 space-y-2">
                    <div className="h-3.5 w-full rounded bg-[var(--surface-3,var(--border))]" />
                    <div className="h-3.5 w-5/6 rounded bg-[var(--surface-3,var(--border))]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List Error State */}
          {!listLoading && listError && (
            <div className="rounded-xl border border-[var(--red)]/30 bg-[var(--red-dim)]/40 p-6 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--red)]/10 text-[var(--red)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-[var(--red)] font-semibold mb-3">{listError}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer shadow-xs"
              >
                Retry Loading Comments
              </button>
            </div>
          )}

          {/* Empty State */}
          {!listLoading && !listError && comments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border-mid)] bg-[var(--surface-2)]/30 p-8 sm:p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan-mid)] mb-3.5 shadow-xs">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="font-['Outfit',sans-serif] text-base sm:text-lg font-bold text-[var(--text)]">
                No comments yet
              </p>
              <p className="mt-1.5 max-w-md mx-auto text-xs sm:text-sm text-[var(--muted-2)] leading-relaxed">
                Have you hosted websites or applications with {providerName}? Share your hands-on feedback on uptime, support speed, and server performance.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleScrollToAddComment}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-5 py-2.5 font-['Outfit',sans-serif] text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Be the First to Comment</span>
                </button>
              </div>
            </div>
          )}

          {/* Comment Cards List */}
          {!listLoading && !listError && comments.length > 0 && (
            <div className="space-y-3.5">
              {comments.map((comment) => {
                const initial = (comment.guestName || 'G').trim().charAt(0).toUpperCase();
                const relativeTime = getRelativeTime(comment.createdAt);
                const fullDateTime = formatFullDateTime(comment.createdAt);

                return (
                  <article
                    key={comment.id}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-4 sm:p-5 transition hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)]/50 shadow-2xs"
                  >
                    {/* Comment Card Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)]/60 pb-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--cyan-dim)] to-[var(--surface-2)] border border-[var(--border-bright)] font-['Outfit',sans-serif] text-xs sm:text-sm font-bold text-[var(--cyan)] shadow-xs select-none"
                          aria-hidden="true"
                        >
                          {initial}
                        </div>

                        {/* Name & Badge */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-['Outfit',sans-serif] text-xs sm:text-sm font-bold text-[var(--text)] leading-tight truncate">
                              {comment.guestName}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-mid)] bg-[var(--surface)] px-2 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] sm:text-[10px] font-semibold text-[var(--muted-2)] uppercase tracking-wider">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--cyan)] shrink-0">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Verified Visitor</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timestamp with Clock Icon */}
                      <time
                        dateTime={comment.createdAt}
                        title={fullDateTime}
                        className="flex items-center gap-1 shrink-0 cursor-help text-[11px] font-['JetBrains_Mono',monospace] text-[var(--muted)] hover:text-[var(--text-2)] transition"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{relativeTime}</span>
                      </time>
                    </div>

                    {/* Comment Body */}
                    <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-2)] whitespace-pre-wrap break-words [overflow-wrap:anywhere] select-text">
                      {comment.body}
                    </p>
                  </article>
                );
              })}
            </div>
          )}

          {/* Load More Pagination Button */}
          {!listLoading && !listError && pagination.page < pagination.totalPages && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/60 px-6 py-2.5 font-['Outfit',sans-serif] text-xs font-bold text-[var(--text)] shadow-xs hover:bg-[var(--surface-2)] hover:border-[var(--border-bright)] active:scale-95 disabled:opacity-50 transition cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-[var(--cyan)]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Loading More...</span>
                  </>
                ) : (
                  <span>
                    Load More Comments ({pagination.total - comments.length} remaining)
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          BOX 2 (BOTTOM): LEAVE A PUBLIC COMMENT (ADD COMMENT FORM)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="add-comment"
        ref={commentFormRef}
        aria-labelledby="add-comment-heading"
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 lg:p-8 scroll-mt-24 shadow-sm transition hover:shadow-md"
      >
        {/* ── Box 2 Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5 mb-6">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan-mid)]"
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <h3
                id="add-comment-heading"
                className="font-['Outfit',sans-serif] text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]"
              >
                Leave a Public Comment
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[var(--muted-2)]">
                Share your feedback, ask questions, or contribute performance observations for {providerName}.
              </p>
            </div>
          </div>

          {/* Trust / Safety Badges */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-center">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1 text-[11px] font-medium text-[var(--muted-2)]">
              🛡️ Moderated
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1 text-[11px] font-medium text-[var(--muted-2)]">
              ⚡ No sign-up
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1 text-[11px] font-medium text-[var(--muted-2)]">
              🔗 Max 2 links
            </span>
          </div>
        </div>

        {/* Global Success / Alert Banner */}
        <div aria-live="polite" className="space-y-3 mb-5">
          {successMessage && (
            <div
              role="status"
              className="flex items-start justify-between gap-3 rounded-xl border border-[var(--green)]/40 bg-[var(--green-dim)] p-4 text-xs sm:text-sm text-[var(--green)] animate-in fade-in"
            >
              <div className="flex items-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <p className="font-bold">{successMessage}</p>
                  <button
                    type="button"
                    onClick={handleScrollToComments}
                    className="mt-1 underline hover:opacity-80 transition cursor-pointer text-xs font-semibold"
                  >
                    View comments above ↑
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                aria-label="Dismiss success message"
                className="text-[var(--green)] hover:opacity-75 transition cursor-pointer text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>
          )}

          {globalError && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-[var(--red)]/40 bg-[var(--red-dim)] p-4 text-xs sm:text-sm text-[var(--red)] animate-in fade-in"
            >
              <div className="flex items-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="font-semibold">{globalError}</span>
              </div>
              <button
                type="button"
                onClick={() => setGlobalError(null)}
                aria-label="Dismiss error message"
                className="text-[var(--red)] hover:opacity-75 transition cursor-pointer text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ── Box 2 Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot field (hidden off-screen for anti-bot defense) */}
          <div
            aria-hidden="true"
            style={{
              opacity: 0,
              position: 'absolute',
              top: 0,
              left: '-9999px',
              height: 0,
              width: 0,
              zIndex: -1,
              pointerEvents: 'none',
            }}
          >
            <label htmlFor="comment-website">Website (leave blank if human)</label>
            <input
              id="comment-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={websiteHoneypot}
              onChange={(e) => setWebsiteHoneypot(e.target.value)}
            />
          </div>

          <div className="space-y-5">
            {/* Display Name Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="comment-guest-name"
                  className="block font-['Outfit',sans-serif] text-xs sm:text-sm font-semibold text-[var(--text)]"
                >
                  Your Name / Alias <span className="text-[var(--cyan)]">*</span>
                </label>
                <span className="text-[11px] text-[var(--muted)] font-['JetBrains_Mono',monospace]">
                  Max 100 chars
                </span>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--muted)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  ref={nameInputRef}
                  id="comment-guest-name"
                  name="guestName"
                  type="text"
                  maxLength={100}
                  required
                  disabled={isSubmitting}
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (fieldErrors.guestName) {
                      setFieldErrors((prev) => ({ ...prev, guestName: null }));
                    }
                  }}
                  placeholder="e.g. Alex Morgan or dev_sarah"
                  className={`w-full rounded-xl border bg-[var(--surface-2)]/40 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] transition outline-none focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--cyan-mid)] ${
                    fieldErrors.guestName
                      ? 'border-[var(--red)] focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                      : 'border-[var(--border-mid)] focus:border-[var(--cyan)]'
                  }`}
                />
              </div>

              {fieldErrors.guestName ? (
                <p className="mt-1.5 text-xs text-[var(--red)] font-medium flex items-center gap-1" role="alert">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{fieldErrors.guestName}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-[var(--muted-2)]">
                  Displayed publicly next to your comment. No account required.
                </p>
              )}
            </div>

            {/* Comment Body Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="comment-body"
                  className="block font-['Outfit',sans-serif] text-xs sm:text-sm font-semibold text-[var(--text)]"
                >
                  Your Review / Comment <span className="text-[var(--cyan)]">*</span>
                </label>
                <span
                  className={`font-['JetBrains_Mono',monospace] text-[11px] transition-colors ${
                    isOverLimit
                      ? 'text-[var(--red)] font-bold'
                      : isNearLimit
                      ? 'text-[var(--orange)] font-semibold'
                      : 'text-[var(--muted)]'
                  }`}
                  aria-live="polite"
                >
                  {charCount} / 2000
                </span>
              </div>

              <textarea
                id="comment-body"
                name="body"
                rows={4}
                maxLength={2000}
                required
                disabled={isSubmitting}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (fieldErrors.body) {
                    setFieldErrors((prev) => ({ ...prev, body: null }));
                  }
                }}
                placeholder="What has been your experience with uptime, support responsiveness, server speeds, or renewal pricing? Share specific feedback to help others."
                className={`w-full rounded-xl border bg-[var(--surface-2)]/40 p-3.5 text-xs sm:text-sm leading-relaxed text-[var(--text)] placeholder-[var(--muted)] transition outline-none resize-y min-h-[110px] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--cyan-mid)] ${
                  fieldErrors.body
                    ? 'border-[var(--red)] focus:border-[var(--red)] focus:ring-[var(--red)]/20'
                    : 'border-[var(--border-mid)] focus:border-[var(--cyan)]'
                }`}
              />

              {fieldErrors.body && (
                <p className="mt-1.5 text-xs text-[var(--red)] font-medium flex items-center gap-1" role="alert">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{fieldErrors.body}</span>
                </p>
              )}
            </div>

            {/* Form Footer & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-[var(--border)]/70">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-2)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Comments are moderated for spam. Plain text only (HTML stripped).</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* Reset button if user typed something */}
                {(guestName || body) && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setGuestName('');
                      setBody('');
                      setFieldErrors({});
                    }}
                    className="flex-1 sm:flex-none inline-flex min-h-[42px] items-center justify-center rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/60 px-4 py-2.5 font-['Outfit',sans-serif] text-xs font-semibold text-[var(--muted-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !guestName.trim() || !body.trim() || body.trim().length < 5 || isOverLimit}
                  className="flex-1 sm:flex-none inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-6 py-2.5 font-['Outfit',sans-serif] text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>Post Comment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
