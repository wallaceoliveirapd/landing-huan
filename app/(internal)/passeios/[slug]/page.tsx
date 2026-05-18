import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { TourDetailHero } from "@/components/organisms/TourDetailHero";
import { TourOverview } from "@/components/organisms/TourOverview";
import { TourCtaFooter } from "@/components/organisms/TourCtaFooter";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";
import { PlaceReviewsSection } from "@/components/organisms/PlaceReviewsSection";

const BASE = "https://huanfalcao.com.br";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const items = await fetchQuery(api.tours.list, {});
  return items.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const t = await fetchQuery(api.tours.getBySlug, { slug });
  if (!t) return { title: "Passeio não encontrado" };
  const desc = t.shortDesc?.slice(0, 160) ?? "";
  const url = `${BASE}/passeios/${slug}`;
  return {
    title: t.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: t.title,
      description: desc,
      url,
      type: "website",
      images: t.image ? [{ url: t.image, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = await fetchQuery(api.tours.getBySlug, { slug });
  if (!tour) return notFound();

  const ratingLabel =
    tour.reviewCount >= 200
      ? "Excelente"
      : tour.reviewCount >= 100
      ? "Muito bom"
      : "Bom";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: tour.title,
    description: tour.shortDesc ?? undefined,
    image: tour.image ?? undefined,
    url: `${BASE}/passeios/${tour.slug}`,
    ...(tour.rating && tour.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: String(tour.rating), reviewCount: tour.reviewCount } }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GtmViewItem
        item_type="passeio"
        item_id={tour._id}
        item_name={tour.title}
        item_slug={tour.slug}
      />
      <TourDetailHero
        title={tour.title}
        image={tour.image}
        rating={tour.rating}
        ratingLabel={
          tour.reviewCount > 0 ? `${tour.reviewCount} avaliações` : ratingLabel
        }
      />
      <TourOverview
        price={tour.price}
        priceFrom={tour.originalPrice}
        duration={tour.duration}
        description={tour.description}
        city={tour.city}
        tags={tour.tags}
      />
      <PlaceReviewsSection kind="tour" itemId={tour._id} noun="este passeio" />
      <div className="h-32" />
      <TourCtaFooter url={tour.url} title={tour.title} itemId={tour._id} itemType="tour" />
    </>
  );
}
