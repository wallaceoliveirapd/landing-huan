import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { RoteiroTimeline } from "@/components/organisms/RoteiroTimeline";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";

const BASE = "https://huanfalcao.com.br";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const items = await fetchQuery(api.itineraries.list, {});
  return items.map((it) => ({ slug: it.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const it = await fetchQuery(api.itineraries.getBySlug, { slug });
  if (!it) return { title: "Roteiro não encontrado" };
  const desc = it.subtitle?.slice(0, 160) ?? "";
  const url = `${BASE}/roteiros/${slug}`;
  return {
    title: it.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: it.title,
      description: desc,
      url,
      type: "website",
      images: it.cover ? [{ url: it.cover, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function RoteiroDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const itinerary = await fetchQuery(api.itineraries.getBySlug, { slug });
  if (!itinerary) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: itinerary.title,
    description: itinerary.subtitle ?? undefined,
    image: itinerary.cover ?? undefined,
    url: `${BASE}/roteiros/${itinerary.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
