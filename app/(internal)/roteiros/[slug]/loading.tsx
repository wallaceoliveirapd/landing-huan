import { Skeleton } from "@/components/atoms/Skeleton";
import { InternalHeroSkeleton } from "@/components/organisms/skeletons/InternalHeroSkeleton";

export default function RoteiroDetailLoading() {
  return (
    <>
      <InternalHeroSkeleton />
      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-6 p-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center pt-1.5">
                <Skeleton className="size-9 rounded-full" />
                {i < 2 && <Skeleton className="mt-2 w-px flex-1" />}
              </div>
              <div className="flex flex-1 flex-col gap-3 min-w-0">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4 overflow-hidden">
                  <Skeleton className="h-[260px] w-[254px] flex-none rounded-card" />
                  <Skeleton className="h-[260px] w-[254px] flex-none rounded-card" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
