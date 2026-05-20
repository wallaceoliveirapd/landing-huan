import type { Metadata } from "next";
import { HeroPromo } from "@/components/organisms/HeroPromo";

export const metadata: Metadata = {
  title: "Guia de viagem para o Nordeste",
  description:
    "Passeios, praias, restaurantes e dicas exclusivas do Nordeste, curados por Huan Falcão. Planeje sua viagem com IA e descubra João Pessoa como um local.",
  alternates: { canonical: "https://huanfalcao.com.br" },
  openGraph: {
    url: "https://huanfalcao.com.br",
    type: "website",
    images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordesteAÍ - By Huan Falcão" }],
  },
};
import { FeaturedHeroSection } from "@/components/organisms/FeaturedHeroSection";
import { OffersSection } from "@/components/organisms/OffersSection";
import { CouponsSection } from "@/components/organisms/CouponsSection";
import { RestaurantsSection } from "@/components/organisms/RestaurantsSection";
import { SectionSpacer } from "@/components/organisms/SectionSpacer";
import { DicasPreview } from "@/components/organisms/DicasPreview";
import { LoggedOutCta } from "@/components/organisms/LoggedOutCta";
import { SITE_CONTENT } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <main className="bg-white overflow-x-hidden">
      <HeroPromo
        title={SITE_CONTENT.hero.title}
        subtitle={SITE_CONTENT.hero.subtitle}
        searchPlaceholder={SITE_CONTENT.hero.searchPlaceholder}
      />
      <OffersSection />
      {/*
        LoggedOutCta returns null when logged in, avoid double spacer by
        rendering a single SectionSpacer INSIDE the component when visible.
        The spacer before CouponsSection always renders.
      */}
      <LoggedOutCta />
      <SectionSpacer />
      <CouponsSection />
      <SectionSpacer />
      <RestaurantsSection />
      <SectionSpacer />
      <FeaturedHeroSection />
      <SectionSpacer />
      <DicasPreview />
    </main>
  );
}
