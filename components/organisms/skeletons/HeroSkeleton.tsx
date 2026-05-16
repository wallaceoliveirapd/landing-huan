import { Skeleton } from "@/components/atoms/Skeleton";

/** Skeleton for the FeaturedHero image carousel (220px clean version). */
export function HeroSkeleton({ height = 220 }: { height?: number }) {
  return (
    <section className="w-full bg-white px-6 py-6">
      <div className="mx-auto w-full max-w-screen-md">
        <Skeleton
          className="w-full !rounded-[24px]"
          style={{ height } as React.CSSProperties}
        />
      </div>
    </section>
  );
}
