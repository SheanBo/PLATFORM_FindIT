import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-lg gap-md" role="status" aria-busy="true" aria-label={message || "Loading"}>
      <Loader2 className={`${sizeClass} animate-spin text-amber-600`} aria-hidden="true" />
      {message && <p className="text-body-sm text-amber-700">{message}</p>}
    </div>
  );
}

export function SkeletonLoader({ rows = 3, showHeader = false }) {
  return (
    <div className="space-y-md">
      {showHeader && <div className="skeleton h-8 w-32 mb-lg" />}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-md">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-md">
      {/* Header */}
      <div className="skeleton h-8 w-full bg-amber-200" />
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-10 w-full bg-amber-100" />
      ))}
    </div>
  );
}
