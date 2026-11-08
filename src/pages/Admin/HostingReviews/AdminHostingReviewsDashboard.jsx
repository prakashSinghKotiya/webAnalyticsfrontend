import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getAllReviewsAdmin,
  getAdminProviders,
  setReviewPublishedAdmin,
  refreshReviewStatsAdmin,
  deleteReviewAdmin,
} from '../../../api/hostingReviewApi';
import { useToast } from '../../../context';
import { ROUTES } from '../../../constants';
import { formatDate, getRelativeTime } from '../admin.utils';
import AdminReviewConfirmModal from './AdminReviewConfirmModal';

export default function AdminHostingReviewsDashboard() {
  const toast = useToast();
  const navigate = useNavigate();

  // Active Tab: 'reviews' | 'providers'
  const [activeTab, setActiveTab] = useState('reviews');

  // Reviews Tab State
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewSearch, setReviewSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'

  // Providers Tab State
  const [providers, setProviders] = useState([]);
  const [minChecks, setMinChecks] = useState(100);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState(null);
  const [providerSearch, setProviderSearch] = useState('');

  // Row Action State: { [id]: 'publish' | 'refresh' | 'delete' }
  const [actionInProgress, setActionInProgress] = useState({});

  // Confirmation Modal State: { open: boolean, type: 'delete' | 'unpublish', review: Object | null }
  const [confirmModal, setConfirmModal] = useState({ open: false, type: 'delete', review: null });

  // Enforce noindex,nofollow for admin page
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

  // 1. Fetch Reviews
  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const res = await getAllReviewsAdmin();
      if (res.success && Array.isArray(res.data)) {
        setReviews(res.data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setReviewsError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch hosting reviews list.'
      );
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // 2. Fetch Providers
  const fetchProviders = useCallback(async () => {
    setProvidersLoading(true);
    setProvidersError(null);
    try {
      const res = await getAdminProviders();
      if (res.success && Array.isArray(res.data)) {
        setProviders(res.data);
        if (typeof res.minChecks === 'number') setMinChecks(res.minChecks);
      } else {
        setProviders([]);
      }
    } catch (err) {
      setProvidersError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch available monitored hosting providers.'
      );
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Add noindex, nofollow for admin security
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex,nofollow');

    fetchReviews();
    fetchProviders();
  }, [fetchReviews, fetchProviders]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Actions
  const handlePublishToggle = async (review) => {
    const nextPublished = !review.isPublished;

    // If unpublishing, require confirmation
    if (!nextPublished) {
      setConfirmModal({ open: true, type: 'unpublish', review });
      return;
    }

    // Direct publish
    setActionInProgress((prev) => ({ ...prev, [review.id]: 'publish' }));
    try {
      const res = await setReviewPublishedAdmin(review.id, true);
      toast.success(res?.message || `Review for "${review.providerName}" published successfully!`);
      await fetchReviews();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to publish review.');
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
    }
  };

  const handleConfirmModalAction = async () => {
    const { review, type } = confirmModal;
    if (!review) return;

    setActionInProgress((prev) => ({ ...prev, [review.id]: type }));
    try {
      if (type === 'unpublish') {
        const res = await setReviewPublishedAdmin(review.id, false);
        toast.success(res?.message || `Review for "${review.providerName}" unpublished.`);
        await fetchReviews();
      } else if (type === 'delete') {
        const res = await deleteReviewAdmin(review.id);
        toast.success(res?.message || `Review for "${review.providerName}" deleted.`);
        await fetchReviews();
        await fetchProviders(); // Re-sync provider eligibility/review link
      }
      setConfirmModal({ open: false, type: 'delete', review: null });
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to ${type} review.`);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
    }
  };

  const handleRefreshStats = async (review) => {
    setActionInProgress((prev) => ({ ...prev, [review.id]: 'refresh' }));
    try {
      const res = await refreshReviewStatsAdmin(review.id);
      toast.success(res?.message || `Refreshed live uptime stats for "${review.providerName}".`);
      await fetchReviews();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to refresh stats.');
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
    }
  };

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        !reviewSearch.trim() ||
        r.providerName?.toLowerCase().includes(reviewSearch.toLowerCase().trim()) ||
        r.title?.toLowerCase().includes(reviewSearch.toLowerCase().trim());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && r.isPublished) ||
        (statusFilter === 'draft' && !r.isPublished);
      return matchesSearch && matchesStatus;
    });
  }, [reviews, reviewSearch, statusFilter]);

  // Filtered Providers
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      return (
        !providerSearch.trim() ||
        p.name?.toLowerCase().includes(providerSearch.toLowerCase().trim()) ||
        p.key?.toLowerCase().includes(providerSearch.toLowerCase().trim())
      );
    });
  }, [providers, providerSearch]);

  return (
    <div className="fade-up space-y-6">
      {/* Top Admin Breadcrumb / Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">
            <Link to={ROUTES.ADMIN} className="hover:text-[var(--cyan)] transition">
              Admin Panel
            </Link>
            <span>/</span>
            <span className="text-[var(--text)] font-semibold">Hosting Reviews</span>
          </div>

          <h1 className="font-['Outfit',sans-serif] mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Hosting Reviews Management
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--muted-2)]">
            Manage editorial hosting reviews, calibrate auto-calculated uptime stats, and track monitored infrastructure.
          </p>
        </div>

        {/* Create Review CTA */}
        <Link
          to="/admin/hosting-reviews/new"
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-4 py-2 font-['Outfit',sans-serif] text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Review
        </Link>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition border ${
            activeTab === 'reviews'
              ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-xs'
              : 'border-transparent text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Reviews</span>
          <span className="font-['JetBrains_Mono',monospace] rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
            {reviews.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('providers')}
          className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition border ${
            activeTab === 'providers'
              ? 'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)] shadow-xs'
              : 'border-transparent text-[var(--muted-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          <span>Detected Providers</span>
          <span className="font-['JetBrains_Mono',monospace] rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
            {providers.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: REVIEWS ───────────────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <section aria-label="Hosting reviews list" className="space-y-4">
          {/* Controls: Search + Status Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Search reviews..."
                className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3.5 py-2 pl-9 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--cyan)] focus:outline-none"
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label htmlFor="review-status" className="text-xs text-[var(--muted-2)] font-medium">Status:</label>
              <select
                id="review-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
              >
                <option value="all">All Reviews</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
              </select>
            </div>
          </div>

          {/* Error Banner */}
          {reviewsError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center justify-between">
              <span>{reviewsError}</span>
              <button type="button" onClick={fetchReviews} className="font-bold underline cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {/* Desktop Table View (>=768px) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3">Provider</th>
                  <th scope="col" className="px-4 py-3">Title &amp; Rating</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Published Date</th>
                  <th scope="col" className="px-4 py-3">Snapshot Age</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-2)]">
                {reviewsLoading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-xs text-[var(--muted)]">
                      Loading hosting reviews...
                    </td>
                  </tr>
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-xs text-[var(--muted)]">
                      No reviews found. Click &quot;New Review&quot; above to create one.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((r) => {
                    const isPending = Boolean(actionInProgress[r.id]);
                    return (
                      <tr key={r.id} className="hover:bg-[var(--surface-2)]/50 transition">
                        {/* Provider */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[var(--text)] font-['Outfit',sans-serif]">{r.providerName}</p>
                          <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)]">
                            {r.slug}
                          </span>
                        </td>

                        {/* Title & Rating */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="truncate text-xs text-[var(--text)] font-medium" title={r.title}>
                            {r.title}
                          </p>
                          <span className="font-['JetBrains_Mono',monospace] text-[11px] text-amber-400 font-bold">
                            ★ {r.rating != null ? Number(r.rating).toFixed(1) : 'N/A'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold font-['JetBrains_Mono',monospace] uppercase ${
                              r.isPublished
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${r.isPublished ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                            {r.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>

                        {/* Published Date */}
                        <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[11px]">
                          {formatDate(r.publishedAt)}
                        </td>

                        {/* Snapshot Age */}
                        <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[11px]" title={r.statsUpdatedAt}>
                          {getRelativeTime(r.statsUpdatedAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Public Page */}
                            {r.isPublished && (
                              <a
                                href={`/hosting-reviews/${r.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg p-1.5 text-[var(--muted-2)] hover:bg-[var(--surface-3)] hover:text-[var(--cyan)] transition"
                                title="View public page in new tab"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </a>
                            )}

                            {/* Refresh Stats */}
                            <button
                              type="button"
                              onClick={() => handleRefreshStats(r)}
                              disabled={isPending}
                              className="cursor-pointer rounded-lg p-1.5 text-[var(--muted-2)] hover:bg-[var(--surface-3)] hover:text-[var(--cyan)] transition disabled:opacity-40"
                              title="Re-run stats computation & update snapshot"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={actionInProgress[r.id] === 'refresh' ? 'animate-spin' : ''}>
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                              </svg>
                            </button>

                            {/* Edit */}
                            <Link
                              to={`/admin/hosting-reviews/${r.id}/edit`}
                              className="rounded-lg p-1.5 text-[var(--muted-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)] transition"
                              title="Edit review content"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </Link>

                            {/* Publish / Unpublish Toggle */}
                            <button
                              type="button"
                              onClick={() => handlePublishToggle(r)}
                              disabled={isPending}
                              className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-bold transition disabled:opacity-40 ${
                                r.isPublished
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                            >
                              {r.isPublished ? 'Unpublish' : 'Publish'}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setConfirmModal({ open: true, type: 'delete', review: r })}
                              disabled={isPending}
                              className="cursor-pointer rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-40"
                              title="Delete review"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (<768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {reviewsLoading ? (
              <div className="p-8 text-center text-xs text-[var(--muted)]">Loading reviews...</div>
            ) : filteredReviews.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-xs text-[var(--muted)]">
                No reviews found.
              </div>
            ) : (
              filteredReviews.map((r) => {
                const isPending = Boolean(actionInProgress[r.id]);
                return (
                  <div key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-[var(--text)]">{r.providerName}</h3>
                        <p className="text-xs text-[var(--text-2)] line-clamp-1">{r.title}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase font-['JetBrains_Mono',monospace] ${
                          r.isPublished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {r.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--muted-2)] font-['JetBrains_Mono',monospace] border-y border-[var(--border)] py-2">
                      <span>Rating: <strong className="text-amber-400">★ {r.rating ?? 'N/A'}</strong></span>
                      <span>Snapshot: {getRelativeTime(r.statsUpdatedAt)}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {r.isPublished && (
                        <a
                          href={`/hosting-reviews/${r.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted-2)]"
                        >
                          View
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRefreshStats(r)}
                        disabled={isPending}
                        className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted-2)]"
                      >
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/hosting-reviews/${r.id}/edit`)}
                        className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text)] font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePublishToggle(r)}
                        disabled={isPending}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          r.isPublished ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {r.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmModal({ open: true, type: 'delete', review: r })}
                        disabled={isPending}
                        className="rounded-lg p-1 text-rose-400"
                        title="Delete"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ── TAB 2: DETECTED PROVIDERS ────────────────────────────────────── */}
      {activeTab === 'providers' && (
        <section aria-label="Detected hosting providers" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                placeholder="Search detected providers..."
                className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3.5 py-2 pl-9 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--cyan)] focus:outline-none"
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <div className="text-xs text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
              Minimum checks requirement: <strong className="text-[var(--text)]">{minChecks}</strong>
            </div>
          </div>

          {providersError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center justify-between">
              <span>{providersError}</span>
              <button type="button" onClick={fetchProviders} className="font-bold underline cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {/* Providers Table */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] font-['JetBrains_Mono',monospace] text-[11px] text-[var(--muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3">Hosting Provider</th>
                  <th scope="col" className="px-4 py-3">Monitors Fleet</th>
                  <th scope="col" className="px-4 py-3">Total Checks</th>
                  <th scope="col" className="px-4 py-3">Eligibility Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-2)]">
                {providersLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-xs text-[var(--muted)]">
                      Scanning monitored hosting providers...
                    </td>
                  </tr>
                ) : filteredProviders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-xs text-[var(--muted)]">
                      No hosting providers detected from active uptime monitors.
                    </td>
                  </tr>
                ) : (
                  filteredProviders.map((p) => {
                    const progressPct = Math.min(100, Math.round((p.totalChecks / minChecks) * 100));
                    const hasReview = Boolean(p.review);

                    return (
                      <tr key={p.key} className="hover:bg-[var(--surface-2)]/50 transition">
                        {/* Name & Key */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-[var(--text)] font-['Outfit',sans-serif]">{p.name}</p>
                          <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)]">
                            key: {p.key}
                          </span>
                        </td>

                        {/* Fleet */}
                        <td className="px-4 py-3 font-['JetBrains_Mono',monospace]">
                          <span>{p.monitors} total</span>
                          <span className="text-[10px] text-[var(--green)] ml-1">({p.activeMonitors} active)</span>
                        </td>

                        {/* Total Checks */}
                        <td className="px-4 py-3 font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">
                          {new Intl.NumberFormat('en-US').format(p.totalChecks)}
                        </td>

                        {/* Eligibility Progress */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-['JetBrains_Mono',monospace]">
                              <span className={p.eligible ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                                {p.eligible ? '✓ Eligible' : `Ineligible (${p.totalChecks}/${minChecks})`}
                              </span>
                              <span className="text-[var(--muted)]">{progressPct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${p.eligible ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right">
                          {hasReview ? (
                            <Link
                              to={`/admin/hosting-reviews/${p.review.id}/edit`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition"
                            >
                              Edit review
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/hosting-reviews/new?provider=${encodeURIComponent(p.key)}`)}
                              disabled={!p.eligible}
                              title={!p.eligible ? `Requires at least ${minChecks} uptime check results before writing a review` : 'Create review for this provider'}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              Create review
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Confirm Action Modal (Delete & Unpublish) */}
      <AdminReviewConfirmModal
        open={confirmModal.open}
        type={confirmModal.type}
        review={confirmModal.review}
        onClose={() => setConfirmModal({ open: false, type: 'delete', review: null })}
        onConfirm={handleConfirmModalAction}
        loading={Boolean(confirmModal.review && actionInProgress[confirmModal.review.id])}
      />
    </div>
  );
}
