import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { RestaurantesContent } from "@/components/organisms/RestaurantesContent";
import { CATEGORIES } from "@/lib/categories";

export const metadata = { title: "Restaurantes em João Pessoa, HUAN" };

export default function RestaurantesPage() {
  const cat = CATEGORIES.find((c) => c.key === "restaurantes")!;
  return (
    <>
      <InternalPageHero title="Principais restaurantes" image={cat.heroImage} />
      <RestaurantesContent />
    </>
  );
}
