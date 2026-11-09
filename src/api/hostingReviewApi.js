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
 * Create a new hosting review.
 * @param {Object} payload - { title, reviewText, providerKey, providerName?, rating?, pros?, cons?, extra? }
 */
export async function createReviewAdmin(payload) {
  const { data } = await axiosWithCreds.post('/review/admin/create', payload);
  return data;
}

/**
 * Update editorial content of an existing review.
 * Note: stats and providerKey are not modified here.
 * @param {number|string} id
 * @param {Object} payload - { title?, reviewText?, providerName?, rating?, pros?, cons?, extra? }
 */
export async function updateReviewAdmin(id, payload) {
  const cleanId = encodeURIComponent(String(id));
  const { data } = await axiosWithCreds.put(`/review/admin/${cleanId}`, payload);
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
