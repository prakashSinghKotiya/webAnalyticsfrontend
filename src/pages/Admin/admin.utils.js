/**
 * Utility helpers for Admin Dashboard.
 */

/**
 * Extract user ID safely across MongoDB _id or standard id.
 */
export function getUserId(user) {
  if (!user) return '';
  return user._id || user.id || '';
}

/**
 * Format ISO date string into readable local date and time.
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Format date for short display (e.g., "Jan 15, 2026").
 */
export function formatDate(dateInput) {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Get visual badge properties for user roles.
 */
export function getRoleBadgeConfig(role) {
  const normalized = (role || 'User').toLowerCase();

  switch (normalized) {
    case 'superadmin':
      return {
        label: 'SuperAdmin',
        className: 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
        indicator: 'bg-purple-400',
        isPrivileged: true,
      };
    case 'admin':
      return {
        label: 'Admin',
        className: 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan)]/35 shadow-[0_0_10px_var(--cyan-dim)]',
        indicator: 'bg-[var(--cyan)]',
        isPrivileged: true,
      };
    default:
      return {
        label: 'User',
        className: 'bg-[var(--surface-2)] text-[var(--muted-2)] border border-[var(--border-mid)]',
        indicator: 'bg-[var(--muted)]',
        isPrivileged: false,
      };
  }
}

/**
 * Get badge properties for subscription / usage plan.
 */
export function getPlanBadgeConfig(plan) {
  const normalized = (plan || 'free').toLowerCase();

  switch (normalized) {
    case 'enterprise':
      return {
        label: 'Enterprise',
        className: 'bg-[var(--orange-dim)] text-[var(--orange)] border border-[var(--orange)]/30',
      };
    case 'pro':
      return {
        label: 'Pro',
        className: 'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green)]/30',
      };
    default:
      return {
        label: 'Free',
        className: 'bg-[var(--surface-3)] text-[var(--muted)] border border-[var(--border)]',
      };
  }
}

/**
 * Generate user avatar initials from their full name.
 */
export function getUserInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Copy text to clipboard with modern navigator API.
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return false;
  }
}

/**
 * Export array of users to CSV downloadable file.
 */
export function exportUsersToCsv(users, filename = 'users-export.csv') {
  if (!users || !users.length) return false;

  const headers = ['ID', 'Name', 'Email', 'Role', 'Plan', 'Created At'];
  const rows = users.map((u) => [
    `"${getUserId(u)}"`,
    `"${(u.name || '').replace(/"/g, '""')}"`,
    `"${(u.email || '').replace(/"/g, '""')}"`,
    `"${u.role || 'User'}"`,
    `"${u.plan || 'free'}"`,
    `"${u.createdAt || ''}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

