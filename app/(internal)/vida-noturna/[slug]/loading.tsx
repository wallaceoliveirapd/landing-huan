import { Skeleton } from "@/components/atoms/Skeleton";

export default function NightlifeDetailLoading() {
  return (
    <main className="min-h-screen bg-white pb-32">
      <Skeleton className="w-full aspect-[16/10] !rounded-none" />
      <div className="px-6 pt-6 max-w-screen-md mx-auto flex flex-col gap-3">
        <Skeleton className="h-6 w-2/3 max-w-[280px]" />
        <Skeleton className="h-4 w-full max-w-[400px]" />
      </div>
      <div className="px-6 pt-6 max-w-screen-md mx-auto flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 !rounded-[16px]" />
        ))}
      </div>
    </main>
  );
}
