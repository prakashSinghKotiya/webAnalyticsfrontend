/**
 * Utility helpers for Admin Dashboard.
 */

/**
 * Check if a user has SuperAdmin role.
 */
export function isSuperAdmin(user) {
  if (!user) return false;
  const role = (typeof user === 'string' ? user : user.role || '').toLowerCase();
  return role === 'superadmin' || role === 'super_admin';
}

/**
 * Check if a user has Admin or SuperAdmin role.
 */
export function isAdmin(user) {
  if (!user) return false;
  const role = (typeof user === 'string' ? user : user.role || '').toLowerCase();
  return role === 'admin' || role === 'superadmin' || role === 'super_admin';
}

/**
 * Determines whether currentUser has permission to promote targetUser to Admin.
 * Only SuperAdmins can promote Users to Admin. Self-promotion and deleted users prohibited.
 */
export function canPromoteToAdmin(currentUser, targetUser) {
  if (!isSuperAdmin(currentUser) || !targetUser) return false;
  const currentId = getUserId(currentUser);
  const targetId = getUserId(targetUser);
  if (currentId && targetId && String(currentId) === String(targetId)) return false;
  if (targetUser.deleted || targetUser.isDeleted) return false;
  const targetRole = (targetUser.role || 'User').toLowerCase();
  return targetRole === 'user';
}

/**
 * Determines whether currentUser has permission to demote targetUser to regular User.
 * Only SuperAdmins can demote Admins to User. SuperAdmins cannot be demoted via API.
 */
export function canDemoteToUser(currentUser, targetUser) {
  if (!isSuperAdmin(currentUser) || !targetUser) return false;
  const currentId = getUserId(currentUser);
  const targetId = getUserId(targetUser);
  if (currentId && targetId && String(currentId) === String(targetId)) return false;
  if (targetUser.deleted || targetUser.isDeleted) return false;
  const targetRole = (targetUser.role || '').toLowerCase();
  return targetRole === 'admin';
}

/**
 * Determines whether currentUser has permission to delete targetUser.
 * Boundaries:
 * - Cannot delete self
 * - SuperAdmins cannot be deleted via admin endpoints (neither by Admin nor SuperAdmin)
 * - Regular Admin cannot delete other Admins
 * - SuperAdmin can delete regular Users and Admins
 */
export function canDeleteUser(currentUser, targetUser) {
  if (!currentUser || !targetUser) return false;
  const currentId = getUserId(currentUser);
  const targetId = getUserId(targetUser);
  if (currentId && targetId && String(currentId) === String(targetId)) return false;
  if (targetUser.deleted || targetUser.isDeleted) return false;

  const targetRole = (targetUser.role || 'User').toLowerCase();
  // SuperAdmin accounts cannot be deleted through ordinary endpoints
  if (targetRole === 'superadmin' || targetRole === 'super_admin') return false;

  // If target is Admin, only SuperAdmin can delete
  if (targetRole === 'admin') {
    return isSuperAdmin(currentUser);
  }

  // Regular Users can be deleted by Admin or SuperAdmin
  return isAdmin(currentUser);
}

/**
 * Reason why a user cannot be deleted, for helpful tooltips.
 */
export function getDeleteRestrictionReason(currentUser, targetUser) {
  if (!currentUser || !targetUser) return '';
  const currentId = getUserId(currentUser);
  const targetId = getUserId(targetUser);
  if (currentId && targetId && String(currentId) === String(targetId)) {
    return 'You cannot delete your own account.';
  }
  const targetRole = (targetUser.role || 'User').toLowerCase();
  if (targetRole === 'superadmin' || targetRole === 'super_admin') {
    return 'SuperAdmin accounts are immutable and cannot be deleted via API.';
  }
  if (targetRole === 'admin' && !isSuperAdmin(currentUser)) {
    return 'Admins cannot delete peer Admin accounts. SuperAdmin authority required.';
  }
  return '';
}

/**
 * Determines whether currentUser has permission to force logout targetUser.
 * Boundaries:
 * - Cannot force logout self (use standard logout)
 * - Ordinary Admin cannot force logout a SuperAdmin or another Admin
 * - SuperAdmin can force logout anyone (Users and Admins)
 */
export function canForceLogoutUser(currentUser, targetUser) {
  if (!currentUser || !targetUser) return false;
  const currentId = getUserId(currentUser);
  const targetId = getUserId(targetUser);
  if (currentId && targetId && String(currentId) === String(targetId)) return false;

  const targetRole = (targetUser.role || 'User').toLowerCase();
  if (targetRole === 'superadmin' || targetRole === 'super_admin') {
    return isSuperAdmin(currentUser);
  }
  if (targetRole === 'admin') {
    return isSuperAdmin(currentUser);
  }
  return isAdmin(currentUser);
}

/**
 * Reason why a user cannot be force-logged-out, for helpful tooltips.
 */
export function getForceLogoutRestrictionReason(currentUser, targetUser) {
  if (!currentUser || !targetUser) return '';
  const currentId = getUserId(currentUser);
  const targetId = getUserId(targetUser);
  if (currentId && targetId && String(currentId) === String(targetId)) {
    return 'You cannot force logout your own active session.';
  }
  const targetRole = (targetUser.role || 'User').toLowerCase();
  if (targetRole === 'superadmin' && !isSuperAdmin(currentUser)) {
    return 'Admins cannot force logout a SuperAdmin.';
  }
  if (targetRole === 'admin' && !isSuperAdmin(currentUser)) {
    return 'Admins cannot force logout peer Admin accounts. SuperAdmin authority required.';
  }
  return '';
}

/**
 * Get badge styling for role audit log action strings.
 */
export function getActionBadgeConfig(action) {
  const normalized = (action || '').toUpperCase();
  switch (normalized) {
    case 'PROMOTE_TO_ADMIN':
      return {
        label: 'Promoted To Admin',
        className: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
        icon: '↑',
      };
    case 'DEMOTE_TO_USER':
      return {
        label: 'Demoted To User',
        className: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
        icon: '↓',
      };
    case 'CLI_PROVISION':
      return {
        label: 'CLI Provision',
        className: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
        icon: '★',
      };
    case 'DELETE_USER':
      return {
        label: 'User Deleted',
        className: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
        icon: '✕',
      };
    case 'FORCE_LOGOUT':
      return {
        label: 'Force Logout',
        className: 'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30',
        icon: '⏻',
      };
    default:
      return {
        label: action || 'Action',
        className: 'bg-[var(--surface-3)] text-[var(--muted-2)] border border-[var(--border)]',
        icon: '•',
      };
  }
}

/**
 * Extract user ID safely across MongoDB _id or standard id.
 * Always returns a clean string representation.
 */
export function getUserId(user) {
  if (user === null || user === undefined) return '';
  if (typeof user === 'string' || typeof user === 'number') return String(user);
  const id = user.id ?? user._id ?? user.userId;
  return id != null ? String(id) : '';
}

/**
 * Safely format user ID for display.
 * For long identifiers (e.g. MongoDB ObjectIds, UUIDs) shows the tail.
 * For numeric IDs (e.g. 1, 42) shows the complete integer ID.
 */
export function formatUserId(id) {
  if (id === null || id === undefined || id === '') return 'No ID';
  const str = String(id);
  if (str.length > 8) {
    return `ID: …${str.slice(-6)}`;
  }
  return `ID: ${str}`;
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
    case 'super_admin':
      return {
        label: 'SuperAdmin',
        className: 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
        indicator: 'bg-purple-600 dark:bg-purple-400 animate-pulse',
        isPrivileged: true,
        isSuperAdmin: true,
      };
    case 'admin':
      return {
        label: 'Admin',
        className: 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan)]/35',
        indicator: 'bg-[var(--cyan)]',
        isPrivileged: true,
        isSuperAdmin: false,
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
 * Accepts either plan string or user object.
 */
export function getPlanBadgeConfig(planOrUser) {
  const plan =
    typeof planOrUser === 'object' && planOrUser !== null
      ? planOrUser.plan || planOrUser.plans
      : planOrUser;
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
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
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
    `"${u.plan || u.plans || 'free'}"`,
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

/**
 * Format relative time (e.g., "2m ago", "1h ago", "Just now").
 */
export function getRelativeTime(dateInput) {
  if (!dateInput) return 'Never';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Never';
    const now = Date.now();
    const diffMs = now - d.getTime();
    if (diffMs < 0) return 'Just now';
    const sec = Math.floor(diffMs / 1000);
    if (sec < 45) return 'Just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(d);
  } catch {
    return 'Never';
  }
}

/**
 * Get visual badge config for monitor lifecycle state (active vs paused).
 */
export function getMonitorStatusBadgeConfig(status) {
  const normalized = (status || 'active').toLowerCase();
  if (normalized === 'paused') {
    return {
      label: 'Paused',
      className: 'bg-[var(--surface-3)] text-[var(--muted-2)] border border-[var(--border-mid)]',
      dotColor: 'bg-[var(--muted-2)]',
      isPaused: true,
    };
  }
  return {
    label: 'Active',
    className: 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan)]/30',
    dotColor: 'bg-[var(--cyan)]',
    isPaused: false,
  };
}

/**
 * Get visual badge config for monitor probe health (UP, DOWN, DEGRADED, PENDING).
 */
export function getMonitorHealthBadgeConfig(lastResult) {
  if (!lastResult) {
    return {
      label: 'Pending',
      badgeClass: 'bg-[var(--surface-3)] text-[var(--muted-2)] border border-[var(--border)]',
      dotClass: 'bg-[var(--muted-2)]',
      status: 'PENDING',
    };
  }

  const status = typeof lastResult === 'string' ? lastResult.toUpperCase() : (lastResult.status || 'PENDING').toUpperCase();

  if (status === 'UP') {
    return {
      label: 'Operational',
      badgeClass: 'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green)]/35',
      dotClass: 'bg-[var(--green)]',
      status: 'UP',
    };
  }

  if (status === 'DOWN') {
    return {
      label: 'Down',
      badgeClass: 'bg-red-100 text-red-800 border border-red-300 dark:bg-[var(--red-dim)] dark:text-[var(--red)] dark:border-[var(--red)]/40',
      dotClass: 'bg-[var(--red)] animate-pulse',
      status: 'DOWN',
    };
  }

  if (status === 'DEGRADED') {
    return {
      label: 'Degraded',
      badgeClass: 'bg-[var(--orange-dim)] text-[var(--orange)] border border-[var(--orange)]/35',
      dotClass: 'bg-[var(--orange)]',
      status: 'DEGRADED',
    };
  }

  return {
    label: 'Pending',
    badgeClass: 'bg-[var(--surface-3)] text-[var(--muted-2)] border border-[var(--border)]',
    dotClass: 'bg-[var(--muted-2)]',
    status: 'PENDING',
  };
}

/**
 * Format interval string into readable text.
 */
export function formatIntervalLabel(interval) {
  const map = {
    '1m': 'Every 1 min',
    '5m': 'Every 5 mins',
    '10m': 'Every 15 mins',
    '15m': 'Every 15 mins',
    '30m': 'Every 30 mins',
    '1h': 'Every 1 hour',
  };
  return map[interval] || interval || '15m';
}

/**
 * Format milliseconds into clean latency string.
 */
export function formatLatency(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) return '—';
  const val = Math.round(Number(ms));
  return `${val} ms`;
}

/**
 * Export monitors dataset to CSV downloadable file.
 */
export function exportMonitorsToCsv(monitors, filename = 'uptime-monitors-export.csv') {
  if (!monitors || !monitors.length) return false;

  const headers = [
    'Monitor ID',
    'URL',
    'Interval',
    'Status',
    'Health',
    'Response Time (ms)',
    'HTTP Status',
    'Owner Name',
    'Owner Email',
    'Last Checked At',
    'Created At',
  ];

  const rows = monitors.map((m) => {
    const ownerName = m.userId?.name || m.userName || 'Unknown';
    const ownerEmail = m.userId?.email || m.userEmail || 'Unknown';
    const health = m.lastResult?.status || m.health || 'PENDING';
    const rt = m.lastResult?.responseTime ?? m.responseTimeMs ?? '';
    const httpStatus = m.lastResult?.httpStatus ?? m.httpStatus ?? '';

    return [
      `"${m._id || m.id || ''}"`,
      `"${(m.url || '').replace(/"/g, '""')}"`,
      `"${m.interval || ''}"`,
      `"${m.status || ''}"`,
      `"${health}"`,
      `"${rt}"`,
      `"${httpStatus}"`,
      `"${ownerName.replace(/"/g, '""')}"`,
      `"${ownerEmail.replace(/"/g, '""')}"`,
      `"${m.lastCheckedAt || ''}"`,
      `"${m.createdAt || ''}"`,
    ];
  });

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

/**
 * Get visual badge configuration for contact message enquiry topic.
 */
export function getEnquiryTopicBadgeConfig(topic) {
  const normalized = (topic || '').toLowerCase();
  switch (normalized) {
    case 'support':
      return {
        label: 'Support',
        fullLabel: 'Technical Support',
        className: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
        dotColor: 'bg-amber-500',
      };
    case 'enterprise':
      return {
        label: 'Enterprise',
        fullLabel: 'Sales & Enterprise',
        className: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
        dotColor: 'bg-purple-500',
      };
    case 'feature':
      return {
        label: 'Feature',
        fullLabel: 'Feature Request',
        className: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
        dotColor: 'bg-cyan-500',
      };
    case 'billing':
      return {
        label: 'Billing',
        fullLabel: 'Billing & Account',
        className: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
        dotColor: 'bg-emerald-500',
      };
    case 'general':
    default:
      return {
        label: 'General',
        fullLabel: 'General Inquiry',
        className: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30',
        dotColor: 'bg-slate-400',
      };
  }
}

/**
 * Export array of contact messages to a CSV downloadable file.
 */
export function exportContactsToCsv(messages, filename = 'contact-inquiries-export.csv') {
  if (!messages || !messages.length) return false;

  const headers = ['Message ID', 'Name', 'Email', 'Topic', 'Message', 'Created At'];
  const rows = messages.map((m) => [
    `"${m.id || ''}"`,
    `"${(m.name || '').replace(/"/g, '""')}"`,
    `"${(m.email || '').replace(/"/g, '""')}"`,
    `"${m.enquiryTopic || ''}"`,
    `"${(m.message || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
    `"${m.createdAt || ''}"`,
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



