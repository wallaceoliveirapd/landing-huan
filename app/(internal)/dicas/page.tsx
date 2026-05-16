import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { DicasContent } from "@/components/organisms/DicasContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata = { title: "Dicas de viagem — HUAN" };

export default function DicasPage() {
  const cat = CATEGORIES.find((c) => c.key === "dicas")!;
  return (
    <>
      <InternalPageHero title="Dicas de viagem" image={cat.heroImage} />
      <DicasContent />
    </>
  );
}
