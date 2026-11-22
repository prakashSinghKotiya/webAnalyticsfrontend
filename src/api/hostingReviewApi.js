import { axiosWithCreds, axiosWithoutCreds } from './axiosInstance';

/**
 * Hosting Review API Client
 *
 * Backend source of truth:
 *  - Routes mounted at /review
 *  - Public:
 *      GET /review              -> List all published reviews (with headline stats)
 *      GET /review/:slug        -> Full public review page with live/snapshot stats
 *  - Admin (requires AdminChecker):
 *      GET    /review/admin/providers               -> Available monitored providers & check counts
 *      GET    /review/admin/providers/:key/stats    -> Live preview of provider stats
 *      GET    /review/admin/all                     -> All reviews (draft & published)
 *      GET    /review/admin/:id                     -> Single review by ID
 *      POST   /review/admin/create                  -> Create a review (auto-computes stats)
 *      PUT    /review/admin/:id                     -> Update editorial fields
 *      POST   /review/admin/:id/refresh-stats       -> Re-compute and freeze stats snapshot
 *      PATCH  /review/admin/:id/publish             -> Publish/unpublish review ({ published: boolean })
 *      DELETE /review/admin/:id                     -> Delete review
 */

// ==========================================
// PUBLIC API
// ==========================================

/**
 * Get all published hosting reviews with headline stats.
 * Cacheable, public endpoint.
 * Supports pagination (?page=1&limit=10), search (?search=...), and sorting (?sort=...).
 * @param {Object} [params] - { page, limit, search, sort, all }
 */
export async function getPublicReviews(params = {}) {
  const { data } = await axiosWithoutCreds.get('/review', { params });
  return data;
}

/**
 * Get full published review by URL slug.
 * Returns { success, data: { ...review, stats, statsSource: 'live'|'snapshot' } }
 */
export async function getPublicReviewBySlug(slug) {
  const cleanSlug = encodeURIComponent(String(slug).trim());
  const { data } = await axiosWithoutCreds.get(`/review/${cleanSlug}`);
  return data;
}

/**
 * Submit an anonymous public comment on a published review.
 * @param {string} slug - Review slug
 * @param {Object} payload - { guestName: string, body: string, website?: string }
 */
export async function submitPublicComment(slug, payload) {
  const cleanSlug = encodeURIComponent(String(slug).trim());
  const { data } = await axiosWithoutCreds.post(`/review/${cleanSlug}/comments`, payload);
  return data;
}

/**
 * Fetch approved comments for a published hosting review with pagination.
 * @param {string} slug - Review slug
 * @param {Object} [params] - { page, limit }
 */
export async function getPublicComments(slug, params = {}) {
  const cleanSlug = encodeURIComponent(String(slug).trim());
  const { data } = await axiosWithoutCreds.get(`/review/${cleanSlug}/comments`, { params });
  return data;
}

// ==========================================
// ADMIN API
// ==========================================

/**
 * List all hosting providers detected from uptime monitors with eligibility.
 * Supports compact pagination (?page=1&limit=10), search (?search=...),
 * and filters (?eligible=true|false, ?hasReview=true|false, ?all=true).
 * Returns { success, minChecks, data: [{ key, name, monitors, activeMonitors, totalChecks, eligible, review }], pagination }
 * @param {Object} [params] - { page, limit, search, eligible, hasReview, all }
 */
export async function getAdminProviders(params = {}) {
  const { data } = await axiosWithCreds.get('/review/admin/providers', { params });
  return data;
}

/**
 * Preview live uptime statistics for a provider before or during review editing.
 * Returns { success, data: { provider, checks, uptime, responseTime, incidents, performanceScore, sites, daily } }
 */
export async function previewAdminProviderStats(providerKey) {
  const cleanKey = encodeURIComponent(String(providerKey).trim());
  const { data } = await axiosWithCreds.get(`/review/admin/providers/${cleanKey}/stats`);
  return data;
}

/**
 * Get all reviews (draft and published) for the admin dashboard.
 * Supports compact pagination (?page=1&limit=10), status filtering (?status=published|draft),
 * search filtering (?search=...), and sorting (?sort=rating_desc|publishedat_desc|updatedat_asc).
 * Returns { success, data: [{ id, providerKey, providerName, slug, title, rating, isPublished, publishedAt, statsUpdatedAt, updatedAt }], pagination }
 * @param {Object} [params] - { page, limit, status, search, sort, all }
 */
export async function getAllReviewsAdmin(params = {}) {
  const { data } = await axiosWithCreds.get('/review/admin/all', { params });
  return data;
}

/**
 * Get single review by numeric ID for the admin editor.
 * Returns { success, data: HostingReview }
 */
export async function getReviewByIdAdmin(id) {
  const cleanId = encodeURIComponent(String(id));
  const { data } = await axiosWithCreds.get(`/review/admin/${cleanId}`);
  return data;
}

/**
 * Helper to build FormData from a review payload and optional image file and reviewer avatar file.
 * Automatically serializes objects/arrays to JSON strings and attaches the image files.
 * If payload is already a FormData instance, returns it directly.
 *
 * @param {Object|FormData} payload
 * @param {File|null} [imageFile] - Provider logo
 * @param {File|null} [reviewerImageFile] - Reviewer avatar image
 * @returns {FormData}
 */
export function buildReviewFormData(payload, imageFile = null, reviewerImageFile = null) {
  if (payload instanceof FormData) {
    if (imageFile) {
      payload.set('image', imageFile);
    }
    if (reviewerImageFile) {
      payload.set('reviewerImage', reviewerImageFile);
    }
    return payload;
  }

  const formData = new FormData();
  if (payload && typeof payload === 'object') {
    for (const [key, val] of Object.entries(payload)) {
      if (val === undefined || val === null) continue;
      if (key === 'image') {
        // If an explicit imageFile was passed separately, let imageFile take precedence
        if (imageFile) {
          continue;
        }
        if (val instanceof File || val instanceof Blob) {
          formData.append('image', val);
        } else if (typeof val === 'string' && val.trim() !== '') {
          formData.append('image', val.trim());
        }
      } else if (key === 'reviewerImage' || key === 'reviewerAvatar') {
        if (reviewerImageFile) continue;
        if (val instanceof File || val instanceof Blob) {
          formData.append('reviewerImage', val);
        }
      } else if (typeof val === 'object') {
        formData.append(key, JSON.stringify(val));
      } else {
        formData.append(key, String(val));
      }
    }
  }

  if (imageFile) {
    formData.set('image', imageFile);
  }
  if (reviewerImageFile) {
    formData.set('reviewerImage', reviewerImageFile);
  }

  return formData;
}

/**
 * Create a new hosting review.
 * Sends multipart/form-data via FormData.
 *
 * @param {Object|FormData} payload - { title, reviewText, providerKey, providerName?, rating?, pros?, cons?, extra?, image? }
 * @param {File|null} [imageFile] - Uploaded logo File object
 * @param {File|null} [reviewerImageFile] - Uploaded reviewer avatar File object
 */
export async function createReviewAdmin(payload, imageFile = null, reviewerImageFile = null) {
  const formData = buildReviewFormData(payload, imageFile, reviewerImageFile);
  const { data } = await axiosWithCreds.post('/review/admin/create', formData, {
    headers: {
      // Allow browser to generate multipart boundary
      'Content-Type': undefined,
    },
  });
  return data;
}

/**
 * Update editorial content of an existing review.
 * Sends multipart/form-data via FormData.
 *
 * @param {number|string} id
 * @param {Object|FormData} payload - { title?, reviewText?, providerName?, rating?, pros?, cons?, extra?, image? }
 * @param {File|null} [imageFile] - Uploaded logo File object
 * @param {File|null} [reviewerImageFile] - Uploaded reviewer avatar File object
 */
export async function updateReviewAdmin(id, payload, imageFile = null, reviewerImageFile = null) {
  const cleanId = encodeURIComponent(String(id));
  const formData = buildReviewFormData(payload, imageFile, reviewerImageFile);
  const { data } = await axiosWithCreds.put(`/review/admin/${cleanId}`, formData, {
    headers: {
      // Allow browser to generate multipart boundary
      'Content-Type': undefined,
    },
  });
  return data;
}

/**
 * Re-run stats calculation and update the frozen snapshot in the review record.
 * @param {number|string} id
 */
export async function refreshReviewStatsAdmin(id) {
  const cleanId = encodeURIComponent(String(id));
  const { data } = await axiosWithCreds.post(`/review/admin/${cleanId}/refresh-stats`);
  return data;
}

/**
 * Toggle published state of a review.
 * Freezes latest stats snapshot upon publishing.
 * @param {number|string} id
 * @param {boolean} published
 */
export async function setReviewPublishedAdmin(id, published) {
  const cleanId = encodeURIComponent(String(id));
  const { data } = await axiosWithCreds.patch(`/review/admin/${cleanId}/publish`, {
    published: Boolean(published),
  });
  return data;
}

/**
 * Permanently delete a review by ID.
 * @param {number|string} id
 */
export async function deleteReviewAdmin(id) {
  const cleanId = encodeURIComponent(String(id));
  const { data } = await axiosWithCreds.delete(`/review/admin/${cleanId}`);
  return data;
}

// ==========================================
// ADMIN COMMENT MODERATION API
// ==========================================

/**
 * Fetch comments for admin moderation across reviews with filtering and pagination.
 * @param {Object} [params] - { status: 'pending'|'approved'|'rejected'|'all', search, reviewId, page, limit }
 * @returns {Promise<{ success: boolean, comments: Array, counts: Object, pagination: Object }>}
 */
export async function getAdminComments(params = {}) {
  const { data } = await axiosWithCreds.get('/review/admin/comments', { params });
  return data;
}

/**
 * Update moderation status of a comment (approved, rejected, pending).
 * @param {number|string} id - Comment ID
 * @param {'approved'|'rejected'|'pending'} status
 */
export async function updateAdminCommentStatus(id, status) {
  const cleanId = encodeURIComponent(String(id));
  const { data } = await axiosWithCreds.patch(`/review/admin/comments/${cleanId}/status`, { status });
  return data;
}

/**
 * Permanently hard delete a comment by ID.
 * @param {number|string} id - Comment ID
 */
export async function deleteAdminComment(id) {
  const cleanId = encodeURIComponent(String(id));
  const { data } = await axiosWithCreds.delete(`/review/admin/comments/${cleanId}`);
  return data;
}

/**
 * Perform bulk moderation action (approve, reject, or delete) on multiple comments.
 * @param {Object} payload - { ids: number[], action: 'approve'|'reject'|'delete' }
 */
export async function bulkModerateAdminComments(payload) {
  const { data } = await axiosWithCreds.post('/review/admin/comments/bulk', payload);
  return data;
}
