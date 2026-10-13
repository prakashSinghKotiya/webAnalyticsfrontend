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
    className: 'bg-[var(--cyan-dim)] text-[var(--cyan)] border border-[var(--cyan)]/30 shadow-[0_0_8px_var(--cyan-dim)]',
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
      badgeClass: 'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green)]/35 shadow-[0_0_8px_var(--green-dim)]',
      dotClass: 'bg-[var(--green)]',
      status: 'UP',
    };
  }

  if (status === 'DOWN') {
    return {
      label: 'Down',
      badgeClass: 'bg-[var(--red-dim)] text-[var(--red)] border border-[var(--red)]/40 shadow-[0_0_10px_var(--red-dim)]',
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
    '10m': 'Every 10 mins',
    '30m': 'Every 30 mins',
    '1h': 'Every 1 hour',
  };
  return map[interval] || interval || '5m';
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


