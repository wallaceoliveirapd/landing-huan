import type { Metadata } from "next";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { EmptyState } from "@/components/organisms/EmptyState";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Hospedagem em João Pessoa",
  description:
    "Onde se hospedar em João Pessoa: pousadas, hotéis e apartamentos indicados por Huan Falcão, do centro histórico à orla de Tambaú.",
  alternates: { canonical: "https://huanfalcao.com.br/hospedagem" },
  openGraph: { url: "https://huanfalcao.com.br/hospedagem", type: "website" },
};

export default function HospedagemPage() {
  const cat = CATEGORIES.find((c) => c.key === "hospedagem")!;
  return (
    <>
      <InternalPageHero title="Hospedagem" image={cat.heroImage} />
      <section className="bg-white">
        <EmptyState
          icon="lucide:bed-double"
          title="Em parceria"
          description="Estamos negociando links afiliados com Booking, Airbnb e pousadas locais. Em breve aqui você reserva direto."
        />
      </section>
    </>
  );
}
