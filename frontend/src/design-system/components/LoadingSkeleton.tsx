import React from 'react';

export default function LoadingSkeleton({ variant = 'page' }: { variant?: 'page' | 'hero' | 'card' }) {
  if (variant === 'hero') {
    return (
      <div className="w-full rounded-2xl bg-white/80 p-6">
        <div className="mb-4 h-8 w-3/4 skeleton-shimmer rounded-lg" />
        <div className="mb-3 h-4 w-1/2 skeleton-shimmer rounded-lg" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-40 skeleton-shimmer rounded-lg" />
          <div className="h-40 skeleton-shimmer rounded-lg" />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="h-28 w-full rounded-lg p-4">
        <div className="h-6 w-1/3 skeleton-shimmer rounded" />
        <div className="mt-3 h-8 w-2/3 skeleton-shimmer rounded" />
      </div>
    );
  }

  // page
  return (
    <div className="min-h-screen w-full p-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8">
          <div className="h-10 w-1/3 skeleton-shimmer rounded-lg mb-4" />
          <div className="h-6 w-1/2 skeleton-shimmer rounded-lg" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-40 skeleton-shimmer rounded-lg md:col-span-2" />
          <div className="h-40 skeleton-shimmer rounded-lg" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="h-28 skeleton-shimmer rounded-lg" />
          <div className="h-28 skeleton-shimmer rounded-lg" />
          <div className="h-28 skeleton-shimmer rounded-lg" />
        </div>
      </div>
    </div>
  );
}
