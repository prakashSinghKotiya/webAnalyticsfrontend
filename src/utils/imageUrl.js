import { getApiBaseUrl } from '../api/axiosInstance';

/**
 * Resolves a hosting review image URL for display:
 * - If pathOrUrl is already an absolute URL (e.g. https://..., http://..., data:..., blob:...),
 *   returns it as-is for backward compatibility.
 * - If pathOrUrl is a backend-managed relative path (e.g. /uploads/images/hosting-reviews/xxx.png),
 *   prepends the dynamic API base URL (dev localhost:5000 or prod api.monitormyhost.com).
 * - If empty or null, returns an empty string so callers can display their standard fallback.
 *
 * @param {string} [pathOrUrl]
 * @returns {string} Fully qualified image URL or empty string
 */
export function getHostingImageUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return '';

  const trimmed = pathOrUrl.trim();
  if (!trimmed) return '';

  // Already an absolute URL, data URI, or blob URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

export default getHostingImageUrl;
