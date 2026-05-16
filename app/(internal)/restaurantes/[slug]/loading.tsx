import { Skeleton } from "@/components/atoms/Skeleton";
import { HeroSkeleton } from "@/components/organisms/skeletons/HeroSkeleton";
import { SectionSpacer } from "@/components/organisms/SectionSpacer";

export default function RestaurantDetailLoading() {
  return (
    <>
      <HeroSkeleton height={453} />
      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-2/5" />
        </div>
      </section>
      <SectionSpacer />
      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-1/3" />
            <Skeleton className="h-10 w-24 rounded-pill" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            <Skeleton className="h-[188px] w-[243px] rounded-card" />
            <Skeleton className="h-[188px] w-[243px] rounded-card" />
          </div>
        </div>
      </section>
      <SectionSpacer />
      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
          <Skeleton className="h-9 w-2/3 max-w-[280px]" />
          <div className="flex flex-col gap-2 w-full">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex justify-between w-full">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
