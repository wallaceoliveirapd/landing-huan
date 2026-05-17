import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { RoteirosContent } from "@/components/organisms/RoteirosContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata = { title: "Roteiros prontos, HUAN" };

export default function RoteirosPage() {
  const cat = CATEGORIES.find((c) => c.key === "roteiros")!;
  return (
    <>
      <InternalPageHero title="Roteiros prontos" image={cat.heroImage} />
      <RoteirosContent />
    </>
  );
}
