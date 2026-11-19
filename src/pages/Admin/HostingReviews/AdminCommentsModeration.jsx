import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminComments,
  updateAdminCommentStatus,
  deleteAdminComment,
  bulkModerateAdminComments,
  getAllReviewsAdmin,
} from '../../../api/hostingReviewApi';
import { useToast } from '../../../context';
import { ROUTES } from '../../../constants';
import { formatDateTime, getRelativeTime } from '../admin.utils';
import AdminPagination from '../components/AdminPagination';
import AdminCommentConfirmModal from './AdminCommentConfirmModal';

export default function AdminCommentsModeration() {
  const toast = useToast();

  // Tab State: 'pending' | 'approved' | 'rejected'
  const [activeTab, setActiveTab] = useState('pending');

  // Comments list state
  const [comments, setComments] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [reviewsList, setReviewsList] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Expandable comments state: { [id]: boolean }
  const [expandedComments, setExpandedComments] = useState({});

  // Row Action in Progress: { [id]: 'approve' | 'reject' | 'delete' }
  const [actionInProgress, setActionInProgress] = useState({});

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    comment: null,
    isBulk: false,
  });

  // Track active fetch requests to ignore stale responses
  const activeFetchIdRef = useRef(0);

  // Enforce noindex,nofollow for admin moderation page
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    const created = !meta;
    if (created) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    const prevContent = meta.content;
    meta.content = 'noindex,nofollow';

    return () => {
      if (created) {
        meta.remove();
      } else {
        meta.content = prevContent;
      }
    };
  }, []);

  // Fetch reviews dropdown list for filtering
  useEffect(() => {
    let isCancelled = false;
    async function fetchReviewsOptions() {
      try {
        const res = await getAllReviewsAdmin({ all: true });
        if (isCancelled) return;
        if (res?.success && Array.isArray(res.data)) {
          setReviewsList(res.data);
        }
      } catch {
        // Silently swallow reviews dropdown failure
      }
    }
    fetchReviewsOptions();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch comments matching current tab, search, reviewId, and page
  const fetchComments = useCallback(async () => {
    const currentFetchId = ++activeFetchIdRef.current;
    setError(null);

    try {
      setLoading(true);
      const params = {
        status: activeTab,
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(selectedReviewId ? { reviewId: selectedReviewId } : {}),
      };

      const res = await getAdminComments(params);
      if (currentFetchId !== activeFetchIdRef.current) return; // Stale request

      if (res?.success) {
        setComments(res.comments || []);
        if (res.counts) setCounts(res.counts);
        if (res.pagination) setPagination(res.pagination);
        setSelectedIds(new Set()); // Reset selections on tab/search change
      } else {
        setError(res?.message || 'Failed to load comments');
      }
    } catch (err) {
      if (currentFetchId !== activeFetchIdRef.current) return;
      setError(err?.message || 'An error occurred while loading comments');
    } finally {
      if (currentFetchId === activeFetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [activeTab, page, limit, debouncedSearch, selectedReviewId]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchComments();
      }
    })();
    return () => {
      ignore = true;
    };
  }, [fetchComments]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
    setSelectedIds(new Set());
  };

  // Toggle Comment Text Expansion
  const toggleExpand = (id) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Checkbox Selection
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === comments.length && comments.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(comments.map((c) => c.id)));
    }
  };

  // Optimistic Single Status Update (Approve / Reject)
  const handleStatusChange = async (comment, newStatus) => {
    const oldStatus = comment.status;
    const commentId = comment.id;

    // Snapshot state for rollback
    const prevComments = [...comments];
    const prevCounts = { ...counts };

    // 1. Optimistic UI update
    setActionInProgress((prev) => ({ ...prev, [commentId]: newStatus }));
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCounts((prev) => {
      const next = { ...prev };
      if (next[oldStatus] > 0) next[oldStatus] -= 1;
      next[newStatus] = (next[newStatus] || 0) + 1;
      return next;
    });
    setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));

    try {
      const res = await updateAdminCommentStatus(commentId, newStatus);
      if (res?.success) {
        toast.success(`Comment ${newStatus === 'approved' ? 'approved' : 'rejected'}`);
      } else {
        throw new Error(res?.message || 'Update failed');
      }
    } catch (err) {
      // Rollback on error
      setComments(prevComments);
      setCounts(prevCounts);
      setPagination((prev) => ({ ...prev, total: prevComments.length }));
      toast.error(err?.message || `Failed to update comment status`);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    }
  };

  // Delete Handlers
  const promptDelete = (comment) => {
    setConfirmModal({ open: true, comment, isBulk: false });
  };

  const promptBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({ open: true, comment: null, isBulk: true });
  };

  const handleConfirmDelete = async () => {
    if (confirmModal.isBulk) {
      // Bulk Delete
      const idsToDelete = Array.from(selectedIds);
      setConfirmModal((prev) => ({ ...prev, open: false }));
      setBulkActionLoading(true);

      const prevComments = [...comments];
      const prevCounts = { ...counts };

      // Optimistic delete
      setComments((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setCounts((prev) => ({
        ...prev,
        [activeTab]: Math.max(0, (prev[activeTab] || 0) - idsToDelete.length),
        all: Math.max(0, (prev.all || 0) - idsToDelete.length),
      }));

      try {
        const res = await bulkModerateAdminComments({ ids: idsToDelete, action: 'delete' });
        if (res?.success) {
          toast.success(`Permanently deleted ${res.count || idsToDelete.length} comments`);
          setSelectedIds(new Set());
          fetchComments();
        } else {
          throw new Error(res?.message || 'Bulk delete failed');
        }
      } catch (err) {
        setComments(prevComments);
        setCounts(prevCounts);
        toast.error(err?.message || 'Failed to delete selected comments');
      } finally {
        setBulkActionLoading(false);
      }
    } else {
      // Single Delete
      const comment = confirmModal.comment;
      if (!comment) return;
      const commentId = comment.id;
      setConfirmModal((prev) => ({ ...prev, open: false }));
      setActionInProgress((prev) => ({ ...prev, [commentId]: 'delete' }));

      const prevComments = [...comments];
      const prevCounts = { ...counts };

      // Optimistic delete
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCounts((prev) => ({
        ...prev,
        [comment.status]: Math.max(0, (prev[comment.status] || 0) - 1),
        all: Math.max(0, (prev.all || 0) - 1),
      }));

      try {
        const res = await deleteAdminComment(commentId);
        if (res?.success) {
          toast.success('Comment permanently deleted');
        } else {
          throw new Error(res?.message || 'Delete failed');
        }
      } catch (err) {
        setComments(prevComments);
        setCounts(prevCounts);
        toast.error(err?.message || 'Failed to delete comment');
      } finally {
        setActionInProgress((prev) => {
          const next = { ...prev };
          delete next[commentId];
          return next;
        });
      }
    }
  };

  // Bulk Status Update (Approve / Reject)
  const handleBulkStatus = async (action) => {
    if (selectedIds.size === 0 || bulkActionLoading) return;
    const ids = Array.from(selectedIds);
    setBulkActionLoading(true);

    try {
      const res = await bulkModerateAdminComments({ ids, action });
      if (res?.success) {
        toast.success(`Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${res.count || ids.length} comments`);
        setSelectedIds(new Set());
        fetchComments();
      } else {
        throw new Error(res?.message || 'Bulk action failed');
      }
    } catch (err) {
      toast.error(err?.message || `Failed to perform bulk ${action}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const allSelected = comments.length > 0 && selectedIds.size === comments.length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Top Header & Breadcrumbs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted-2)] font-['JetBrains_Mono',monospace] mb-1">
            <Link to={ROUTES.ADMIN} className="hover:text-[var(--cyan)] transition">Admin</Link>
            <span>/</span>
            <Link to={ROUTES.ADMIN_HOSTING_REVIEWS} className="hover:text-[var(--cyan)] transition">Reviews</Link>
            <span>/</span>
            <span className="text-[var(--text)]">Comments Moderation</span>
          </div>
          <h1 className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Comment Moderation
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--muted-2)]">
            Review, approve, reject, or permanently delete visitor feedback across published hosting reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.ADMIN_HOSTING_REVIEWS}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Reviews</span>
          </Link>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-4">
        {[
          { key: 'pending', label: 'Pending', count: counts.pending, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
          { key: 'approved', label: 'Approved', count: counts.approved, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
          { key: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-red-500 bg-red-500/10 border-red-500/30' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer border ${
                isActive
                  ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-xs'
                  : 'border-[var(--border-mid)] bg-[var(--surface)] text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-['JetBrains_Mono',monospace] rounded-full border px-2 py-0.5 text-[10px] font-bold ${tab.color}`}
              >
                {tab.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments by guest name or body..."
            className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] pl-9 pr-8 py-2 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] transition outline-none focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)]"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-[var(--muted)] hover:text-[var(--text)] text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Review Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="filter-review" className="text-xs text-[var(--muted-2)] whitespace-nowrap">
            Review:
          </label>
          <select
            id="filter-review"
            value={selectedReviewId}
            onChange={(e) => {
              setSelectedReviewId(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text)] outline-none focus:border-[var(--cyan)]"
          >
            <option value="">All Reviews</option>
            {reviewsList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.providerName || r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)]/40 p-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--cyan)]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cyan)] text-white text-[10px] font-bold">
              {selectedIds.size}
            </span>
            <span>comments selected</span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'approved' && (
              <button
                type="button"
                onClick={() => handleBulkStatus('approve')}
                disabled={bulkActionLoading}
                className="cursor-pointer rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 font-bold text-white shadow-xs transition disabled:opacity-50"
              >
                Bulk Approve
              </button>
            )}
            {activeTab !== 'rejected' && (
              <button
                type="button"
                onClick={() => handleBulkStatus('reject')}
                disabled={bulkActionLoading}
                className="cursor-pointer rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 font-bold text-white shadow-xs transition disabled:opacity-50"
              >
                Bulk Reject
              </button>
            )}
            <button
              type="button"
              onClick={promptBulkDelete}
              disabled={bulkActionLoading}
              className="cursor-pointer rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 font-bold text-white shadow-xs transition disabled:opacity-50"
            >
              Bulk Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Content Area: Table / Cards ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        {/* Loading Skeletons */}
        {loading && (
          <div className="p-6 space-y-4" aria-label="Loading comments...">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-2 border-b border-[var(--border)] pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 rounded bg-[var(--surface-2)]" />
                  <div className="h-4 w-20 rounded bg-[var(--surface-2)]" />
                </div>
                <div className="h-3.5 w-full rounded bg-[var(--surface-2)]" />
                <div className="h-3.5 w-3/4 rounded bg-[var(--surface-2)]" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-[var(--red)] mb-3">{error}</p>
            <button
              type="button"
              onClick={fetchComments}
              className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--cyan)] transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && comments.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)] mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
              {activeTab === 'pending'
                ? 'No pending comments!'
                : activeTab === 'approved'
                ? 'No approved comments found'
                : 'No rejected comments'}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-2)]">
              {activeTab === 'pending'
                ? 'All visitor comments have been reviewed and moderated.'
                : 'Try adjusting your search query or review filter.'}
            </p>
          </div>
        )}

        {/* Desktop Table View (>= 768px) */}
        {!loading && !error && comments.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    <th scope="col" className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        aria-label="Select all comments on this page"
                        className="rounded border-[var(--border-mid)] cursor-pointer"
                      />
                    </th>
                    <th scope="col" className="p-4 w-44">Visitor</th>
                    <th scope="col" className="p-4">Comment Body</th>
                    <th scope="col" className="p-4 w-48">Review Page</th>
                    <th scope="col" className="p-4 w-32">Date</th>
                    <th scope="col" className="p-4 w-36 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {comments.map((comment) => {
                    const isSelected = selectedIds.has(comment.id);
                    const isExpanded = !!expandedComments[comment.id];
                    const isLong = comment.body && comment.body.length > 200;
                    const displayedText = isLong && !isExpanded
                      ? `${comment.body.slice(0, 200)}...`
                      : comment.body;
                    const initial = (comment.guestName || 'G').charAt(0).toUpperCase();

                    return (
                      <tr
                        key={comment.id}
                        className={`transition hover:bg-[var(--surface-2)]/40 ${
                          isSelected ? 'bg-[var(--cyan-dim)]/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(comment.id)}
                            aria-label={`Select comment from ${comment.guestName}`}
                            className="rounded border-[var(--border-mid)] cursor-pointer"
                          />
                        </td>

                        {/* Visitor Info */}
                        <td className="p-4 align-top">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] border border-[var(--border-bright)] font-bold text-[var(--cyan)] text-xs">
                              {initial}
                            </span>
                            <div className="min-w-0">
                              <span className="block font-bold text-[var(--text)] truncate max-w-[130px]">
                                {comment.guestName}
                              </span>
                              <span className="text-[10px] text-[var(--muted)] font-['JetBrains_Mono',monospace]">
                                ID #{comment.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Comment Body (Plain text only, whitespace pre-wrap) */}
                        <td className="p-4 align-top">
                          <p className="text-[var(--text-2)] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {displayedText}
                          </p>
                          {isLong && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(comment.id)}
                              className="mt-1 text-[11px] font-semibold text-[var(--cyan)] hover:underline cursor-pointer"
                            >
                              {isExpanded ? 'Show less' : 'Show full comment'}
                            </button>
                          )}
                        </td>

                        {/* Review Link */}
                        <td className="p-4 align-top">
                          {comment.review ? (
                            <Link
                              to={`/reviews/${comment.review.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-flex items-center gap-1 font-medium text-[var(--text)] hover:text-[var(--cyan)] transition"
                            >
                              <span className="truncate max-w-[160px]">{comment.review.providerName || comment.review.title}</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--muted)] group-hover:text-[var(--cyan)]">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </Link>
                          ) : (
                            <span className="text-[var(--muted)]">—</span>
                          )}
                        </td>

                        {/* Date with relative and full tooltip */}
                        <td className="p-4 align-top">
                          <time
                            dateTime={comment.createdAt}
                            title={formatDateTime(comment.createdAt)}
                            className="cursor-help font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
                          >
                            {getRelativeTime(comment.createdAt)}
                          </time>
                        </td>

                        {/* Row Actions */}
                        <td className="p-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {comment.status !== 'approved' && (
                              <button
                                type="button"
                                title="Approve comment"
                                disabled={actionInProgress[comment.id]}
                                onClick={() => handleStatusChange(comment, 'approved')}
                                className="cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition disabled:opacity-50"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </button>
                            )}

                            {comment.status !== 'rejected' && (
                              <button
                                type="button"
                                title="Reject comment"
                                disabled={actionInProgress[comment.id]}
                                onClick={() => handleStatusChange(comment, 'rejected')}
                                className="cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-500 hover:bg-amber-500 hover:text-white transition disabled:opacity-50"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg>
                              </button>
                            )}

                            <button
                              type="button"
                              title="Delete permanently"
                              disabled={actionInProgress[comment.id]}
                              onClick={() => promptDelete(comment)}
                              className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="md:hidden divide-y divide-[var(--border)]">
              {comments.map((comment) => {
                const isSelected = selectedIds.has(comment.id);
                const isExpanded = !!expandedComments[comment.id];
                const isLong = comment.body && comment.body.length > 150;
                const displayedText = isLong && !isExpanded
                  ? `${comment.body.slice(0, 150)}...`
                  : comment.body;

                return (
                  <article key={comment.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(comment.id)}
                          aria-label={`Select comment from ${comment.guestName}`}
                          className="rounded border-[var(--border-mid)] cursor-pointer"
                        />
                        <span className="font-bold text-xs text-[var(--text)]">{comment.guestName}</span>
                      </div>
                      <time
                        dateTime={comment.createdAt}
                        title={formatDateTime(comment.createdAt)}
                        className="text-[10px] font-['JetBrains_Mono',monospace] text-[var(--muted)]"
                      >
                        {getRelativeTime(comment.createdAt)}
                      </time>
                    </div>

                    <p className="text-xs text-[var(--text-2)] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {displayedText}
                    </p>

                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(comment.id)}
                        className="text-[11px] font-semibold text-[var(--cyan)] hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}

                    {comment.review && (
                      <div className="text-[11px] text-[var(--muted-2)]">
                        On:{' '}
                        <Link
                          to={`/reviews/${comment.review.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--cyan)] hover:underline"
                        >
                          {comment.review.providerName || comment.review.title}
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]/60">
                      {comment.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={actionInProgress[comment.id]}
                          onClick={() => handleStatusChange(comment, 'approved')}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 hover:bg-emerald-500 hover:text-white transition"
                        >
                          Approve
                        </button>
                      )}
                      {comment.status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={actionInProgress[comment.id]}
                          onClick={() => handleStatusChange(comment, 'rejected')}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500 hover:bg-amber-500 hover:text-white transition"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={actionInProgress[comment.id]}
                        onClick={() => promptDelete(comment)}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-500 hover:text-white transition"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && !error && comments.length > 0 && (
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          limitOptions={[10, 25, 50]}
          itemName="comments"
        />
      )}

      {/* ── Confirmation Modal ── */}
      <AdminCommentConfirmModal
        open={confirmModal.open}
        comment={confirmModal.comment}
        isBulk={confirmModal.isBulk}
        bulkCount={selectedIds.size}
        loading={actionInProgress[confirmModal.comment?.id] === 'delete' || bulkActionLoading}
        onClose={() => setConfirmModal({ open: false, comment: null, isBulk: false })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
