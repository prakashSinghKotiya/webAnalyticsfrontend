import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPublicReviews } from '../../api/hostingReviewApi';
import { PublicHeader, Footer } from '../../components';

/**
 * StarRating — Renders 5 star icons based on rating number (e.g. 4.8).
 */
function StarRating({ rating = 0 }) {
  const stars = [];
  const normalized = Math.max(0, Math.min(5, Number(rating) || 0));

  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(normalized);
    const half = !filled && i - 0.5 <= normalized;
    stars.push(
      <svg
        key={i}
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={filled || half ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${normalized.toFixed(1)} out of 5 stars`}>
      <div className="flex items-center gap-0.5">{stars}</div>
      <span className="ml-1 font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--text)]">
        {normalized.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * Performance Score Badge (0-100)
 */
function ScoreBadge({ score }) {
  if (score == null) return null;
  const num = Number(score);
  let color = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  if (num < 80) color = 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  if (num < 65) color = 'border-red-500/30 bg-red-500/10 text-red-400';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] font-bold ${color}`}
      title="MonitorMyHost 0-100 composite performance score (60% availability, 40% speed)"
    >
      <span className="text-[10px] uppercase font-normal text-[var(--muted-2)]">Score</span> {num}
    </span>
  );
}

/**
 * Skeleton Card for loading state
 */
function ReviewCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col justify-between h-[280px]">
      <div>
        <div className="flex items-center gap-3.5 mb-4">
          <div className="h-12 w-12 rounded-xl bg-[var(--surface-3)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[var(--surface-3)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--surface-3)]" />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full rounded bg-[var(--surface-3)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--surface-3)]" />
        </div>
      </div>
      <div className="border-t border-[var(--border)] pt-3 flex justify-between">
        <div className="h-4 w-1/4 rounded bg-[var(--surface-3)]" />
        <div className="h-4 w-1/4 rounded bg-[var(--surface-3)]" />
      </div>
    </div>
  );
}

export default function HostingReviewsListPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'uptime' | 'speed' | 'newest'

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicReviews();
      if (res.success && Array.isArray(res.data)) {
        setReviews(res.data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load hosting reviews. Please verify network connectivity and retry.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Filter & Sort
  const filteredAndSortedReviews = useMemo(() => {
    let list = [...reviews];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.providerName?.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          r.extra?.bestFor?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'rating') {
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
      if (sortBy === 'uptime') {
        const upA = a.headline?.uptime ?? 0;
        const upB = b.headline?.uptime ?? 0;
        return upB - upA;
      }
      if (sortBy === 'speed') {
        const spA = a.headline?.avgResponseTime ?? 9999;
        const spB = b.headline?.avgResponseTime ?? 9999;
        return spA - spB; // lowest ms is fastest
      }
      if (sortBy === 'newest') {
        return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
      }
      return 0;
    });

    return list;
  }, [reviews, searchQuery, sortBy]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return '';
    }
  };

  const formatNumber = (num) => {
    if (num == null) return '—';
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      <PublicHeader activeKey="Hosting Reviews" />

      <main className="flex-1">
        {/* Hero Section */}
        <section aria-labelledby="reviews-heading" className="relative border-b border-[var(--border)] bg-[var(--surface-2)]/30 py-12 sm:py-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--glow-bg),transparent_70%)]" />
          <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center">
            <span className="font-['JetBrains_Mono',monospace] inline-flex items-center gap-2 rounded-full border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--cyan)]">
              Independent Web Hosting Reviews
            </span>

            <h1
              id="reviews-heading"
              className="font-['Outfit',sans-serif] mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl max-w-3xl mx-auto leading-tight"
            >
              Web Hosting Reviews: Real Uptime &amp; Speed Data
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-[var(--muted-2)]">
              Stop guessing server performance from marketing claims. MonitorMyHost publishes independent web hosting reviews backed by continuous 24/7 uptime monitoring,synthetic speed tests, and real edge latency data.
            </p>
          </div>
        </section>

        {/* Filter & Listing Section */}
        <section aria-label="Hosting Reviews Catalog" className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {/* Controls Bar: Search & Sort */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hosting providers..."
                aria-label="Search hosting provider reviews"
                className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-4 py-2.5 pl-10 text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--cyan)]"
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Sort & Count */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted-2)]">
                {reviews.length} {reviews.length === 1 ? 'provider' : 'providers'}
              </span>

              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-xs text-[var(--muted-2)] font-medium">
                  Sort:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition focus:border-[var(--cyan)] focus:outline-none"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="uptime">Best Uptime (%)</option>
                  <option value="speed">Fastest (Lowest ms)</option>
                  <option value="newest">Recently Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Banner with Retry */}
          {error && (
            <div
              role="alert"
              className="mb-8 flex items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              <div className="flex items-center gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchReviews}
                className="cursor-pointer font-bold underline hover:text-red-950 dark:hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Reviews Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ReviewCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAndSortedReviews.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted)] mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
                No hosting reviews found
              </h2>
              <p className="mt-1 text-xs text-[var(--muted-2)] max-w-sm mx-auto">
                {searchQuery
                  ? `No reviews match "${searchQuery}". Try a different keyword.`
                  : 'No reviews have been published yet. Check back soon as our uptime probes complete monitoring cycles.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 inline-flex items-center rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--cyan)]"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedReviews.map((rev) => {
                const hl = rev.headline || {};
                const logo = rev.extra?.logoUrl;
                const bestFor = rev.extra?.bestFor;
                const startingPrice = rev.extra?.startingPrice;
                const initial = (rev.providerName || 'H').charAt(0).toUpperCase();

                return (
                  <article
                    key={rev.slug}
                    className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--border-bright)] hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <div>
                      {/* Top Header: Logo, Name, Score */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          {logo ? (
                            <img
                              src={logo}
                              alt={`${rev.providerName} official logo`}
                              loading="lazy"
                              width="48"
                              height="48"
                              className="h-12 w-12 rounded-xl object-contain border border-[var(--border)] bg-[var(--surface-2)] p-1.5"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] font-['Outfit',sans-serif] text-lg font-bold text-white shadow-xs">
                              {initial}
                            </div>
                          )}
                          <div>
                            <h2 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)] group-hover:text-[var(--cyan)] transition">
                              {rev.providerName}
                            </h2>
                            {bestFor && (
                              <p className="text-[11px] text-[var(--muted-2)] line-clamp-1">
                                Best for {bestFor}
                              </p>
                            )}
                          </div>
                        </div>

                        <ScoreBadge score={hl.performanceScore} />
                      </div>

                      {/* Editorial Title & Stars */}
                      <div className="mb-4">
                        <StarRating rating={rev.rating} />
                        <h3 className="mt-2 text-sm font-semibold text-[var(--text)] line-clamp-2 leading-snug">
                          {rev.title}
                        </h3>
                      </div>

                      {/* Key Performance Metrics */}
                      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-2.5 text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">
                            Real Uptime
                          </p>
                          <p className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--green)]">
                            {hl.uptime != null ? `${hl.uptime}%` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">
                            Avg Response
                          </p>
                          <p className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--cyan)]">
                            {hl.avgResponseTime != null ? `${Math.round(hl.avgResponseTime)}ms` : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Starting Price & Checks info if available */}
                      <div className="flex items-center justify-between text-xs text-[var(--muted-2)] mb-4">
                        {startingPrice ? (
                          <span>From <strong className="text-[var(--text)]">{startingPrice}</strong>/mo</span>
                        ) : (
                          <span />
                        )}
                        {hl.totalChecks ? (
                          <span className="font-['JetBrains_Mono',monospace] text-[11px]">
                            {formatNumber(hl.totalChecks)} checks
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Card Footer: Date & Link CTA */}
                    <div className="border-t border-[var(--border)] pt-3.5 flex items-center justify-between">
                      <time dateTime={rev.publishedAt} className="text-[11px] text-[var(--muted)] font-['JetBrains_Mono',monospace]">
                        {formatDate(rev.publishedAt)}
                      </time>

                      <Link
                        to={`/hosting-reviews/${rev.slug}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 font-['Outfit',sans-serif] text-xs font-bold text-[var(--cyan)] hover:text-white transition group-hover:translate-x-0.5"
                      >
                        Read review
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
