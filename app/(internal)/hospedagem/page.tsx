import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { InternalPageHero } from "@/components/organisms/InternalPageHero";
import { EmptyState } from "@/components/organisms/EmptyState";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Hospedagem no Nordeste",
  description:
    "Onde se hospedar no Nordeste: pousadas, hotéis e apartamentos indicados por Huan Falcão, do litoral ao sertão.",
  alternates: { canonical: "https://huanfalcao.com.br/hospedagem" },
  openGraph: {
    url: "https://huanfalcao.com.br/hospedagem",
    type: "website",
    images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordesteAÍ - By Huan Falcão" }],
  },
};

export default async function HospedagemPage() {
  const cat = CATEGORIES.find((c) => c.key === "hospedagem")!;
  const items = await fetchQuery(api.hosting.list, {});

  return (
    <>
      <InternalPageHero title="Hospedagem" image={cat.heroImage} />

      {items.length === 0 ? (
        <section className="bg-white">
          <EmptyState
            icon="lucide:bed-double"
            title="Em parceria"
            description="Estamos negociando links afiliados com Booking, Airbnb e pousadas locais. Em breve aqui você reserva direto."
          />
        </section>
      ) : (
        <div className="pb-20">
          <section className="bg-white">
            <div className="mx-auto w-full max-w-screen-md p-4 flex flex-col gap-6">
              {items.map((place) => (
                <Link
                  key={place._id}
                  href={`/hospedagem/${place.slug}`}
                  className="flex flex-col gap-3 group"
                >
                  {/* Card image */}
                  <div className="relative h-[200px] w-full overflow-hidden rounded-card">
                    <Image
                      src={toProxyUrl(place.image)}
                      alt={place.name}
                      fill
                      sizes="(min-width: 768px) 720px, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Type badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--color-neutral-800)]">
                      {place.type}
                    </div>
                    {/* City tag */}
                    {place.city && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--color-neutral-800)] flex items-center gap-1">
                        <Icon name="map-pin" size={11} />
                        {place.city.split(",")[0]}
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display font-medium text-[18px] text-[var(--color-neutral-800)] group-hover:underline leading-tight">
                        {place.name}
                      </h3>
                      {/* Stars */}
                      {place.stars && place.stars > 0 && (
                        <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Icon
                              key={i}
                              name="star"
                              size={13}
                              className={
                                i < place.stars!
                                  ? "text-[var(--color-ink)] fill-[var(--color-ink)]"
                                  : "text-[var(--color-neutral-300)]"
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-[14px] text-[var(--color-neutral-600)] leading-relaxed line-clamp-2">
                      {place.shortDesc}
                    </p>

                    <p className="text-[13px] font-medium text-[var(--color-neutral-800)] mt-0.5">
                      A partir de{" "}
                      <span className="text-[var(--color-neutral-800)]">
                        R$ {place.priceFrom.toFixed(0)}
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
