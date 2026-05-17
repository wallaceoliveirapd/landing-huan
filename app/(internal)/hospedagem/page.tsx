import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { EmptyState } from "@/components/organisms/EmptyState";
import { CATEGORIES } from "@/lib/categories";

export const metadata = { title: "Hospedagem em João Pessoa, HUAN" };

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
