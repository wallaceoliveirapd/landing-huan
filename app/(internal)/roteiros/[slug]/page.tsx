import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { RoteiroTimeline } from "@/components/organisms/RoteiroTimeline";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const it = await fetchQuery(api.itineraries.getBySlug, { slug });
  return { title: it ? `${it.title}, HUAN` : "Roteiro, HUAN" };
}

export default async function RoteiroDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const itinerary = await fetchQuery(api.itineraries.getBySlug, { slug });
  if (!itinerary) return notFound();

  return (
    <>
      <GtmViewItem
        item_type="roteiro"
        item_id={itinerary._id}
        item_name={itinerary.title}
        item_city={itinerary.city ?? null}
        item_slug={itinerary.slug}
      />
      <InternalPageHero
        title={itinerary.title}
        image={itinerary.cover}
        backHref="/roteiros"
      />
      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-6 p-6">
          <p className="text-[15px] leading-[1.55] text-[var(--color-neutral-600)]">
            {itinerary.subtitle}
          </p>
          <RoteiroTimeline itinerary={{ ...itinerary, id: itinerary._id }} />
        </div>
      </section>
    </>
  );
}
