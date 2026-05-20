import type { Metadata } from "next";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { RestaurantesContent } from "@/components/organisms/RestaurantesContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Restaurantes em João Pessoa",
  description:
    "Restaurantes testados e aprovados em João Pessoa: frutos do mar, comida nordestina, cafés e muito mais. Indicações de Huan Falcão.",
  alternates: { canonical: "https://huanfalcao.com.br/restaurantes" },
  openGraph: {
    url: "https://huanfalcao.com.br/restaurantes",
    type: "website",
    images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordestAI - By Huan Falcão" }],
  },
};

export default function RestaurantesPage() {
  const cat = CATEGORIES.find((c) => c.key === "restaurantes")!;
  return (
    <>
      <InternalPageHero title="Principais restaurantes" image={cat.heroImage} />
      <RestaurantesContent />
    </>
  );
}
