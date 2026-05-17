import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { VidaNoturnaContent } from "@/components/organisms/VidaNoturnaContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata = { title: "Vida noturna em João Pessoa, HUAN" };

export default function VidaNoturnaPage() {
  const cat = CATEGORIES.find((c) => c.key === "vida-noturna")!;
  return (
    <>
      <InternalPageHero title="Vida noturna" image={cat.heroImage} />
      <VidaNoturnaContent />
    </>
  );
}
