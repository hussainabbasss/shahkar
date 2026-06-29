export function CodBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex max-w-full min-w-0 flex-wrap items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary bg-primary-light px-3 py-2 text-center text-sm font-semibold text-primary ${className}`}
    >
      <span aria-hidden="true">💚</span>
      <span className="min-w-0 break-words">Cash on Delivery Available</span>
    </div>
  );
}
