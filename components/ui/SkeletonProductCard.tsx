export function SkeletonProductCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <div className="skeleton-shimmer aspect-square w-full rounded-xl" />
      <div className="mt-3 space-y-2">
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        <div className="skeleton-shimmer h-6 w-1/2 rounded" />
        <div className="skeleton-shimmer mt-4 h-[52px] w-full rounded-[10px]" />
      </div>
    </div>
  );
}
