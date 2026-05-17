import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { PraiasContent } from "@/components/organisms/PraiasContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata = { title: "Praias de João Pessoa, HUAN" };

export default function PraiasPage() {
  const cat = CATEGORIES.find((c) => c.key === "praias")!;
  return (
    <>
      <InternalPageHero title="Praias" image={cat.heroImage} />
      <PraiasContent />
    </>
  );
}
