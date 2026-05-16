import { Skeleton } from "@/components/atoms/Skeleton";

export default function DicaLoading() {
  return (
    <article className="bg-white">
      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-6 p-6">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-20 rounded-pill" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-10 w-3/5" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="aspect-[16/9] w-full rounded-card" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    </article>
  );
}
