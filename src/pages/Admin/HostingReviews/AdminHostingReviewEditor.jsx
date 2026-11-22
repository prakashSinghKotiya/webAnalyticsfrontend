import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  getAdminProviders,
  previewAdminProviderStats,
  getReviewByIdAdmin,
  createReviewAdmin,
  updateReviewAdmin,
  refreshReviewStatsAdmin,
  setReviewPublishedAdmin,
  deleteReviewAdmin,
} from '../../../api/hostingReviewApi';
import { useToast } from '../../../context';
import { ROUTES } from '../../../constants';
import { SafeMarkdown } from '../../../components';
import { getHostingImageUrl } from '../../../utils/imageUrl';
import AdminStatsPreviewPanel from './AdminStatsPreviewPanel';
import AdminReviewConfirmModal from './AdminReviewConfirmModal';

export default function AdminHostingReviewEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const isEditMode = Boolean(id);
  const initialProviderKey = searchParams.get('provider') || '';

  // Providers list for create mode dropdown
  const [providers, setProviders] = useState([]);

  // Live/Snapshot Stats Preview State
  const [previewStats, setPreviewStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [refreshingStats, setRefreshingStats] = useState(false);

  // Form Fields State
  const [providerKey, setProviderKey] = useState(initialProviderKey);
  const [providerName, setProviderName] = useState('');
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState(4.8);
  const [reviewText, setReviewText] = useState('');
  const [markdownTab, setMarkdownTab] = useState('write'); // 'write' | 'preview'
  const [pros, setPros] = useState(['']);
  const [cons, setCons] = useState(['']);

  // Image upload and management state
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [imageError, setImageError] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  // Extra metadata fields
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [bestFor, setBestFor] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [freeDomain, setFreeDomain] = useState(true);
  const [moneyBackGuarantee, setMoneyBackGuarantee] = useState('30 Days');

  // Expert / Reviewer info
  const [expertName, setExpertName] = useState('MonitorMyHost Research Team');
  const [expertTitle, setExpertTitle] = useState('Infrastructure Performance Analyst');
  const [expertAvatarUrl, setExpertAvatarUrl] = useState('');
  const [expertBio, setExpertBio] = useState('Conducts multi-region synthetic TTFB and continuous uptime telemetry.');

  // Reviewer Avatar Image state
  const [selectedReviewerImageFile, setSelectedReviewerImageFile] = useState(null);
  const [reviewerImagePreviewUrl, setReviewerImagePreviewUrl] = useState('');
  const [existingReviewerAvatarUrl, setExistingReviewerAvatarUrl] = useState('');
  const [reviewerImageError, setReviewerImageError] = useState(null);
  const [isReviewerDraggingOver, setIsReviewerDraggingOver] = useState(false);
  const reviewerFileInputRef = useRef(null);

  // Category Ratings
  const [catRatings, setCatRatings] = useState({
    uptime: 4.9,
    speed: 4.8,
    support: 4.5,
    pricing: 4.6,
    features: 4.7,
  });

  // Plans Repeater: [{ name, price, period, badge, features: [] }]
  const [plans, setPlans] = useState([
    { name: 'Starter Plan', price: '$2.99', period: 'mo', badge: '', features: '1 Website, 10 GB Storage, Free SSL' },
    { name: 'Business Cloud', price: '$5.99', period: 'mo', badge: 'Most Popular', features: '100 Websites, 100 GB NVMe, Free Domain, Daily Backups' },
  ]);

  // FAQs Repeater: [{ question, answer }]
  const [faqs, setFaqs] = useState([
    { question: 'What is the recorded uptime percentage for this host?', answer: 'Based on MonitorMyHost 24/7 synthetic probes, this host maintains consistent availability with rapid outage recovery.' },
    { question: 'Does this provider offer a money-back guarantee?', answer: 'Yes, a standard money-back guarantee is provided to test the platform risk-free.' },
  ]);

  // Review status & meta
  const [isPublished, setIsPublished] = useState(false);

  // Status & Validation
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Confirm Modal (Delete)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  const initialLoadedRef = useRef(false);

  // Robots noindex guard
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

  // Unsaved changes listener
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Clean up object preview URLs on unmount or file replacement
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      if (reviewerImagePreviewUrl && reviewerImagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(reviewerImagePreviewUrl);
      }
    };
  }, [imagePreviewUrl, reviewerImagePreviewUrl]);

  // Image Selection & Drag-and-drop Handlers (Provider Logo)
  const handleFileSelect = (file) => {
    setImageError(null);
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setImageError('Invalid file format. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setImageError(`File exceeds maximum size of 5 MB (Selected file: ${sizeMb} MB).`);
      return;
    }

    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setImagePreviewUrl(preview);
    markDirty();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveSelectedImage = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl('');
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    markDirty();
  };

  // Reviewer Avatar Selection & Drag-and-drop Handlers
  const handleReviewerFileSelect = (file) => {
    setReviewerImageError(null);
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setReviewerImageError('Invalid file format. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setReviewerImageError(`File exceeds maximum size of 5 MB (Selected file: ${sizeMb} MB).`);
      return;
    }

    if (reviewerImagePreviewUrl && reviewerImagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(reviewerImagePreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setSelectedReviewerImageFile(file);
    setReviewerImagePreviewUrl(preview);
    markDirty();
  };

  const handleReviewerFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleReviewerFileSelect(file);
    }
  };

  const handleReviewerDragOver = (e) => {
    e.preventDefault();
    setIsReviewerDraggingOver(true);
  };

  const handleReviewerDragLeave = (e) => {
    e.preventDefault();
    setIsReviewerDraggingOver(false);
  };

  const handleReviewerDrop = (e) => {
    e.preventDefault();
    setIsReviewerDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleReviewerFileSelect(file);
    }
  };

  const handleRemoveSelectedReviewerImage = () => {
    if (reviewerImagePreviewUrl && reviewerImagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(reviewerImagePreviewUrl);
    }
    setSelectedReviewerImageFile(null);
    setReviewerImagePreviewUrl('');
    setReviewerImageError(null);
    if (reviewerFileInputRef.current) {
      reviewerFileInputRef.current.value = '';
    }
    markDirty();
  };

  // 1. In Create Mode: Fetch Providers
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isEditMode) return;
    async function loadProviders() {
      try {
        const res = await getAdminProviders({ all: true });
        if (res.success && Array.isArray(res.data)) {
          setProviders(res.data);
          // If query param providerKey provided, set it
          if (initialProviderKey) {
            setProviderKey(initialProviderKey);
          } else if (res.data.length > 0) {
            // Find first eligible provider without existing review
            const candidate = res.data.find((p) => p.eligible && !p.review) || res.data[0];
            setProviderKey(candidate.key);
          }
        }
      } catch {
        setGeneralError('Failed to load hosting providers list.');
      }
    }
    loadProviders();
  }, [isEditMode, initialProviderKey]);

  // 2. In Create Mode: Fetch live stats preview when providerKey changes
  const loadStatsPreview = useCallback(async (key) => {
    if (!key) return;
    setStatsLoading(true);
    try {
      const res = await previewAdminProviderStats(key);
      if (res.success && res.data) {
        setPreviewStats(res.data);
        setProviderName((prev) => prev || res.data.provider?.name || '');
      }
    } catch {
      // 404 or no data
      setPreviewStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only auto-preview live stats in create mode when a provider is picked.
    // In edit mode, the review's saved snapshot is loaded and preserved.
    if (!isEditMode && providerKey) {
      loadStatsPreview(providerKey);
    }
  }, [isEditMode, providerKey, loadStatsPreview]);

  // 3. In Edit Mode: Load single review
  useEffect(() => {
    if (!isEditMode || !id) return;
    async function loadReview() {
      setLoadingInitial(true);
      setGeneralError(null);
      try {
        const res = await getReviewByIdAdmin(id);
        if (res.success && res.data) {
          const rev = res.data;
          setProviderKey(rev.providerKey);
          setProviderName(rev.providerName || '');
          setTitle(rev.title || '');
          setRating(rev.rating != null ? rev.rating : 4.8);
          setReviewText(rev.reviewText || '');
          setPros(Array.isArray(rev.pros) && rev.pros.length > 0 ? rev.pros : ['']);
          setCons(Array.isArray(rev.cons) && rev.cons.length > 0 ? rev.cons : ['']);
          setIsPublished(Boolean(rev.isPublished));

          // Populate extra fields
          const ex = rev.extra || {};
          const initialImg = rev.image || ex.logoUrl || '';
          setExistingImageUrl(initialImg);
          setSelectedImageFile(null);
          setImagePreviewUrl('');
          setAffiliateUrl(ex.affiliateUrl || '');
          setBestFor(ex.bestFor || '');
          setStartingPrice(ex.startingPrice || '');
          setFreeDomain(ex.freeDomain ?? true);
          setMoneyBackGuarantee(ex.moneyBackGuarantee || '30 Days');

          if (ex.expert) {
            setExpertName(ex.expert.name || '');
            setExpertTitle(ex.expert.title || '');
            const initialRevAvatar = ex.expert.avatarUrl || '';
            setExpertAvatarUrl(initialRevAvatar);
            setExistingReviewerAvatarUrl(initialRevAvatar);
            setSelectedReviewerImageFile(null);
            setReviewerImagePreviewUrl('');
            setExpertBio(ex.expert.bio || '');
          }

          if (ex.categoryRatings && typeof ex.categoryRatings === 'object') {
            setCatRatings((prev) => ({ ...prev, ...ex.categoryRatings }));
          }

          if (Array.isArray(ex.plans)) {
            setPlans(
              ex.plans.map((p) => ({
                ...p,
                features: Array.isArray(p.features) ? p.features.join(', ') : (p.features || ''),
              }))
            );
          }

          if (Array.isArray(ex.faqs)) {
            setFaqs(ex.faqs);
          }

          // Use the review's stored stats snapshot for the preview panel
          if (rev.stats) {
            setPreviewStats(rev.stats);
          } else if (rev.providerKey) {
            try {
              const statsRes = await previewAdminProviderStats(rev.providerKey);
              if (statsRes?.success && statsRes?.data) {
                setPreviewStats(statsRes.data);
              }
            } catch {
              // No live monitoring data found
            }
          }

          initialLoadedRef.current = true;
        } else {
          setGeneralError('Review not found.');
        }
      } catch (err) {
        setGeneralError(err?.response?.data?.message || 'Failed to load review data.');
      } finally {
        setLoadingInitial(false);
      }
    }
    loadReview();
  }, [isEditMode, id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Refresh Stats in Edit Mode
  const handleRefreshStats = async () => {
    if (!id) return;
    setRefreshingStats(true);
    try {
      const res = await refreshReviewStatsAdmin(id);
      if (res.success && res.data) {
        setPreviewStats(res.data.stats);
        toast.success('Live uptime stats refreshed and snapshot updated.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to refresh stats.');
    } finally {
      setRefreshingStats(false);
    }
  };

  // Helper to mark dirty on input
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Build Payload
  const buildPayload = () => {
    const cleanPros = pros.map((p) => p.trim()).filter(Boolean);
    const cleanCons = cons.map((c) => c.trim()).filter(Boolean);

    const cleanPlans = plans
      .map((p) => ({
        name: p.name.trim(),
        price: p.price.trim(),
        period: p.period.trim(),
        badge: p.badge.trim(),
        features: p.features
          ? p.features.split(',').map((f) => f.trim()).filter(Boolean)
          : [],
      }))
      .filter((p) => p.name);

    const cleanFaqs = faqs
      .map((f) => ({
        question: f.question.trim(),
        answer: f.answer.trim(),
      }))
      .filter((f) => f.question && f.answer);

    const extraObj = {
      logoUrl: selectedImageFile ? '' : (existingImageUrl || ''),
      affiliateUrl: affiliateUrl.trim(),
      bestFor: bestFor.trim(),
      startingPrice: startingPrice.trim(),
      freeDomain: Boolean(freeDomain),
      moneyBackGuarantee: moneyBackGuarantee.trim(),
      expert: {
        name: expertName.trim(),
        title: expertTitle.trim(),
        avatarUrl: selectedReviewerImageFile ? '' : (existingReviewerAvatarUrl || ''),
        bio: expertBio.trim(),
      },
      categoryRatings: catRatings,
      plans: cleanPlans,
      faqs: cleanFaqs,
    };

    const payload = {
      title: title.trim(),
      reviewText: reviewText.trim(),
      rating: Number(rating) || 0,
      pros: cleanPros,
      cons: cleanCons,
      extra: extraObj,
    };

    if (selectedImageFile) {
      payload.image = selectedImageFile;
    } else if (existingImageUrl) {
      payload.image = existingImageUrl;
    }

    if (providerName.trim()) {
      payload.providerName = providerName.trim();
    }

    if (!isEditMode) {
      payload.providerKey = providerKey.trim();
    }

    return payload;
  };

  // Client Validation
  const validateClient = (payload) => {
    const errors = {};
    if (!payload.title || payload.title.length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    } else if (payload.title.length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
    }

    if (!payload.reviewText || payload.reviewText.length < 50) {
      errors.reviewText = `Review text must be at least 50 characters (currently ${payload.reviewText?.length || 0})`;
    } else if (payload.reviewText.length > 50000) {
      errors.reviewText = 'Review text cannot exceed 50,000 characters';
    }

    if (!isEditMode && !payload.providerKey) {
      errors.providerKey = 'Please select a monitored hosting provider';
    }

    if (payload.rating < 0 || payload.rating > 5) {
      errors.rating = 'Rating must be between 0.0 and 5.0';
    }

    if (payload.pros.length > 15) {
      errors.pros = 'Maximum 15 pros allowed';
    }
    if (payload.cons.length > 15) {
      errors.cons = 'Maximum 15 cons allowed';
    }

    return errors;
  };

  // Submit Handler: 'draft' | 'publish'
  const handleSubmit = async (targetPublish = false) => {
    setServerErrors({});
    setGeneralError(null);

    const payload = buildPayload();
    const clientErrs = validateClient(payload);

    if (Object.keys(clientErrs).length > 0) {
      setServerErrors(clientErrs);
      toast.error('Please resolve the highlighted validation errors.');
      return;
    }

    setSaving(true);
    try {
      let savedReview;
      if (isEditMode) {
        const res = await updateReviewAdmin(id, payload, selectedImageFile, selectedReviewerImageFile);
        savedReview = res.data;
        toast.success('Review editorial content updated.');
      } else {
        const res = await createReviewAdmin(payload, selectedImageFile, selectedReviewerImageFile);
        savedReview = res.data;
        toast.success(`Review for "${savedReview.providerName}" created!`);
      }

      // If user selected "Save & publish" and not yet published
      if (targetPublish && savedReview?.id && !savedReview.isPublished) {
        await setReviewPublishedAdmin(savedReview.id, true);
        toast.success('Review published to public directory!');
      }

      setIsDirty(false);
      navigate('/admin/hosting-reviews');
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 400 && Array.isArray(data?.details)) {
        // Map backend zod issues onto field errors
        const mapped = {};
        data.details.forEach((d) => {
          mapped[d.path] = d.message;
        });
        setServerErrors(mapped);
        toast.error('Validation failed on server. Please check highlighted inputs.');
      } else if (status === 409) {
        setGeneralError('A review for this provider already exists. Please edit the existing review.');
        toast.error('Provider already reviewed (409 Conflict).');
      } else if (status === 422) {
        setGeneralError(data?.message || 'Provider does not meet minimum 100 check results requirement.');
        toast.error(data?.message || 'Insufficient data (422).');
      } else {
        setGeneralError(data?.message || err?.message || 'Failed to save review.');
        toast.error(data?.message || 'Server error saving review.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteReviewAdmin(id);
      toast.success('Review permanently deleted.');
      setIsDirty(false);
      navigate('/admin/hosting-reviews');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete review.');
    } finally {
      setConfirmDeleteModal(false);
    }
  };

  // Pros / Cons helpers
  const handleListChange = (setter, list, index, value) => {
    markDirty();
    const updated = [...list];
    updated[index] = value;
    setter(updated);
  };

  const handleListAdd = (setter, list) => {
    if (list.length >= 15) return;
    markDirty();
    setter([...list, '']);
  };

  const handleListRemove = (setter, list, index) => {
    markDirty();
    const updated = list.filter((_, i) => i !== index);
    setter(updated.length > 0 ? updated : ['']);
  };

  const handleListMove = (setter, list, index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    markDirty();
    const updated = [...list];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setter(updated);
  };

  if (loadingInitial) {
    return (
      <div className="py-16 text-center text-xs text-[var(--muted)] animate-pulse">
        Loading review editor...
      </div>
    );
  }

  return (
    <div className="fade-up space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono',monospace] text-[var(--muted-2)]">
            <Link to={ROUTES.ADMIN} className="hover:text-[var(--cyan)] transition">Admin</Link>
            <span>/</span>
            <Link to="/admin/hosting-reviews" className="hover:text-[var(--cyan)] transition">Hosting Reviews</Link>
            <span>/</span>
            <span className="text-[var(--text)] font-semibold">{isEditMode ? 'Edit Review' : 'New Review'}</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h1 className="font-['Outfit',sans-serif] text-2xl font-bold tracking-tight text-[var(--text)]">
              {isEditMode ? `Edit Review: ${providerName || 'Provider'}` : 'Write New Hosting Review'}
            </h1>
            {isEditMode && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase font-['JetBrains_Mono',monospace] ${
                  isPublished ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                }`}
              >
                {isPublished ? '● Published' : '○ Draft'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/admin/hosting-reviews')}
            className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="cursor-pointer rounded-xl border border-[var(--cyan)] bg-[var(--cyan-dim)] px-4 py-2 text-xs font-bold text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-white transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : isPublished ? 'Update & Keep Published' : 'Save & Publish'}
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={() => setConfirmDeleteModal(true)}
              className="cursor-pointer rounded-xl p-2 text-rose-400 hover:bg-rose-500/10 transition"
              title="Delete review"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <strong>Notice:</strong> {generalError}
        </div>
      )}

      {/* Two-Column Editor Layout (Desktop) / Stacked (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Column (Left, 2 cols) */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="lg:col-span-2 space-y-6">
          {/* Section 1: Provider & Core Info */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2.5">
              1. Provider Identification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Provider Selection */}
              <div>
                <label htmlFor="provider-key" className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Hosting Provider <span className="text-rose-400">*</span>
                </label>
                {isEditMode ? (
                  <input
                    id="provider-key"
                    type="text"
                    disabled
                    value={providerKey}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-3)] px-3.5 py-2 text-xs font-['JetBrains_Mono',monospace] text-[var(--muted-2)] cursor-not-allowed"
                  />
                ) : (
                  <select
                    id="provider-key"
                    value={providerKey}
                    onChange={(e) => {
                      markDirty();
                      setProviderKey(e.target.value);
                      const sel = providers.find((p) => p.key === e.target.value);
                      if (sel) setProviderName(sel.name);
                    }}
                    className={`w-full rounded-xl border bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none ${
                      serverErrors.providerKey ? 'border-red-500' : 'border-[var(--border-mid)]'
                    }`}
                  >
                    <option value="">Select a monitored provider...</option>
                    {providers.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.name} ({p.totalChecks} checks {p.eligible ? '✓' : '⚠️ ineligible'}) {p.review ? '[Reviewed]' : ''}
                      </option>
                    ))}
                  </select>
                )}
                {serverErrors.providerKey && (
                  <p className="mt-1 text-[11px] text-red-400">{serverErrors.providerKey}</p>
                )}
              </div>

              {/* Provider Display Name Override */}
              <div>
                <label htmlFor="provider-name" className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Display Name Override
                </label>
                <input
                  id="provider-name"
                  type="text"
                  value={providerName}
                  onChange={(e) => { markDirty(); setProviderName(e.target.value); }}
                  placeholder="e.g. Hostinger, SiteGround"
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
                <span className="text-[10px] text-[var(--muted)]">Admin display name override</span>
              </div>
            </div>

            {/* Review Headline Title */}
            <div>
              <label htmlFor="review-title" className="block text-xs font-semibold text-[var(--text)] mb-1">
                Editorial Review Headline <span className="text-rose-400">*</span>
              </label>
              <input
                id="review-title"
                type="text"
                value={title}
                onChange={(e) => { markDirty(); setTitle(e.target.value); }}
                maxLength={200}
                placeholder="e.g. Hostinger Review: Reliable Budget Cloud Hosting with 99.98% Real Uptime"
                className={`w-full rounded-xl border bg-[var(--surface)] px-3.5 py-2 text-xs sm:text-sm text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none ${
                  serverErrors.title ? 'border-red-500' : 'border-[var(--border-mid)]'
                }`}
              />
              <div className="flex justify-between text-[11px] mt-1 text-[var(--muted)]">
                {serverErrors.title ? (
                  <span className="text-red-400">{serverErrors.title}</span>
                ) : (
                  <span>5 - 200 characters</span>
                )}
                <span className="font-['JetBrains_Mono',monospace]">{title.length}/200</span>
              </div>
            </div>

            {/* Editorial Rating */}
            <div>
              <label htmlFor="review-rating" className="block text-xs font-semibold text-[var(--text)] mb-1">
                Editorial Rating (0.0 to 5.0)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="review-rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={rating}
                  onChange={(e) => { markDirty(); setRating(parseFloat(e.target.value) || 0); }}
                  className="w-28 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
                <span className="font-['JetBrains_Mono',monospace] text-amber-400 font-bold text-sm">
                  ★ {Number(rating).toFixed(1)} / 5.0
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Review Body (Markdown with Write / Preview Tabs) */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                  2. Full Editorial Review (Markdown) <span className="text-rose-400">*</span>
                </h2>
                <p className="text-[11px] text-[var(--muted-2)]">Safe Markdown: headings (#, ##), bold, lists, quotes, and links</p>
              </div>

              {/* Write / Preview Tab switcher */}
              <div className="inline-flex rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMarkdownTab('write')}
                  className={`rounded-lg px-3 py-1 font-semibold transition ${
                    markdownTab === 'write' ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]' : 'text-[var(--muted-2)]'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setMarkdownTab('preview')}
                  className={`rounded-lg px-3 py-1 font-semibold transition ${
                    markdownTab === 'preview' ? 'bg-[var(--cyan-dim)] text-[var(--cyan)]' : 'text-[var(--muted-2)]'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {markdownTab === 'write' ? (
              <div>
                <textarea
                  value={reviewText}
                  onChange={(e) => { markDirty(); setReviewText(e.target.value); }}
                  rows={14}
                  placeholder="Write the comprehensive expert review here in Markdown format..."
                  className={`w-full rounded-xl border bg-[var(--surface)] p-3.5 font-mono text-xs leading-relaxed text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none ${
                    serverErrors.reviewText ? 'border-red-500' : 'border-[var(--border-mid)]'
                  }`}
                />
              </div>
            ) : (
              <div className="min-h-[280px] rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-4">
                {reviewText ? (
                  <SafeMarkdown content={reviewText} />
                ) : (
                  <p className="text-xs text-[var(--muted)] italic">Nothing to preview yet.</p>
                )}
              </div>
            )}

            <div className="flex justify-between text-[11px] text-[var(--muted)] font-['JetBrains_Mono',monospace]">
              {serverErrors.reviewText ? (
                <span className="text-red-400">{serverErrors.reviewText}</span>
              ) : (
                <span>Requirement: 50 to 50,000 characters</span>
              )}
              <span className={reviewText.length < 50 ? 'text-amber-400' : 'text-[var(--muted)]'}>
                {reviewText.length} / 50,000
              </span>
            </div>
          </div>

          {/* Section 3: Pros & Cons Repeater */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pros */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-emerald-400">
                  Pros &amp; Advantages (Max 15)
                </h3>
                <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)]">
                  {pros.length}/15
                </span>
              </div>

              <div className="space-y-2">
                {pros.map((pro, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={pro}
                      onChange={(e) => handleListChange(setPros, pros, idx, e.target.value)}
                      placeholder="e.g. 99.98% recorded uptime rate"
                      maxLength={300}
                      className="flex-1 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleListMove(setPros, pros, idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-20"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleListMove(setPros, pros, idx, 1)}
                      disabled={idx === pros.length - 1}
                      className="p-1 text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-20"
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleListRemove(setPros, pros, idx)}
                      className="p-1 text-rose-400 hover:text-rose-300"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {pros.length < 15 && (
                <button
                  type="button"
                  onClick={() => handleListAdd(setPros, pros)}
                  className="mt-2 text-xs font-semibold text-[var(--cyan)] hover:underline cursor-pointer"
                >
                  + Add another pro
                </button>
              )}
            </div>

            {/* Cons */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-rose-400">
                  Cons &amp; Drawbacks (Max 15)
                </h3>
                <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--muted)]">
                  {cons.length}/15
                </span>
              </div>

              <div className="space-y-2">
                {cons.map((con, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={con}
                      onChange={(e) => handleListChange(setCons, cons, idx, e.target.value)}
                      placeholder="e.g. Higher renewal rates on entry plans"
                      maxLength={300}
                      className="flex-1 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleListMove(setCons, cons, idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-20"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleListMove(setCons, cons, idx, 1)}
                      disabled={idx === cons.length - 1}
                      className="p-1 text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-20"
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleListRemove(setCons, cons, idx)}
                      className="p-1 text-rose-400 hover:text-rose-300"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {cons.length < 15 && (
                <button
                  type="button"
                  onClick={() => handleListAdd(setCons, cons)}
                  className="mt-2 text-xs font-semibold text-[var(--cyan)] hover:underline cursor-pointer"
                >
                  + Add another con
                </button>
              )}
            </div>
          </div>

          {/* Section 4: Extra Metadata (Pricing, Affiliate, Badges) */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2.5">
              3. At a Glance &amp; Marketing Links
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Image Upload Component */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--text)]">
                    Hosting Provider Image / Logo
                  </label>
                  <span className="text-[11px] text-[var(--muted-2)]">
                    JPEG, PNG, WebP (Max 5 MB)
                  </span>
                </div>

                {/* State A: User picked a new image file */}
                {selectedImageFile ? (
                  <div className="rounded-xl border border-[var(--cyan)]/40 bg-[var(--cyan-dim)]/20 p-4 transition">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {imagePreviewUrl && (
                          <img
                            src={imagePreviewUrl}
                            alt="Selected preview"
                            className="h-16 w-16 object-contain rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-1.5 shadow-sm"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--text)] line-clamp-1">
                              {selectedImageFile.name}
                            </span>
                            <span className="rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--cyan)] font-semibold border border-[var(--border)]">
                              {(selectedImageFile.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          {isEditMode && existingImageUrl && (
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-500 dark:text-amber-400">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              Will replace existing image upon saving
                            </p>
                          )}
                          {!isEditMode && (
                            <p className="mt-1 text-[11px] text-[var(--muted-2)]">
                              Ready to upload on save
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text)] hover:border-[var(--cyan)] transition cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveSelectedImage}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : existingImageUrl ? (
                  /* State B: Editing existing review with existing image */
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 transition">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getHostingImageUrl(existingImageUrl)}
                          alt="Current review logo"
                          className="h-16 w-16 object-contain rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-1.5 shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div>
                          <p className="text-xs font-bold text-[var(--text)]">
                            Current Image Active
                          </p>
                          <p className="mt-0.5 text-[11px] font-mono text-[var(--muted-2)] truncate max-w-[280px] sm:max-w-[360px]" title={existingImageUrl}>
                            {existingImageUrl}
                          </p>
                          <p className="text-[10px] text-[var(--muted-2)]">
                            Stored on backend • Click "Upload New Image" to replace
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition cursor-pointer self-end sm:self-auto"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload New Image
                      </button>
                    </div>
                  </div>
                ) : (
                  /* State C: Drag and drop upload dropzone */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                      isDraggingOver
                        ? 'border-[var(--cyan)] bg-[var(--cyan-dim)]/20'
                        : 'border-[var(--border-mid)] hover:border-[var(--cyan)] bg-[var(--surface-2)]/30 hover:bg-[var(--surface-2)]/60'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--cyan)] shadow-xs mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-[var(--text)]">
                      <span className="text-[var(--cyan)] font-bold">Click to upload</span> or drag and drop
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--muted-2)]">
                      PNG, JPEG, or WebP up to 5 MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {imageError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {imageError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Affiliate / CTA URL</label>
                <input
                  type="url"
                  value={affiliateUrl}
                  onChange={(e) => { markDirty(); setAffiliateUrl(e.target.value); }}
                  placeholder="https://provider.com?aff=123"
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Best For</label>
                <input
                  type="text"
                  value={bestFor}
                  onChange={(e) => { markDirty(); setBestFor(e.target.value); }}
                  placeholder="e.g. WordPress, Small Businesses, High-Traffic Sites"
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Starting Price</label>
                <input
                  type="text"
                  value={startingPrice}
                  onChange={(e) => { markDirty(); setStartingPrice(e.target.value); }}
                  placeholder="e.g. $2.99"
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">Money-Back Guarantee</label>
                <input
                  type="text"
                  value={moneyBackGuarantee}
                  onChange={(e) => { markDirty(); setMoneyBackGuarantee(e.target.value); }}
                  placeholder="e.g. 30 Days"
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="free-domain-check"
                  checked={freeDomain}
                  onChange={(e) => { markDirty(); setFreeDomain(e.target.checked); }}
                  className="h-4 w-4 rounded border-[var(--border-mid)] text-[var(--cyan)] focus:ring-[var(--cyan)]"
                />
                <label htmlFor="free-domain-check" className="text-xs font-semibold text-[var(--text)] cursor-pointer">
                  Includes Free Domain Name (1st Year)
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Reviewed By & Editorial Attribution */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                  4. Reviewed By &amp; Editorial Attribution
                </h2>
                <p className="text-xs text-[var(--muted-2)] mt-0.5">
                  Display the verified reviewer name, designation, bio, and avatar on the public review page.
                </p>
              </div>
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Author Attribution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reviewer Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Reviewer Name
                </label>
                <input
                  type="text"
                  value={expertName}
                  onChange={(e) => { markDirty(); setExpertName(e.target.value); }}
                  placeholder="e.g. Prakash Kotiya, Alex Morgan"
                  maxLength={100}
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
                <span className="text-[10px] text-[var(--muted)]">Displays as the primary author in "Reviewed By"</span>
              </div>

              {/* Reviewer Title / Designation */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Reviewer Job Title / Role
                </label>
                <input
                  type="text"
                  value={expertTitle}
                  onChange={(e) => { markDirty(); setExpertTitle(e.target.value); }}
                  placeholder="e.g. Infrastructure Performance Analyst"
                  maxLength={100}
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
                <span className="text-[10px] text-[var(--muted)]">Designation shown below reviewer name</span>
              </div>

              {/* Reviewer Bio */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Reviewer Bio / Methodology Statement
                </label>
                <textarea
                  value={expertBio}
                  onChange={(e) => { markDirty(); setExpertBio(e.target.value); }}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Conducts multi-region synthetic TTFB and continuous uptime telemetry across tier-1 cloud and shared hosting architectures."
                  className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] p-3 text-xs text-[var(--text)] focus:border-[var(--cyan)] focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1 font-['JetBrains_Mono',monospace]">
                  <span>Appears in the sidebar box next to the in-depth review</span>
                  <span>{expertBio.length}/500</span>
                </div>
              </div>

              {/* Reviewer Avatar Upload */}
              <div className="sm:col-span-2 space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--text)]">
                    Reviewer Photo / Avatar
                  </label>
                  <span className="text-[11px] text-[var(--muted-2)]">
                    JPEG, PNG, WebP (Max 5 MB)
                  </span>
                </div>

                {/* State A: User picked a new reviewer avatar file */}
                {selectedReviewerImageFile ? (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 transition">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {reviewerImagePreviewUrl && (
                          <img
                            src={reviewerImagePreviewUrl}
                            alt="Selected reviewer avatar preview"
                            className="h-14 w-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--text)] line-clamp-1">
                              {selectedReviewerImageFile.name}
                            </span>
                            <span className="rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 font-semibold border border-[var(--border)]">
                              {(selectedReviewerImageFile.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          {isEditMode && existingReviewerAvatarUrl && (
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-500 dark:text-amber-400">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              Will replace existing reviewer avatar upon saving
                            </p>
                          )}
                          {!isEditMode && (
                            <p className="mt-1 text-[11px] text-[var(--muted-2)]">
                              Ready to upload reviewer avatar on save
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => reviewerFileInputRef.current?.click()}
                          className="rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text)] hover:border-emerald-500 transition cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveSelectedReviewerImage}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : existingReviewerAvatarUrl ? (
                  /* State B: Editing existing review with existing reviewer avatar */
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 transition">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getHostingImageUrl(existingReviewerAvatarUrl)}
                          alt="Current reviewer avatar"
                          className="h-14 w-14 rounded-full object-cover border border-[var(--border-mid)] shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div>
                          <p className="text-xs font-bold text-[var(--text)]">
                            Current Reviewer Photo Active
                          </p>
                          <p className="mt-0.5 text-[11px] font-mono text-[var(--muted-2)] truncate max-w-[280px] sm:max-w-[360px]" title={existingReviewerAvatarUrl}>
                            {existingReviewerAvatarUrl}
                          </p>
                          <p className="text-[10px] text-[var(--muted-2)]">
                            Stored on backend • Click "Upload New Photo" to replace
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => reviewerFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-emerald-500 hover:text-emerald-500 transition cursor-pointer self-end sm:self-auto"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload New Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  /* State C: Drag and drop upload dropzone */
                  <div
                    onDragOver={handleReviewerDragOver}
                    onDragLeave={handleReviewerDragLeave}
                    onDrop={handleReviewerDrop}
                    onClick={() => reviewerFileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                      isReviewerDraggingOver
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-[var(--border-mid)] bg-[var(--surface-2)]/30 hover:border-emerald-500/60'
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--muted-2)] mb-2">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-[var(--text)]">
                      Drop reviewer photo here or <span className="text-emerald-500 underline">browse</span>
                    </p>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">
                      Square format recommended (1:1 ratio) • JPEG, PNG, or WebP up to 5 MB
                    </p>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={reviewerFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleReviewerFileInputChange}
                  className="hidden"
                />

                {reviewerImageError && (
                  <p className="text-xs text-rose-400 font-medium">{reviewerImageError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Category Ratings */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3">
            <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2.5">
              5. Category Ratings (0.0 to 5.0)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(catRatings).map(([key, val]) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-[var(--text)] capitalize mb-1">
                    {key}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={val}
                    onChange={(e) => {
                      markDirty();
                      const num = parseFloat(e.target.value) || 0;
                      setCatRatings((prev) => ({ ...prev, [key]: num }));
                    }}
                    className="w-full rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold text-[var(--text)]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Pricing Plans Repeater */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                6. Pricing Plans ({plans.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  markDirty();
                  setPlans([...plans, { name: '', price: '$', period: 'mo', badge: '', features: '' }]);
                }}
                className="text-xs font-bold text-[var(--cyan)] hover:underline cursor-pointer"
              >
                + Add Plan
              </button>
            </div>

            <div className="space-y-4">
              {plans.map((p, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)]/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text)] font-['Outfit',sans-serif]">
                      Plan #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        markDirty();
                        setPlans(plans.filter((_, i) => i !== idx));
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      Delete Plan
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-[var(--muted-2)] mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          markDirty();
                          const updated = [...plans];
                          updated[idx].name = e.target.value;
                          setPlans(updated);
                        }}
                        placeholder="e.g. Premium Shared"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[var(--muted-2)] mb-1">Price</label>
                      <input
                        type="text"
                        value={p.price}
                        onChange={(e) => {
                          markDirty();
                          const updated = [...plans];
                          updated[idx].price = e.target.value;
                          setPlans(updated);
                        }}
                        placeholder="e.g. $2.99"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[var(--muted-2)] mb-1">Billing Period</label>
                      <input
                        type="text"
                        value={p.period}
                        onChange={(e) => {
                          markDirty();
                          const updated = [...plans];
                          updated[idx].period = e.target.value;
                          setPlans(updated);
                        }}
                        placeholder="e.g. mo, yr"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[var(--muted-2)] mb-1">Badge (Optional)</label>
                      <input
                        type="text"
                        value={p.badge}
                        onChange={(e) => {
                          markDirty();
                          const updated = [...plans];
                          updated[idx].badge = e.target.value;
                          setPlans(updated);
                        }}
                        placeholder="e.g. Most Popular"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[var(--muted-2)] mb-1">Features (comma-separated)</label>
                    <input
                      type="text"
                      value={p.features}
                      onChange={(e) => {
                        markDirty();
                        const updated = [...plans];
                        updated[idx].features = e.target.value;
                        setPlans(updated);
                      }}
                      placeholder="e.g. 100 Websites, Free SSL, Daily Backups"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: FAQs Repeater */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h2 className="font-['Outfit',sans-serif] text-base font-bold text-[var(--text)]">
                7. Frequently Asked Questions ({faqs.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  markDirty();
                  setFaqs([...faqs, { question: '', answer: '' }]);
                }}
                className="text-xs font-bold text-[var(--cyan)] hover:underline cursor-pointer"
              >
                + Add FAQ
              </button>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--muted)] font-['JetBrains_Mono',monospace]">
                      Question #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        markDirty();
                        setFaqs(faqs.filter((_, i) => i !== idx));
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Delete FAQ
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      markDirty();
                      const updated = [...faqs];
                      updated[idx].question = e.target.value;
                      setFaqs(updated);
                    }}
                    placeholder="Question..."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => {
                      markDirty();
                      const updated = [...faqs];
                      updated[idx].answer = e.target.value;
                      setFaqs(updated);
                    }}
                    placeholder="Answer..."
                    rows={2}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Preview Panel Column (Right, 1 col) */}
        <div>
          <AdminStatsPreviewPanel
            stats={previewStats}
            loading={statsLoading}
            isEditMode={isEditMode}
            onRefresh={handleRefreshStats}
            refreshing={refreshingStats}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AdminReviewConfirmModal
        open={confirmDeleteModal}
        type="delete"
        review={{ providerName, slug: providerKey }}
        onClose={() => setConfirmDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
