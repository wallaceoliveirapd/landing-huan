import { Skeleton } from "@/components/atoms/Skeleton";

/** Skeleton matching the new RestaurantCard / DicaCard (245px wide, 245/164 image). */
export function CardSmallSkeleton() {
  return (
    <div className="flex flex-col gap-2 w-[min(70vw,245px)] flex-none">
      <Skeleton className="aspect-[245/164] w-full !rounded-[24px]" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
