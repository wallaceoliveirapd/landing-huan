import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { RestaurantDetailHero } from "@/components/organisms/RestaurantDetailHero";
import { RestaurantOverview } from "@/components/organisms/RestaurantOverview";
import { PhotoGallery } from "@/components/organisms/PhotoGallery";
import { OperatingHours } from "@/components/organisms/OperatingHours";
import { SectionSpacer } from "@/components/organisms/SectionSpacer";
import { RestaurantReviews } from "@/components/organisms/RestaurantReviews";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const r = await fetchQuery(api.restaurants.getBySlug, { slug });
  return { title: r ? `${r.name}, HUAN` : "Restaurante, HUAN" };
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

  return (
    <>
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
      <RestaurantReviews restaurantId={restaurant._id} />
    </>
  );
}
