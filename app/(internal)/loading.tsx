import { InternalHeroSkeleton } from "@/components/organisms/skeletons/InternalHeroSkeleton";
import { CardLargeSkeleton } from "@/components/organisms/skeletons/CardLargeSkeleton";
import { SectionSpacer } from "@/components/organisms/SectionSpacer";

export default function InternalLoading() {
  return (
    <>
      <InternalHeroSkeleton />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <section className="bg-white">
            <div className="mx-auto w-full max-w-screen-md p-4">
              <CardLargeSkeleton />
            </div>
          </section>
          {i < 2 && <SectionSpacer />}
        </div>
      ))}
    </>
  );
}
