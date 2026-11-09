import { axiosWithCreds, axiosWithoutCreds } from './axiosInstance';

/**
 * Contact Us API Client
 *
 * Backend source of truth:
 *  - Mounted at /api/contact (and /contact)
 *  - Public:
 *      POST /api/contact
 *      Body: { name, email, enquiryTopic, message }
 *      Rate limiting: 5 submissions per 15 minutes per IP
 *  - Admin Protected (Admin & SuperAdmin RBAC):
 *      GET /api/contact
 *      Query: { page, limit, enquiryTopic, search|q }
 *      GET /api/contact/:id
 *      Params: { id: UUID }
 */

export const ALLOWED_ENQUIRY_TOPICS = Object.freeze([
  'support',
  'enterprise',
  'feature',
  'billing',
  'general',
]);

export const ENQUIRY_TOPICS = Object.freeze([
  {
    value: 'support',
    label: 'Technical Support & Incident Triage',
    shortLabel: 'Support',
    description: 'Uptime alert diagnostics, false positive analysis, API integration assistance.',
  },
  {
    value: 'enterprise',
    label: 'Enterprise Plans & Custom Probes',
    shortLabel: 'Enterprise',
    description: 'Dedicated monitoring probes, high-frequency SLA checks, volume tiers & SAML/SSO.',
  },
  {
    value: 'feature',
    label: 'Feature Request or Feedback',
    shortLabel: 'Feature',
    description: 'Propose new regional probes, check protocols, integrations, or UX enhancements.',
  },
  {
    value: 'billing',
    label: 'Billing & Account Assistance',
    shortLabel: 'Billing',
    description: 'Invoices, payment receipts, plan tier modifications, or enterprise quotes.',
  },
  {
    value: 'general',
    label: 'General Inquiry',
    shortLabel: 'General',
    description: 'Partnerships, security disclosures, or other business questions.',
  },
]);

/**
 * Submit a Contact Us inquiry message (Public Endpoint).
 *
 * @param {Object} payload
 * @param {string} payload.name - Sender name (1-100 characters)
 * @param {string} payload.email - Valid sender email address
 * @param {'support'|'enterprise'|'feature'|'billing'|'general'} payload.enquiryTopic
 * @param {string} payload.message - Inquiry message content (1-5000 characters)
 * @returns {Promise<{ success: boolean, message: string, data: { id: string } }>}
 */
export async function submitContactMessage(payload) {
  const sanitized = {
    name: typeof payload?.name === 'string' ? payload.name.trim() : '',
    email: typeof payload?.email === 'string' ? payload.email.trim() : '',
    enquiryTopic: typeof payload?.enquiryTopic === 'string' ? payload.enquiryTopic.trim().toLowerCase() : 'support',
    message: typeof payload?.message === 'string' ? payload.message.trim() : '',
  };

  try {
    const { data } = await axiosWithoutCreds.post('/api/contact', sanitized);
    return data;
  } catch (err) {
    const status = err.response?.status;
    const resData = err.response?.data;

    let friendlyMessage = 'An unexpected error occurred while sending your message. Please try again.';

    if (status === 429) {
      friendlyMessage = resData?.message || 'Too many contact submissions from your IP. Please wait 15 minutes before submitting again.';
    } else if (status === 400) {
      friendlyMessage = resData?.message || 'Please check your form inputs and try again.';
    } else if (resData?.message) {
      friendlyMessage = resData.message;
    }

    const enhancedError = new Error(friendlyMessage);
    enhancedError.status = status;
    enhancedError.errors = Array.isArray(resData?.errors) ? resData.errors : [];
    enhancedError.details = resData?.details;
    enhancedError.raw = err;
    throw enhancedError;
  }
}

/**
 * Retrieve paginated contact inquiry messages (Admin Protected).
 *
 * @param {Object} [params]
 * @param {number} [params.page=1] - 1-based page index
 * @param {number} [params.limit=10] - Items per page (max 100)
 * @param {string} [params.enquiryTopic] - Filter by topic ('support'|'enterprise'|'feature'|'billing'|'general')
 * @param {string} [params.search] - Search term by sender name or email
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<{ id: string, name: string, email: string, enquiryTopic: string, message: string, createdAt: string }>,
 *   pagination: { currentPage: number, limit: number, totalRecords: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean }
 * }>}
 */
export async function getContactMessagesAdmin(params = {}) {
  const cleanParams = {};

  if (params.page != null) cleanParams.page = Math.max(1, parseInt(params.page, 10) || 1);
  if (params.limit != null) cleanParams.limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 10));

  if (params.enquiryTopic && params.enquiryTopic !== 'all') {
    cleanParams.enquiryTopic = String(params.enquiryTopic).trim().toLowerCase();
  }

  const querySearch = params.search ?? params.q;
  if (querySearch && String(querySearch).trim()) {
    cleanParams.search = String(querySearch).trim();
  }

  const { data } = await axiosWithCreds.get('/api/contact', { params: cleanParams });
  return data;
}

/**
 * Retrieve a single contact inquiry message by UUID (Admin Protected).
 *
 * @param {string} id - UUID of the contact message
 * @returns {Promise<{ success: boolean, data: { id: string, name: string, email: string, enquiryTopic: string, message: string, createdAt: string, updatedAt: string } }>}
 */
export async function getContactMessageByIdAdmin(id) {
  if (!id) throw new Error('A contact message ID is required.');
  const { data } = await axiosWithCreds.get(`/api/contact/${encodeURIComponent(id)}`);
  return data;
}

/**
 * Delete a contact inquiry message by UUID (Admin Protected).
 *
 * @param {string} id - UUID of the contact message
 * @returns {Promise<{ success: boolean, message: string, data: { id: string } }>}
 */
export async function deleteContactMessageAdmin(id) {
  if (!id) throw new Error('A contact message ID is required to delete.');
  const { data } = await axiosWithCreds.delete(`/api/contact/${encodeURIComponent(id)}`);
  return data;
}

