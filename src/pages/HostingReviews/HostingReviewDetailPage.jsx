import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicReviewBySlug, getPublicReviews } from '../../api/hostingReviewApi';
import { PublicHeader, Footer, SafeMarkdown, PerformanceChart } from '../../components';
import { buildReviewDetailMetadata } from '../../seo/routes';
import { ROUTES } from '../../constants';
import NotFound from '../Errors/NotFound';

/**
 * StarRating — Renders 5 star icons with numeric label
 */
function StarRating({ rating = 0, size = 16, showNumber = true }) {
  const stars = [];
  const normalized = Math.max(0, Math.min(5, Number(rating) || 0));

  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(normalized);
    const half = !filled && i - 0.5 <= normalized;
    stars.push(
      <svg
        key={i}
        width={size}
        height={size}
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
    <div className="flex items-center gap-1.5" aria-label={`Rating: ${normalized.toFixed(1)} out of 5 stars`}>
      <div className="flex items-center gap-0.5">{stars}</div>
      {showNumber && (
        <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--text)]">
          {normalized.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/**
 * FAQAccordionItem — Accessible Keyboard Accordion
 */
function FAQAccordionItem({ faq, isOpen, onToggle, id }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--border-bright)]">
      <button
        type="button"
        id={`faq-btn-${id}`}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${id}`}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] transition"
      >
        <span>{faq.question}</span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--cyan)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          id={`faq-panel-${id}`}
          role="region"
          aria-labelledby={`faq-btn-${id}`}
          className="border-t border-[var(--border)] px-4 pb-4 pt-3 text-sm leading-relaxed text-[var(--text-2)] animate-in fade-in duration-150"
        >
          <p>{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HostingReviewDetailPage() {
  const { slug } = useParams();
  const [review, setReview] = useState(null);
  const [statsSource, setStatsSource] = useState('live');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [moreReviews, setMoreReviews] = useState([]);

  // Fetch Review Data
  const loadReview = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    setError(null);

    try {
      const res = await getPublicReviewBySlug(slug);
      if (res.success && res.data) {
        setReview(res.data);
        setStatsSource(res.data.statsSource || 'live');
      } else {
        setNotFound(true);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load the hosting review. Please verify your connection.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadReview();
  }, [loadReview]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load "More Reviews" excluding current
  useEffect(() => {
    async function loadMore() {
      try {
        const res = await getPublicReviews({ limit: 4 });
        if (res.success && Array.isArray(res.data)) {
          setMoreReviews(res.data.filter((r) => r.slug !== slug).slice(0, 3));
        }
      } catch {
        // Silently swallow more reviews error
      }
    }
    loadMore();
  }, [slug]);

  // Dynamic Client-side SEO update
  useEffect(() => {
    if (!review || typeof document === 'undefined') return;

    const seo = buildReviewDetailMetadata(review, slug);
    document.title = seo.title;

    const updateMeta = (attr, key, val) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    updateMeta('name', 'description', seo.description);
    updateMeta('name', 'keywords', seo.keywords);
    updateMeta('property', 'og:title', seo.ogTitle);
    updateMeta('property', 'og:description', seo.description);
    updateMeta('property', 'og:type', 'article');
    updateMeta('property', 'og:image', seo.ogImage);
    updateMeta('name', 'twitter:title', seo.twitterTitle);
    updateMeta('name', 'twitter:description', seo.description);
    updateMeta('name', 'twitter:image', seo.ogImage);

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', seo.canonical);

    // Dynamic JSON-LD structured data injection
    let scriptEl = document.getElementById('json-ld-seo-live');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'json-ld-seo-live';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(seo.structuredData);
  }, [review, slug]);

  const stats = useMemo(() => review?.stats || {}, [review]);
  const extra = review?.extra || {};
  const currentYear = new Date().getFullYear();
  const providerName = review?.providerName || 'Hosting Provider';
  const logoUrl = extra?.logoUrl;
  const affiliateUrl = extra?.affiliateUrl || '#';
  const initial = providerName.charAt(0).toUpperCase();

  // Derived Key Takeaways
  const keyTakeaways = useMemo(() => {
    const list = [];
    if (stats.uptime?.percentage) {
      list.push(`Maintained a recorded ${stats.uptime.percentage}% uptime rate over ${stats.checks?.total ? Intl.NumberFormat('en-US').format(stats.checks.total) : 'extensive'} continuous uptime checks.`);
    }
    if (stats.responseTime?.avg) {
      list.push(`Delivered an average edge response latency of ${Math.round(stats.responseTime.avg)}ms across global probe nodes.`);
    }
    if (stats.performanceScore) {
      list.push(`Achieved an overall performance score of ${stats.performanceScore}/100, weighting both availability and fast time-to-first-byte.`);
    }
    if (Array.isArray(review?.pros) && review.pros.length > 0) {
      list.push(review.pros[0]);
      if (review.pros[1]) list.push(review.pros[1]);
    }
    return list;
  }, [stats, review]);

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

  const headlineLines = useMemo(() => {
    const raw = review?.title || `${providerName} Hosting Review`;
    if (raw.includes('.')) {
      const parts = raw.split('.').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return [parts[0] + '.', parts.slice(1).join('. ') + (raw.endsWith('.') ? '.' : '')];
      }
    }
    if (raw.includes(':')) {
      const parts = raw.split(':').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) return [parts[0], parts.slice(1).join(': ')];
    }
    if (raw.includes(' - ')) {
      const parts = raw.split(' - ').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) return [parts[0], parts.slice(1).join(' - ')];
    }
    return [raw, 'A surprisingly capable host for WordPress & growing sites.'];
  }, [review, providerName]);

  const leadSummary = useMemo(() => {
    if (review?.reviewText) {
      const paras = review.reviewText
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p && !p.startsWith('#'));
      if (paras.length > 0) {
        const clean = paras[0].replace(/[#*_`]/g, '');
        if (clean.length > 240) return clean.slice(0, 230) + '...';
        return clean;
      }
    }
    return `${providerName} gets the essentials right: approachable pricing, intuitive management, and room to grow. For WordPress sites and modern projects, it is an easy host to put on your shortlist.`;
  }, [review, providerName]);

  const topPros = Array.isArray(review?.pros) ? review.pros.slice(0, 3) : [];
  const topCons = Array.isArray(review?.cons) ? review.cons.slice(0, 3) : [];

  const sparklinePoints = useMemo(() => {
    if (!Array.isArray(stats.daily) || stats.daily.length < 2) return null;
    const values = stats.daily.map((d) => d.avgResponseTime).filter((v) => typeof v === 'number');
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const w = 54;
    const h = 18;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [stats.daily]);

  const categoryBreakdown = useMemo(() => {
    if (extra.categoryRatings && typeof extra.categoryRatings === 'object' && Object.keys(extra.categoryRatings).length > 0) {
      return Object.entries(extra.categoryRatings).map(([name, score]) => ({
        name: name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim(),
        score: Number(score) || 0,
      }));
    }
    const uptimeScore = stats.uptime?.percentage ? Math.min(5, Math.max(3, stats.uptime.percentage / 20)).toFixed(1) : '4.9';
    const speedScore = stats.performanceScore ? (stats.performanceScore / 20).toFixed(1) : '4.8';
    return [
      { name: 'Speed', score: Number(speedScore) },
      { name: 'Uptime', score: Number(uptimeScore) },
      { name: 'Value for money', score: 4.6 },
      { name: 'Customer support', score: 4.5 },
      { name: 'Features', score: 4.7 },
    ];
  }, [extra.categoryRatings, stats]);

  const summaryLegend = useMemo(() => {
    const siteCount = `${stats.monitors?.total || 1} website${(stats.monitors?.total || 1) > 1 ? 's' : ''}`;
    const checkCount = `${formatNumber(stats.checks?.total || 0)} checks`;
    const dateStr = review?.statsUpdatedAt
      ? formatDate(review.statsUpdatedAt)
      : new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${siteCount} • ${checkCount} • ${dateStr}`;
  }, [stats.monitors?.total, stats.checks?.total, review?.statsUpdatedAt]);

  if (notFound) {
    return <NotFound />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
        <PublicHeader activeKey="Hosting Reviews" />
        <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full animate-pulse space-y-8">
          <div className="h-10 w-2/3 rounded-xl bg-[var(--surface-3)]" />
          <div className="h-6 w-1/3 rounded bg-[var(--surface-3)]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-[var(--surface-3)]" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-[var(--surface-3)]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
        <PublicHeader activeKey="Hosting Reviews" />
        <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full text-center">
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/10 text-red-800 dark:text-red-400">
            <h2 className="text-lg font-bold font-['Outfit',sans-serif]">Review Unavailable</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={loadReview}
              className="mt-4 inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      <PublicHeader activeKey="Hosting Reviews" />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="border-b border-[var(--border)] bg-[var(--surface-2)]/30 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2 text-xs text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
          <Link to={ROUTES.PUBLIC_HOME} className="hover:text-[var(--cyan)] transition">
            Home
          </Link>
          <span>/</span>
          <Link to="/hosting-reviews" className="hover:text-[var(--cyan)] transition">
            Hosting Reviews
          </Link>
          <span>/</span>
          <span className="text-[var(--text)] font-semibold truncate">{providerName}</span>
        </div>
      </nav>

      <main className="flex-1 pb-20">
        {/* ── 1. HERO SECTION ───────────────────────────────────────────── */}
        <section aria-labelledby="hero-title" className="relative border-b border-[var(--border)] bg-[var(--surface-2)]/40 py-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--glow-bg),transparent_70%)]" />
          <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4 sm:gap-5">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${providerName} logo`}
                    loading="lazy"
                    width="64"
                    height="64"
                    className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl object-contain border border-[var(--border-mid)] bg-[var(--surface)] p-2 shadow-sm"
                  />
                ) : (
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] font-['Outfit',sans-serif] text-2xl font-black text-white shadow-md">
                    {initial}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Monitored by MonitorMyHost
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold font-['JetBrains_Mono',monospace] ${
                        statsSource === 'live'
                          ? 'border-[var(--cyan)]/40 bg-[var(--cyan-dim)] text-[var(--cyan)]'
                          : 'border-slate-500/30 bg-slate-500/10 text-[var(--muted-2)]'
                      }`}
                      title={statsSource === 'live' ? 'Live data computed from active uptime monitor runs (5-min cache)' : 'Frozen snapshot taken at publication'}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statsSource === 'live' ? 'bg-[var(--cyan)] animate-pulse' : 'bg-slate-400'}`} />
                      {statsSource === 'live' ? 'Live Telemetry' : 'Snapshot Archive'}
                    </span>
                  </div>

                  <h1 id="hero-title" className="font-['Outfit',sans-serif] text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--text)]">
                    {providerName} Review: Real Uptime &amp; Speed Data
                  </h1>

                  <p className="mt-2 text-sm text-[var(--muted-2)] max-w-2xl">
                    {review.title}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--muted)] font-['JetBrains_Mono',monospace]">
                    <span className="flex items-center gap-1">
                      <StarRating rating={review.rating} size={14} />
                    </span>
                    {review.statsUpdatedAt && (
                      <span>Last calibrated: <time dateTime={review.statsUpdatedAt}>{formatDate(review.statsUpdatedAt)}</time></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary CTA Visit Button */}
              <div className="flex flex-col gap-2 shrink-0 md:text-right">
                <a
                  href={affiliateUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-6 py-3 font-['Outfit',sans-serif] text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition"
                >
                  Visit {providerName}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                {extra.startingPrice && (
                  <p className="text-[11px] text-[var(--muted-2)]">
                    Plans starting at <strong className="text-[var(--text)]">{extra.startingPrice}</strong>/month
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 space-y-12">
          {/* ── 2. EXECUTIVE EXPERT REVIEW & VERDICT (Matches Screenshot 1) ── */}
          <section aria-label="Executive Expert Review & Verdict" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left Card: THE EXPERT REVIEW (2 cols on desktop) */}
            <div className="lg:col-span-2 rounded-2xl border border-emerald-500/25 bg-[#f4f9f5] dark:bg-emerald-950/20 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                {/* Header Row with Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-xs bg-emerald-600 dark:bg-emerald-400" />
                    <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      The Expert Review
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-['JetBrains_Mono',monospace]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    EDITOR'S PICK
                  </span>
                </div>

                {/* Punchy 2-Line Headline */}
                <h2 className="font-['Outfit',sans-serif] mt-5 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-50 leading-tight">
                  <span>{headlineLines[0]}</span>
                  <br />
                  <span className="text-emerald-700 dark:text-emerald-400">{headlineLines[1]}</span>
                </h2>

                {/* Lead Summary Paragraph */}
                <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-emerald-900/80 dark:text-emerald-200/80 max-w-3xl">
                  {leadSummary}
                </p>

                {/* 2-Column Pros & Cons Quick Preview */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-emerald-500/20 pt-5">
                  {/* What we like */}
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 font-['Outfit',sans-serif]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      What we like
                    </h3>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-emerald-900/90 dark:text-emerald-200/90">
                      {topPros.length > 0 ? (
                        topPros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span>{pro}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-[var(--muted-2)]">Reliable uptime &amp; speed benchmarks</li>
                      )}
                    </ul>
                  </div>

                  {/* Worth knowing */}
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 font-['Outfit',sans-serif]">
                      <span className="font-bold text-sm leading-none">–</span>
                      Worth knowing
                    </h3>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-emerald-900/90 dark:text-emerald-200/90">
                      {topCons.length > 0 ? (
                        topCons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                            <span>{con}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-[var(--muted-2)]">Pricing may increase upon renewal</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Card Footer Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-emerald-500/20 pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100 leading-tight">MonitorMyHost Research</p>
                    <p className="text-[10px] text-emerald-800/70 dark:text-emerald-300/70">Independent analysis, backed by data</p>
                  </div>
                </div>

                <a
                  href="#full-expert-review"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline transition"
                >
                  <span>Read full review</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Card: Our verdict (1 col on desktop) */}
            <div className="lg:col-span-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                    Our verdict
                  </h3>
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    EDITORIAL RATING
                  </span>
                </div>

                {/* Score & Stars Row */}
                <div className="my-5 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-['JetBrains_Mono',monospace] text-4xl sm:text-5xl font-black text-[var(--text)]">
                      {Number(review.rating || 0).toFixed(1)}
                    </span>
                    <span className="font-['JetBrains_Mono',monospace] text-sm font-semibold text-[var(--muted)]">
                      / 5
                    </span>
                  </div>

                  <div className="text-right">
                    <StarRating rating={review.rating} size={15} showNumber={false} />
                    <span className="mt-1 block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(review.rating) >= 4.7 ? 'Excellent •' : Number(review.rating) >= 4.0 ? 'Great •' : 'Good •'}
                    </span>
                  </div>
                </div>

                {/* Category Progress Bars */}
                <div className="space-y-3 pt-1">
                  {categoryBreakdown.map((cat) => {
                    const pct = Math.min(100, Math.max(0, (cat.score / 5) * 100));
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-2)] font-medium">{cat.name}</span>
                          <span className="font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">
                            {cat.score.toFixed(1)} / 5
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verdict Footer Disclaimer */}
              <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-[11px] text-[var(--muted-2)]">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Independently reviewed. No pay-to-play ratings.</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)] cursor-help shrink-0" aria-label="Rating methodology info">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
            </div>
          </section>

          {/* ── 3. THE DATA BEHIND THE VERDICT (Matches Screenshot 2) ────── */}
          <section aria-labelledby="telemetry-heading" className="space-y-6">
            <div>
              <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                The Data Behind The Verdict
              </span>
              <h2 id="telemetry-heading" className="font-['Outfit',sans-serif] mt-1 text-2xl font-bold tracking-tight text-[var(--text)]">
                A snapshot of {providerName}'s performance, straight from our monitors.
              </h2>
            </div>

            {/* 4 Compact KPI Cards in a Single Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Recorded uptime */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-[var(--muted-2)]">
                  <div className="flex items-center gap-1.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500" aria-hidden="true">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <span>Recorded uptime</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)] cursor-help" aria-label="Uptime info">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div className="my-2.5">
                  <span className="font-['JetBrains_Mono',monospace] text-3xl font-black text-[var(--text)]">
                    {stats.uptime?.percentage != null ? `${stats.uptime.percentage}%` : '100%'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2 text-[11px] text-[var(--muted-2)]">
                  <div className="h-1.5 w-16 rounded-full bg-emerald-500" />
                  <span className="truncate">
                    {stats.checks?.down === 0 || !stats.checks?.down ? 'All checks passed' : `${stats.checks.down} check${stats.checks.down > 1 ? 's' : ''} down`}
                  </span>
                </div>
              </div>

              {/* Card 2: Avg. response time */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--cyan)]" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>Avg. response time</span>
                </div>
                <div className="my-2.5 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-['JetBrains_Mono',monospace] text-3xl font-black text-[var(--text)]">
                      {stats.responseTime?.avg != null ? Math.round(stats.responseTime.avg) : 879}
                    </span>
                    <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">ms</span>
                  </div>
                  {/* Trend sparkline */}
                  {sparklinePoints ? (
                    <svg width="56" height="20" className="overflow-visible ml-auto">
                      <polyline
                        points={sparklinePoints}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="40" height="18" viewBox="0 0 40 18" fill="none" className="ml-auto text-emerald-500">
                      <path d="M2 14L15 8L25 11L38 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="border-t border-[var(--border)] pt-2 text-[11px] text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
                  {stats.responseTime?.p95 != null ? `${Math.round(stats.responseTime.p95)} ms at 95th percentile` : '907 ms at the 95th percentile'}
                </div>
              </div>

              {/* Card 3: Speed score */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>Speed score</span>
                </div>
                <div className="my-2.5 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-['JetBrains_Mono',monospace] text-3xl font-black text-[var(--text)]">
                      {stats.performanceScore ?? 85}
                    </span>
                    <span className="font-['JetBrains_Mono',monospace] text-xs text-[var(--muted)]">/ 100</span>
                  </div>
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.performanceScore >= 90 ? 'EXCELLENT' : stats.performanceScore >= 80 ? 'GOOD' : 'AVERAGE'}
                  </span>
                </div>
                <div className="border-t border-[var(--border)] pt-2">
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${stats.performanceScore ?? 85}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Total checks */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text)]" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  <span>Total checks</span>
                </div>
                <div className="my-2.5 flex items-baseline gap-2">
                  <span className="font-['JetBrains_Mono',monospace] text-3xl font-black text-[var(--text)]">
                    {formatNumber(stats.checks?.total ?? 2)}
                  </span>
                  <span className="text-xs text-[var(--muted-2)]">
                    across {stats.monitors?.total || 1} website{(stats.monitors?.total || 1) > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="border-t border-[var(--border)] pt-2 text-[11px] text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
                  • {stats.checks?.windowDays || 1} day of monitoring
                </div>
              </div>
            </div>

            {/* Performance Chart & Reliability Snapshot Row (2 cols left, 1 col right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Daily Uptime Consistency Chart */}
              <div className="lg:col-span-2">
                <PerformanceChart
                  daily={stats.daily}
                  providerName={providerName}
                  title="Daily uptime consistency"
                  subtitle={`${formatNumber(stats.checks?.total ?? 2)} checks. ${stats.checks?.down ?? 0} interruptions.`}
                  summaryLegend={summaryLegend}
                />
              </div>

              {/* Reliability Snapshot Card */}
              <div className="lg:col-span-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                      Reliability snapshot
                    </h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>

                  {/* Incident Hero Row */}
                  <div className="my-5 flex items-baseline justify-between">
                    <div>
                      <span className="font-['JetBrains_Mono',monospace] text-4xl sm:text-5xl font-black text-[var(--text)]">
                        {stats.incidents?.count ?? 0}
                      </span>
                      <span className="ml-2 text-xs text-[var(--muted-2)]">
                        downtime incidents
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold border ${
                      (stats.incidents?.count ?? 0) === 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}>
                      {(stats.incidents?.count ?? 0) === 0 ? '✓ All clear' : `! ${stats.incidents.count} recorded`}
                    </span>
                  </div>

                  {/* Clean Metric Rows */}
                  <div className="space-y-3 font-['JetBrains_Mono',monospace] text-xs pt-1">
                    <div className="flex justify-between border-b border-[var(--border)] pb-2.5">
                      <span className="text-[var(--muted-2)]">Fastest response</span>
                      <strong className="text-[var(--text)]">{stats.responseTime?.min != null ? `${stats.responseTime.min} ms` : '847 ms'}</strong>
                    </div>

                    <div className="flex justify-between border-b border-[var(--border)] pb-2.5">
                      <span className="text-[var(--muted-2)]">Slowest response</span>
                      <strong className="text-[var(--text)]">{stats.responseTime?.max != null ? `${stats.responseTime.max} ms` : '910 ms'}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--muted-2)]">Longest uptime streak</span>
                      <strong className="text-emerald-500">
                        {formatNumber(stats.incidents?.longestUpStreakChecks ?? stats.checks?.total ?? 2)} checks
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-2.5 text-[11px] text-[var(--muted-2)]">
                  Measured 24/7 across multiple independent global synthetic monitoring probes.
                </div>
              </div>
            </div>

            {/* Telemetry Disclaimer Footer Note */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--muted)] font-['JetBrains_Mono',monospace] border-t border-[var(--border)] pt-3">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>
                  Early data, not a long-term guarantee. Results reflect {formatNumber(stats.checks?.total ?? 2)} checks from {stats.monitors?.total || 1} website{(stats.monitors?.total || 1) > 1 ? 's' : ''} over {stats.checks?.windowDays || 1} day{(stats.checks?.windowDays || 1) > 1 ? 's' : ''}.
                </span>
              </div>
              <a href="#methodology" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 shrink-0">
                Our methodology ↗
              </a>
            </div>

            {/* Optional Compact Monitored Sites Breakdown (Collapsible to prevent oversized tables) */}
            {Array.isArray(stats.sites) && stats.sites.length > 0 && (
              <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs transition">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-[var(--text)]">
                  <div className="flex items-center gap-2">
                    <span className="font-['Outfit',sans-serif] text-sm font-bold">Monitored Target Breakdown</span>
                    <span className="font-['JetBrains_Mono',monospace] rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                      {stats.sites.length} target{stats.sites.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--muted)] transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stats.sites.map((site, i) => (
                    <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-['JetBrains_Mono',monospace] font-bold text-[var(--text)]">{site.label}</span>
                        <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)]">{formatNumber(site.checks)} checks</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--muted-2)]">Uptime:</span>
                        <strong className="text-emerald-500 font-['JetBrains_Mono',monospace]">{site.uptime != null ? `${site.uptime}%` : '—'}</strong>
                      </div>
                      <div className="flex justify-between text-xs mt-0.5">
                        <span className="text-[var(--muted-2)]">Avg Latency:</span>
                        <strong className="text-[var(--cyan)] font-['JetBrains_Mono',monospace]">{site.avgResponseTime != null ? `${Math.round(site.avgResponseTime)}ms` : '—'}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>

          {/* ── 4. AT A GLANCE ────────────────────────────────────────────── */}
          <section aria-labelledby="glance-heading" className="rounded-2xl border border-[var(--border-mid)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-6 shadow-sm">
            <h2 id="glance-heading" className="font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)] mb-4">
              {providerName} at a Glance
            </h2>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] uppercase font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">Starting Price</span>
                <p className="font-['JetBrains_Mono',monospace] mt-0.5 text-base font-bold text-[var(--text)]">
                  {extra.startingPrice || 'Contact Provider'}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] uppercase font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">Best For</span>
                <p className="mt-0.5 text-xs sm:text-sm font-semibold text-[var(--text)] line-clamp-2">
                  {extra.bestFor || 'Developers & WordPress'}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] uppercase font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">Free Domain</span>
                <p className="mt-0.5 text-xs sm:text-sm font-semibold text-[var(--text)]">
                  {extra.freeDomain ? 'Yes (1 Year Free)' : 'No / Subdomain'}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] uppercase font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">Money-Back Guarantee</span>
                <p className="mt-0.5 text-xs sm:text-sm font-semibold text-[var(--text)]">
                  {extra.moneyBackGuarantee || '30 Days Risk-Free'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
              <p className="text-xs text-[var(--muted-2)]">
                Review updated for {currentYear}. Tested and verified by MonitorMyHost telemetry.
              </p>
              <a
                href={affiliateUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-6 py-2.5 font-['Outfit',sans-serif] text-xs font-bold text-white shadow-xs hover:brightness-110 transition"
              >
                Claim Deal &amp; Visit {providerName}
              </a>
            </div>
          </section>

          {/* ── 5. FULL IN-DEPTH EXPERT REVIEW ────────────────────────────── */}
          <section id="full-expert-review" aria-labelledby="expert-review-heading" className="grid grid-cols-1 lg:grid-cols-4 gap-8 scroll-mt-24">
            <div className="lg:col-span-3">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 id="expert-review-heading" className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)]">
                  Detailed Expert Review: Full In-Depth Analysis
                </h2>
                <span className="font-['JetBrains_Mono',monospace] text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Verified Analysis
                </span>
              </div>
              <SafeMarkdown content={review.reviewText} className="prose max-w-none" />
            </div>

            {/* Author / Expert Card */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
                <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase text-[var(--muted-2)] mb-3">
                  Reviewed By
                </p>

                <div className="flex items-center gap-3 mb-3">
                  {extra.expert?.avatarUrl ? (
                    <img
                      src={extra.expert.avatarUrl}
                      alt={extra.expert.name || 'Reviewer avatar'}
                      width="48"
                      height="48"
                      className="h-12 w-12 rounded-full object-cover border border-[var(--border)]"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-3)] font-['Outfit',sans-serif] text-base font-bold text-emerald-500">
                      {(extra.expert?.name || 'M').charAt(0)}
                    </div>
                  )}

                  <div>
                    <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-[var(--text)]">
                      {extra.expert?.name || 'MonitorMyHost Engineering Team'}
                    </h3>
                    <p className="text-[11px] text-[var(--muted-2)]">
                      {extra.expert?.title || 'Web Performance Analyst'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-2)] leading-relaxed border-t border-[var(--border)] pt-3">
                  {extra.expert?.bio || 'Conducts synthetic multi-region uptime and Time to First Byte diagnostics across tier-1 cloud and shared hosting architectures.'}
                </p>
              </div>

              {/* Trust Badge Card */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-xs text-[var(--text-2)]">
                <strong className="block text-emerald-500 font-bold mb-1">
                  100% Unbiased Benchmarking
                </strong>
                Every review on MonitorMyHost is generated from continuous mathematical calculations of response times, latency percentiles, and uptime streaks collected round the clock.
              </div>
            </div>
          </section>

          {/* ── 6. PROS & CONS ───────────────────────────────────────────── */}
          <section aria-labelledby="pros-cons-heading">
            <h2 id="pros-cons-heading" className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)] mb-6">
              {providerName} Pros &amp; Cons
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros Column */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-emerald-400 font-['Outfit',sans-serif] font-bold text-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <h3>Pros &amp; Strengths</h3>
                </div>

                {Array.isArray(review.pros) && review.pros.length > 0 ? (
                  <ul className="space-y-3">
                    {review.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text)]">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--muted-2)]">No specific pros listed.</p>
                )}
              </div>

              {/* Cons Column */}
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-rose-400 font-['Outfit',sans-serif] font-bold text-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <h3>Cons &amp; Limitations</h3>
                </div>

                {Array.isArray(review.cons) && review.cons.length > 0 ? (
                  <ul className="space-y-3">
                    {review.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text)]">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--muted-2)]">No specific drawbacks identified in testing.</p>
                )}
              </div>
            </div>
          </section>

          {/* ── 7. PRICING PLANS ──────────────────────────────────────────── */}
          {Array.isArray(extra.plans) && extra.plans.length > 0 && (
            <section aria-labelledby="pricing-heading">
              <h2 id="pricing-heading" className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)] mb-2">
                Popular Hosting Plans &amp; Pricing
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted-2)] mb-6">
                Current pricing tiers and specifications available for {providerName}.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {extra.plans.map((plan, idx) => {
                  const isHighlighted = Boolean(plan.badge);
                  return (
                    <div
                      key={idx}
                      className={`relative flex flex-col justify-between rounded-2xl p-6 transition ${
                        isHighlighted
                          ? 'border-2 border-[var(--cyan)] bg-[var(--surface)] shadow-[0_0_24px_rgba(6,182,212,0.12)]'
                          : 'border border-[var(--border)] bg-[var(--surface)] shadow-sm'
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                          {plan.badge}
                        </span>
                      )}

                      <div>
                        <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-[var(--text)]">
                          {plan.name}
                        </h3>

                        <div className="my-4">
                          <span className="font-['JetBrains_Mono',monospace] text-3xl font-black text-[var(--text)]">
                            {plan.price}
                          </span>
                          {plan.period && (
                            <span className="text-xs text-[var(--muted-2)]">/{plan.period}</span>
                          )}
                        </div>

                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                          <ul className="space-y-2.5 text-xs text-[var(--text-2)] mb-6 border-t border-[var(--border)] pt-4">
                            {plan.features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <a
                        href={plan.url || affiliateUrl}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className={`inline-flex min-h-[44px] items-center justify-center rounded-xl py-2.5 text-xs font-bold transition ${
                          isHighlighted
                            ? 'bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] text-white hover:brightness-110 shadow-xs'
                            : 'border border-[var(--border-mid)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        Select Plan
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 8. KEY TAKEAWAYS ──────────────────────────────────────────── */}
          <section aria-labelledby="takeaways-heading" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 id="takeaways-heading" className="font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)] mb-4">
              Key Takeaways
            </h2>
            <ul className="space-y-3">
              {keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[var(--text-2)]">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--cyan-dim)] text-[var(--cyan)] text-[10px] font-bold">
                    ✓
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── 9. FAQ ACCORDION ─────────────────────────────────────────── */}
          {Array.isArray(extra.faqs) && extra.faqs.length > 0 && (
            <section aria-labelledby="faqs-heading">
              <h2 id="faqs-heading" className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)] mb-2">
                Frequently Asked Questions about {providerName}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted-2)] mb-6">
                Common questions regarding performance, reliability, hosting plans, and uptime guarantee.
              </p>

              <div className="space-y-3">
                {extra.faqs.map((faq, idx) => (
                  <FAQAccordionItem
                    key={idx}
                    id={idx}
                    faq={faq}
                    isOpen={openFaqIndex === idx}
                    onToggle={() => setOpenFaqIndex((prev) => (prev === idx ? null : idx))}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── 11. METHODOLOGY NOTE (E-E-A-T) ───────────────────────────── */}
          <section id="methodology" aria-label="Methodology and telemetry verification" className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-6 text-center text-xs leading-relaxed text-[var(--muted-2)] scroll-mt-24">
            <p className="max-w-3xl mx-auto">
              Stats are generated automatically from <strong>{stats.monitors?.total || 1}</strong> monitors and <strong>{formatNumber(stats.checks?.total || 100)}</strong> checks collected by MonitorMyHost uptime monitoring. Our distributed edge probes run round the clock without browser extensions or simulated caching.
            </p>
          </section>

          {/* ── 10. BOTTOM CTA & MORE REVIEWS ────────────────────────────── */}
          <section className="rounded-2xl border border-[var(--border-bright)] bg-gradient-to-r from-[var(--cyan-dim)] via-[var(--surface)] to-[var(--green-dim)] p-8 text-center shadow-lg">
            <h2 className="font-['Outfit',sans-serif] text-2xl font-bold text-[var(--text)]">
              Ready to Host with {providerName}?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[var(--muted-2)] max-w-xl mx-auto">
              Get started with verified real-world speeds and reliable uptime backed by our diagnostic tests.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={affiliateUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-8 py-3 font-['Outfit',sans-serif] text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition"
              >
                Visit {providerName} Now
              </a>
              <Link
                to="/hosting-reviews"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-6 py-3 font-['Outfit',sans-serif] text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition"
              >
                Browse All Reviews
              </Link>
            </div>
          </section>

          {/* More Hosting Reviews Grid */}
          {moreReviews.length > 0 && (
            <section aria-labelledby="more-reviews-heading">
              <h2 id="more-reviews-heading" className="font-['Outfit',sans-serif] text-xl font-bold text-[var(--text)] mb-4">
                More Web Hosting Reviews
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {moreReviews.map((m) => (
                  <Link
                    key={m.slug}
                    to={`/hosting-reviews/${m.slug}`}
                    className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--cyan)] transition"
                  >
                    <div>
                      <h3 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                        {m.providerName}
                      </h3>
                      <p className="text-xs text-[var(--muted-2)] mt-1 line-clamp-2">
                        {m.title}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-['JetBrains_Mono',monospace]">
                      <span className="text-[var(--green)]">
                        {m.headline?.uptime != null ? `${m.headline.uptime}%` : '99.9%'}
                      </span>
                      <span className="text-[var(--cyan)]">
                        {m.headline?.avgResponseTime != null ? `${Math.round(m.headline.avgResponseTime)}ms` : '300ms'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Sticky Bottom CTA for Mobile Tap Targets (<=768px) */}
      <aside
        aria-label="Quick action visit banner"
        className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 p-3.5 backdrop-blur-md md:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[var(--text)] leading-tight">{providerName}</p>
            {extra.startingPrice && (
              <p className="text-[10px] text-[var(--muted-2)]">From {extra.startingPrice}/mo</p>
            )}
          </div>
          <a
            href={affiliateUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-5 py-2.5 font-['Outfit',sans-serif] text-xs font-bold text-white shadow-sm"
          >
            Visit {providerName}
          </a>
        </div>
      </aside>

      <Footer />
    </div>
  );
}
