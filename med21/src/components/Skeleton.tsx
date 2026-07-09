export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-xl ${className}`}
      style={{ minHeight: '1em' }}
    />
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
      <Skeleton className="h-44 w-full mb-4 rounded-2xl" />
      <Skeleton className="h-3 w-1/3 mb-2" />
      <Skeleton className="h-4 w-3/4 mb-1" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center gap-4">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>
  );
}
