import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { RestaurantDetailHero } from "@/components/organisms/RestaurantDetailHero";
import { RestaurantOverview } from "@/components/organisms/RestaurantOverview";
import { PhotoGallery } from "@/components/organisms/PhotoGallery";
import { OperatingHours } from "@/components/organisms/OperatingHours";
import { SectionSpacer } from "@/components/organisms/SectionSpacer";
import { PlaceReviewsSection } from "@/components/organisms/PlaceReviewsSection";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";

const BASE = "https://huanfalcao.com.br";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const items = await fetchQuery(api.restaurants.list, {});
  return items.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const r = await fetchQuery(api.restaurants.getBySlug, { slug });
  if (!r) return { title: "Restaurante não encontrado" };
  const desc = r.shortDesc?.slice(0, 160) ?? "";
  const url = `${BASE}/restaurantes/${slug}`;
  return {
    title: r.name,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: r.name,
      description: desc,
      url,
      type: "website",
      images: r.image ? [{ url: r.image, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await fetchQuery(api.restaurants.getBySlug, { slug });
  if (!restaurant) return notFound();

  // Transform Convex hours format → OperatingHours format
  const hours = (restaurant.hours ?? []).map((h) => ({
    weekday: h.day,
    hours: h.open && h.close ? `${h.open} – ${h.close}` : ("Fechado" as string),
  }));

  // Derive "open until" from today's hours (Sun=0…Sat=6 → PT labels)
  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const todayName = dayNames[new Date().getDay()];
  const todayHours = (restaurant.hours ?? []).find(
    (h) => h.day.toLowerCase().startsWith(todayName.toLowerCase().slice(0, 3))
  );
  const openUntil = todayHours?.close;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.shortDesc ?? undefined,
    image: restaurant.image ?? undefined,
    url: `${BASE}/restaurantes/${restaurant.slug}`,
    ...(restaurant.address ? { address: { "@type": "PostalAddress", streetAddress: restaurant.address, addressLocality: "João Pessoa", addressRegion: "PB", addressCountry: "BR" } } : {}),
    ...(restaurant.cuisine ? { servesCuisine: restaurant.cuisine } : {}),
    ...(restaurant.rating && restaurant.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: String(restaurant.rating), reviewCount: restaurant.reviewCount } }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GtmViewItem
        item_type="restaurante"
        item_id={restaurant._id}
        item_name={restaurant.name}
        item_slug={restaurant.slug}
      />
      <RestaurantDetailHero
        name={restaurant.name}
        image={restaurant.image}
        rating={restaurant.rating}
        ratingLabel={restaurant.reviewCount > 0 ? `${restaurant.reviewCount} avaliações` : "Muito bom"}
      />
      <RestaurantOverview
        openUntil={openUntil}
        address={restaurant.address}
        instagram={restaurant.instagram}
        phone={restaurant.phone}
      />
      {restaurant.photos.length > 0 && (
        <>
          <SectionSpacer />
          <PhotoGallery photos={restaurant.photos} />
        </>
      )}
      {hours.length > 0 && (
        <>
          <SectionSpacer />
          <OperatingHours hours={hours} />
        </>
      )}
      <SectionSpacer />
      <PlaceReviewsSection kind="restaurant" itemId={restaurant._id} noun="este restaurante" />
    </>
  );
}
