"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FeaturedHero } from "./FeaturedHero";
import { FEATURED_SLIDES, SITE_CONTENT } from "@/lib/mock-data";

export function FeaturedHeroSection() {
  const title = useQuery(api.siteContent.get, { key: "featured_title" });
  const img1 = useQuery(api.siteContent.get, { key: "featured_hero_image_1" });
  const img2 = useQuery(api.siteContent.get, { key: "featured_hero_image_2" });
  const img3 = useQuery(api.siteContent.get, { key: "featured_hero_image_3" });

  // Build slides: use Convex images when set, else fall back to static FEATURED_SLIDES
  const slides = [
    img1 ? { src: img1, alt: "Hero slide 1" } : null,
    img2 ? { src: img2, alt: "Hero slide 2" } : null,
    img3 ? { src: img3, alt: "Hero slide 3" } : null,
  ].filter(Boolean) as { src: string; alt: string }[];

  const resolvedSlides = slides.length > 0 ? slides : FEATURED_SLIDES;

  return (
    <FeaturedHero
      title={title ?? SITE_CONTENT.featured.title}
      slides={resolvedSlides}
      cta={SITE_CONTENT.featured.cta}
    />
  );
}
