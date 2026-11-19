import { memo } from 'react';

/**
 * DashboardSkeleton
 * High-fidelity loading state placeholder matching the dashboard layout.
 */
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-[var(--surface-2)]" />
          <div className="h-4 w-72 rounded bg-[var(--surface-2)]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-44 rounded-xl bg-[var(--surface-2)]" />
          <div className="h-9 w-32 rounded-xl bg-[var(--surface-2)]" />
        </div>
      </div>

      {/* 2. Stat Cards Skeleton (5 cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5"
          >
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded bg-[var(--surface-2)]" />
              <div className="h-6 w-6 rounded bg-[var(--surface-2)]" />
            </div>
            <div className="mt-4 h-7 w-24 rounded bg-[var(--surface-2)]" />
            <div className="mt-2 h-3 w-32 rounded bg-[var(--surface-2)]" />
          </div>
        ))}
      </div>

      {/* 3. Availability Timeline Strip Skeleton */}
      <div className="h-32 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-5">
        <div className="flex justify-between">
          <div className="h-4 w-36 rounded bg-[var(--surface-2)]" />
          <div className="h-4 w-28 rounded bg-[var(--surface-2)]" />
        </div>
        <div className="mt-5 h-8 w-full rounded-lg bg-[var(--surface-2)]" />
        <div className="mt-3 flex justify-between">
          <div className="h-3 w-20 rounded bg-[var(--surface-2)]" />
          <div className="h-3 w-20 rounded bg-[var(--surface-2)]" />
        </div>
      </div>

      {/* 4. Response Time Chart Skeleton */}
      <div className="h-80 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6">
        <div className="flex justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-44 rounded bg-[var(--surface-2)]" />
            <div className="h-3 w-64 rounded bg-[var(--surface-2)]" />
          </div>
          <div className="h-4 w-36 rounded bg-[var(--surface-2)]" />
        </div>
        <div className="mt-8 h-52 w-full rounded-xl bg-[var(--surface-2)]" />
      </div>

      {/* 5. Bottom Row (Stacked Bar + Donut) Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 lg:col-span-2">
          <div className="h-5 w-48 rounded bg-[var(--surface-2)]" />
          <div className="mt-6 h-56 w-full rounded-xl bg-[var(--surface-2)]" />
        </div>
        <div className="h-80 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6">
          <div className="h-5 w-36 rounded bg-[var(--surface-2)]" />
          <div className="mx-auto mt-6 h-44 w-44 rounded-full bg-[var(--surface-2)]" />
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardSkeleton);
