export function CardSkeleton() {
  return (
    <div
      className="surface-card rounded-2xl p-6 flex flex-col justify-between animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5 flex-1">
          <div className="h-4 w-40 bg-[#1F242D] rounded" />
          <div className="h-3 w-56 bg-[#1A1F27] rounded" />
          <div className="h-9 w-44 bg-[#1F242D] rounded mt-3" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-3 w-16 bg-[#1F242D] rounded ml-auto" />
          <div className="h-4 w-20 bg-[#1F242D] rounded ml-auto" />
          <div className="h-3 w-28 bg-[#1A1F27] rounded ml-auto" />
        </div>
      </div>
      <div className="mt-5 h-[196px] w-full surface-inset border rounded-xl" />
      <div className="mt-4 pt-3.5 border-t surface-divider flex items-center justify-between">
        <div className="h-3 w-32 bg-[#1A1F27] rounded" />
        <div className="h-4 w-36 bg-[#1F242D] rounded" />
      </div>
    </div>
  );
}
