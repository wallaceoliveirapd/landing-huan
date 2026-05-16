import { Skeleton } from "@/components/atoms/Skeleton";

/**
 * Skeleton for internal listing pages (passeios, restaurantes, dicas etc).
 * Matches the new clean white aesthetic: full-bleed image area on top
 * with text placeholders below.
 */
export function InternalHeroSkeleton() {
  return (
    <section className="w-full bg-white">
      <Skeleton className="aspect-[16/10] w-full !rounded-none" />
      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-3 px-6 pt-6">
        <Skeleton className="h-6 w-2/3 max-w-[300px]" />
        <Skeleton className="h-4 w-3/4 max-w-[360px]" />
      </div>
    </section>
  );
}
