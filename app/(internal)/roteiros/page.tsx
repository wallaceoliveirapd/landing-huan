import type { Metadata } from "next";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { RoteirosContent } from "@/components/organisms/RoteirosContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Roteiros para o Nordeste",
  description:
    "Roteiros prontos para o Nordeste criados por Huan Falcão: de 3, 5 e 7 dias em João Pessoa e arredores, com sugestões de passeios, praias e restaurantes.",
  alternates: { canonical: "https://huanfalcao.com.br/roteiros" },
  openGraph: { url: "https://huanfalcao.com.br/roteiros", type: "website" },
};

export default function RoteirosPage() {
  const cat = CATEGORIES.find((c) => c.key === "roteiros")!;
  return (
    <>
      <InternalPageHero title="Roteiros prontos" image={cat.heroImage} />
      <RoteirosContent />
    </>
  );
}
