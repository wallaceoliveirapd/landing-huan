import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { PasseiosContent } from "@/components/organisms/PasseiosContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata = { title: "Passeios em João Pessoa, HUAN" };

export default function PasseiosPage() {
  const cat = CATEGORIES.find((c) => c.key === "passeios")!;
  return (
    <>
      <InternalPageHero title="Passeios em João Pessoa" image={cat.heroImage} />
      <PasseiosContent />
    </>
  );
}
