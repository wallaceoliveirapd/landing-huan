import type { Metadata } from "next";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { VidaNoturnaContent } from "@/components/organisms/VidaNoturnaContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Vida noturna em João Pessoa",
  description:
    "Os melhores bares, clubs e opções de vida noturna no Nordeste, curados por Huan Falcão. Do forró ao cocktail bar.",
  alternates: { canonical: "https://huanfalcao.com.br/vida-noturna" },
  openGraph: {
    url: "https://huanfalcao.com.br/vida-noturna",
    type: "website",
    images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordesteAÍ - By Huan Falcão" }],
  },
};

export default function VidaNoturnaPage() {
  const cat = CATEGORIES.find((c) => c.key === "vida-noturna")!;
  return (
    <>
      <InternalPageHero title="Vida noturna" image={cat.heroImage} />
      <VidaNoturnaContent />
    </>
  );
}
