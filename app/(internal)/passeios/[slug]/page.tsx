import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { TourDetailHero } from "@/components/organisms/TourDetailHero";
import { TourOverview } from "@/components/organisms/TourOverview";
import { TourCtaFooter } from "@/components/organisms/TourCtaFooter";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const t = await fetchQuery(api.tours.getBySlug, { slug });
  return { title: t ? `${t.title}, HUAN` : "Passeio, HUAN" };
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

  return (
    <>
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
      <div className="h-32" />
      <TourCtaFooter url={tour.url} title={tour.title} />
    </>
  );
}
