import type { Metadata } from "next";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { PraiasContent } from "@/components/organisms/PraiasContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Praias de João Pessoa",
  description:
    "As melhores praias de João Pessoa e arredores: Cabo Branco, Tambaú, Coqueirinho e outras joias do litoral paraibano.",
  alternates: { canonical: "https://huanfalcao.com.br/praias" },
  openGraph: {
    url: "https://huanfalcao.com.br/praias",
    type: "website",
    images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordestAI - By Huan Falcão" }],
  },
};

export default function PraiasPage() {
  const cat = CATEGORIES.find((c) => c.key === "praias")!;
  return (
    <>
      <InternalPageHero title="Praias" image={cat.heroImage} />
      <PraiasContent />
    </>
  );
}
