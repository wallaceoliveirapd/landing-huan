import { Skeleton } from "@/components/atoms/Skeleton";
import { HeroSkeleton } from "@/components/organisms/skeletons/HeroSkeleton";

export default function TourDetailLoading() {
  return (
    <>
      <HeroSkeleton height={453} />
      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>
      </section>
    </>
  );
}
