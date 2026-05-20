import type { Metadata } from "next";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { DicasContent } from "@/components/organisms/DicasContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Dicas de viagem para o Nordeste",
  description:
    "Dicas de viagem, curiosidades e guias sobre o Nordeste brasileiro, escritos por Huan Falcão. Tudo que você precisa saber antes de ir a João Pessoa.",
  alternates: { canonical: "https://huanfalcao.com.br/dicas" },
  openGraph: {
    url: "https://huanfalcao.com.br/dicas",
    type: "website",
    images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordestAI - By Huan Falcão" }],
  },
};

export default function DicasPage() {
  const cat = CATEGORIES.find((c) => c.key === "dicas")!;
  return (
    <>
      <InternalPageHero title="Dicas de viagem" image={cat.heroImage} />
      <DicasContent />
    </>
  );
}
