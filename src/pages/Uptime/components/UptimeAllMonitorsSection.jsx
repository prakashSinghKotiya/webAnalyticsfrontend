import { memo, useMemo, useState } from 'react';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  formatCreationDate,
  formatInterval,
  formatMs,
  getStatusMeta,
  relativeTime,
} from '../uptime.utils';
import { UPTIME_INTERVALS } from '../../../api/uptime';
import UptimePagination from './UptimePagination';

const CARD =
  'rounded-3xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 sm:p-10 shadow-[var(--shadow-card)]';

/** Single monitor card with status, interval, actions and live latency tag */
function MonitorCard({
  monitor,
  isSelected,
  actionState,
  onSelect,
  onTogglePause,
  onDelete,
  onUpdate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(monitor.url);
  const [editInterval, setEditInterval] = useState(monitor.interval === '10m' ? '15m' : (monitor.interval || '15m'));

  const id = monitor._id || monitor.id;
  const isPaused = monitor.status === 'paused';
  const unwrap = (obj) => (obj && typeof obj === 'object' && obj.result ? obj.result : obj);
  const last = unwrap(monitor.lastCheck || monitor.lastResult);
  const meta = getStatusMeta(last?.status || monitor.status);

  const isPausingOrResuming = actionState === 'pause' || actionState === 'resume';
  const isDeleting = actionState === 'delete';
  const isUpdating = actionState === 'update';

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const success = await onUpdate(id, {
      url: editUrl,
      interval: editInterval,
      status: monitor.status,
    });
    if (success) setIsEditing(false);
  };

  return (
    <li
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition ${
        isSelected
          ? 'border-[var(--green)]/70 bg-[var(--green-dim)]/40 shadow-xs'
          : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-bright)]'
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 flex-none rounded-full"
                style={{ backgroundColor: meta.dotColor || meta.color }}
              />
              <span
                className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: meta.bgColor,
                  color: meta.color,
                }}
              >
                {isPaused ? 'Paused' : meta.label}
              </span>

              <span className="text-[11px] text-[var(--muted-2)]">
                {formatInterval(monitor.interval)}
              </span>
            </div>

            {/* URL or Edit Form */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="mt-2.5 flex flex-col gap-2">
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none"
                  placeholder="https://example.com"
                  required
                />
                <div className="flex items-center gap-2">
                  <select
                    value={editInterval}
                    onChange={(e) => setEditInterval(e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)] outline-none"
                  >
                    {UPTIME_INTERVALS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.disabled && opt.value !== monitor.interval}
                      >
                        {opt.locked && opt.value !== monitor.interval ? `🔒 ${opt.label}` : opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="cursor-pointer rounded-lg bg-[#064e3b] dark:bg-[#065f46] px-3 py-1 text-xs font-semibold text-white"
                  >
                    {isUpdating ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="cursor-pointer text-xs text-[var(--muted-2)] hover:text-[var(--text)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => onSelect(monitor)}
                className="mt-2 block w-full cursor-pointer text-left text-base font-bold text-[var(--text)] transition hover:text-[var(--cyan)]"
              >
                <span className="truncate block" title={monitor.url}>
                  {monitor.url}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Live Telemetry / Last Check Preview */}
        {last ? (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs">
            <span className="font-semibold text-[var(--text)] font-['JetBrains_Mono',monospace]">
              {formatMs(last.TotalresponseTime ?? last.responseTime)}
            </span>
            <span className="text-[var(--muted-2)]">·</span>
            <span className="truncate text-[var(--muted-2)] font-['JetBrains_Mono',monospace]">
              {last.httpStatus ? `HTTP ${last.httpStatus}` : 'Checked'}
            </span>
            <span className="text-[var(--muted-2)]">·</span>
            <span className="text-[var(--muted-2)]">
              {relativeTime(last.timestamp || last.receivedAt)}
            </span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-3 py-2 text-xs text-[var(--muted-2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--orange)] animate-pulse" />
            <span>Awaiting first probe check…</span>
          </div>
        )}

        {/* Creation Date */}
        {(monitor.createdAt || monitor.created_at) && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[var(--muted-2)]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-none text-[var(--muted)]"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="truncate">
              Created on{' '}
              <strong className="font-medium text-[var(--text)]">
                {formatCreationDate(monitor.createdAt || monitor.created_at)}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)]/60 pt-3">
        <button
          type="button"
          onClick={() => onSelect(monitor)}
          className={`inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold transition hover:underline ${
            isSelected ? 'text-[var(--cyan)]' : 'text-[var(--muted-2)] hover:text-[var(--text)]'
          }`}
          title="Inspect running monitor and view recent telemetry"
        >
          <span>{isSelected ? 'Viewing Telemetry ↑' : 'Inspect Telemetry'}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => onTogglePause(monitor)}
            disabled={isPausingOrResuming}
            className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              isPaused
                ? 'border-[var(--green)]/30 bg-[var(--green-dim)] text-[var(--green)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted-2)] hover:border-[var(--border-bright)] hover:text-[var(--text)]'
            }`}
            title={isPaused ? 'Resume monitoring' : 'Pause monitoring'}
          >
            {isPausingOrResuming ? 'Updating…' : isPaused ? 'Resume' : 'Pause'}
          </button>

          {/* Quick Edit */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 text-[var(--muted-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--text)]"
            title="Edit monitor"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>

          {/* Delete Monitor */}
          <button
            type="button"
            onClick={() => onDelete(id)}
            disabled={isDeleting}
            className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 text-[var(--muted-2)] transition hover:border-[var(--red)]/40 hover:bg-[var(--red)]/10 hover:text-[var(--red)] disabled:opacity-50"
            title="Delete monitor"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * UptimeAllMonitorsSection — Comprehensive monitor management, live status, and pagination.
 *
 * Implements:
 *  - Fresh database fetch representation (no local storage reliance)
 *  - Client-side smooth pagination with custom page sizes (6, 12, 24)
 *  - Filter by status (All, Active, Paused) and search by domain
 *  - Refresh action to re-sync with backend
 *  - Full dark and light theme compliance
 */
function UptimeAllMonitorsSection({
  monitors,
  loading,
  error,
  activeId,
  actionInProgress,
  onRefresh,
  onSelect,
  onTogglePause,
  onDelete,
  onUpdate,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'PAUSED'

  // Filtered monitors memo
  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      const matchSearch =
        !searchQuery.trim() || m.url.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && m.status === 'active') ||
        (statusFilter === 'PAUSED' && m.status === 'paused');
      return matchSearch && matchStatus;
    });
  }, [monitors, searchQuery, statusFilter]);

  // Pagination calculations
  const totalItems = filteredMonitors.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedMonitors = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredMonitors.slice(start, start + pageSize);
  }, [filteredMonitors, safePage, pageSize]);

  return (
    <section className={`${CARD} fade-up-delay-2`}>
      {/* Header with Title and Global Counts */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight text-[var(--text)]">
              All Monitors &amp; History
            </h2>
            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-xs font-semibold text-[var(--cyan)]">
              {monitors.length} total
            </span>
          </div>
          <p className="text-xs text-[var(--muted-2)]">
            Live database records fetched directly from backend. Never cached in local storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)] disabled:opacity-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? 'animate-spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{loading ? 'Syncing…' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by URL or hostname…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 pl-3.5 pr-4 text-xs text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--cyan)]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          {['ALL', 'ACTIVE', 'PAUSED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs'
                  : 'text-[var(--muted-2)] hover:text-[var(--text)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Page Size Select */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--muted-2)]">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-xs font-medium text-[var(--text)] outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((sz) => (
              <option key={sz} value={sz}>
                {sz} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monitor Cards List */}
      {loading && monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--cyan)] border-t-transparent" />
          <p className="mt-3 text-xs text-[var(--muted-2)]">Fetching uptime monitors from server…</p>
        </div>
      ) : error && monitors.length === 0 ? (
        <div className="rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 p-6 text-center text-sm text-[var(--red)]">
          {error}
        </div>
      ) : filteredMonitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-mid)] p-8 text-center">
          <p className="text-sm font-semibold text-[var(--text)]">No monitors found</p>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            {searchQuery
              ? 'No monitors matched your search query.'
              : 'Add your first target URL in the section above to begin monitoring.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedMonitors.map((monitor) => {
              const id = monitor._id || monitor.id;
              return (
                <MonitorCard
                  key={id}
                  monitor={monitor}
                  isSelected={id === activeId}
                  actionState={actionInProgress[id]}
                  onSelect={onSelect}
                  onTogglePause={onTogglePause}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                />
              );
            })}
          </ul>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 border-t border-[var(--border)] pt-5">
              <UptimePagination
                page={safePage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
                label={
                  <span>
                    Showing <strong className="text-[var(--text)]">{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalItems)}</strong> of{' '}
                    <strong className="text-[var(--text)]">{totalItems}</strong> monitors
                  </span>
                }
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default memo(UptimeAllMonitorsSection);
