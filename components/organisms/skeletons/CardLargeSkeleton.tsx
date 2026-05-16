import { Skeleton } from "@/components/atoms/Skeleton";

/** Skeleton matching the new OfferCard (full-bleed image + floating footer). */
export function CardLargeSkeleton() {
  return (
    <div className="relative w-[min(85vw,317px)] aspect-[317/213] flex-none rounded-[24px] bg-[var(--color-neutral-100)] animate-pulse overflow-hidden p-1.5 flex flex-col justify-between">
      <div className="flex w-full justify-end">
        <div className="size-12 rounded-full bg-white/60" />
      </div>
      <div className="bg-white rounded-[19px] px-4 py-3 flex flex-col gap-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
