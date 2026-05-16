import { Skeleton } from "@/components/atoms/Skeleton";
import { HeroSkeleton } from "@/components/organisms/skeletons/HeroSkeleton";
import { CardSmallSkeleton } from "@/components/organisms/skeletons/CardSmallSkeleton";
import { SectionSpacer } from "@/components/organisms/SectionSpacer";

export default function HomeLoading() {
  return (
    <>
      {/* HeroPromo */}
      <section className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-11 w-full rounded-pill" />
          <div className="flex w-full items-end gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <Skeleton className="size-[88px] rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <HeroSkeleton />

      {/* Ofertas */}
      <section className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
          <Skeleton className="h-8 w-2/3 max-w-[280px]" />
          <div className="flex gap-4 overflow-hidden">
            <CardSmallSkeleton />
            <CardSmallSkeleton />
          </div>
          <Skeleton className="h-12 w-full rounded-pill" />
          <Skeleton className="h-[128px] w-full rounded-card" />
        </div>
      </section>

      <SectionSpacer />

      {/* Restaurantes */}
      <section className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
          <Skeleton className="h-8 w-2/3 max-w-[280px]" />
          <div className="flex gap-4 overflow-hidden">
            <CardSmallSkeleton />
            <CardSmallSkeleton />
          </div>
          <Skeleton className="h-12 w-full rounded-pill" />
        </div>
      </section>
    </>
  );
}
