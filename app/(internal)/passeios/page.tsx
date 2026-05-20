import type { Metadata } from "next";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { PasseiosContent } from "@/components/organisms/PasseiosContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Passeios no nordeste",
  description:
    "Os melhores passeios no Nordeste, testados e aprovados por Huan Falcão. Catamarã, mergulho, city tour e muito mais.",
  alternates: { canonical: "https://huanfalcao.com.br/passeios" },
  openGraph: {
    url: "https://huanfalcao.com.br/passeios",
    type: "website",
    images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordesteAÍ - By Huan Falcão" }],
  },
};

export default function PasseiosPage() {
  const cat = CATEGORIES.find((c) => c.key === "passeios")!;
  return (
    <>
      <InternalPageHero title="Passeios no Nordeste" image={cat.heroImage} />
      <PasseiosContent />
    </>
  );
}
