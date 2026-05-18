import type { Metadata } from "next";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { PasseiosContent } from "@/components/organisms/PasseiosContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Passeios em João Pessoa",
  description:
    "Os melhores passeios em João Pessoa e no Nordeste, testados e aprovados por Huan Falcão. Catamarã, mergulho, city tour e muito mais.",
  alternates: { canonical: "https://huanfalcao.com.br/passeios" },
  openGraph: { url: "https://huanfalcao.com.br/passeios", type: "website" },
};

export default function PasseiosPage() {
  const cat = CATEGORIES.find((c) => c.key === "passeios")!;
  return (
    <>
      <InternalPageHero title="Passeios em João Pessoa" image={cat.heroImage} />
      <PasseiosContent />
    </>
  );
}
