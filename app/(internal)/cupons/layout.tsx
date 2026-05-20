import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const BASE = "https://huanfalcao.com.br";

export const metadata: Metadata = {
  title: "Cupons e descontos para viagens no Nordeste",
  description:
    "Cupons e descontos exclusivos para viagens no Nordeste: passeios, hospedagem e experiências em João Pessoa com preço especial, selecionados por Huan Falcão.",
  alternates: { canonical: `${BASE}/cupons` },
  openGraph: {
    url: `${BASE}/cupons`,
    type: "website",
    images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordesteAÍ - By Huan Falcão" }],
  },
};

export default async function CuponsLayout({ children }: { children: React.ReactNode }) {
  // Server-side JSON-LD so Google can read individual Offer snippets even though
  // the listing page itself is a client component.
  const coupons = await fetchQuery(api.coupons.list, { activeOnly: true });

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cupons e descontos para viagens no Nordeste",
    url: `${BASE}/cupons`,
    numberOfItems: coupons.length,
    itemListElement: coupons.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Offer",
        name: c.title,
        description: c.description,
        url: c.partnerUrl ?? `${BASE}/cupons`,
        image: c.image ?? undefined,
        availability: "https://schema.org/InStock",
        priceCurrency: "BRL",
        ...(c.discountType === "percent"
          ? { priceSpecification: { "@type": "UnitPriceSpecification", priceType: "Discount", price: 0, priceCurrency: "BRL" } }
          : {}),
        ...(c.partner ? { seller: { "@type": "Organization", name: c.partner } } : {}),
        ...(c.validUntil ? { validThrough: new Date(c.validUntil).toISOString() } : {}),
        ...(c.code ? { eligibleTransactionVolume: { "@type": "PriceSpecification", description: `Código: ${c.code}` } } : {}),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      {children}
    </>
  );
}
