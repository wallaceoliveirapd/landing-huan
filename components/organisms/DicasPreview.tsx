"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { FavoriteButton } from "@/components/atoms/FavoriteButton";
import { toProxyUrl } from "@/lib/imageUpload";
import { staggerChildren, fadeUp } from "@/lib/motion-presets";
import { gtmSelectItem } from "@/lib/gtm";

/**
 * Dica card — matches Figma node 334:36422.
 *
 *   245 wide, 164px image, yellow Categoria pill top-left, heart top-right
 *   Below image: title (medium 14) + descrição (regular 12 neutral-600)
 */
function DicaCard({
  id,
  slug,
  cover,
  category,
  title,
  excerpt,
  onSelect,
}: {
  id: string;
  slug: string;
  cover: string;
  category: string;
  title: string;
  excerpt: string;
  onSelect?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className="w-[min(70vw,245px)] flex-none flex flex-col gap-2"
    >
      <Link href={`/dicas/${slug}`} className="flex flex-col gap-2" onClick={onSelect}>
        <div className="relative aspect-[245/164] w-full overflow-hidden rounded-[24px]">
          <Image
            src={toProxyUrl(cover)}
            alt={title}
            fill
            sizes="245px"
            className="object-cover"
          />
          {/* Yellow Categoria badge — top-left */}
          <div className="absolute left-2.5 top-2.5 bg-[#FFFC4E] rounded-full px-2 py-[0.5px]">
            <span className="font-display font-medium text-[12px] leading-[1.2] text-[var(--color-neutral-800)] uppercase">
              {category}
            </span>
          </div>
          {/* Heart pill — top-right */}
          <div className="absolute right-2 top-2 bg-white rounded-full size-12 grid place-items-center">
            <FavoriteButton itemId={id} kind="dica" size={24} />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)] line-clamp-2">
            {title}
          </p>
          <p className="text-[12px] leading-[1.2] text-[var(--color-neutral-600)] line-clamp-2">
            {excerpt}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function DicaCardSkeleton() {
  return (
    <div className="w-[min(70vw,245px)] flex-none flex flex-col gap-2 animate-pulse">
      <div className="aspect-[245/164] w-full bg-[var(--color-neutral-100)] rounded-[24px]" />
      <div className="h-3 w-3/4 bg-[var(--color-neutral-100)] rounded" />
      <div className="h-3 w-1/2 bg-[var(--color-neutral-100)] rounded" />
    </div>
  );
}

export function DicasPreview() {
  const dicas = useQuery(api.dicas.list, { activeOnly: true });

  if (dicas === undefined) {
    return (
      <section className="w-full bg-white">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-6 px-6 py-8">
          <div className="flex flex-col gap-2">
            <div className="h-7 w-44 rounded bg-[var(--color-neutral-100)] animate-pulse" />
            <div className="h-3 w-72 rounded bg-[var(--color-neutral-100)] animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[0, 1].map((i) => <DicaCardSkeleton key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (dicas.length === 0) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerChildren(0.08, 0)}
      className="w-full bg-white"
    >
      <div className="mx-auto flex w-full max-w-screen-md flex-col px-6 py-8 pb-28">
        <motion.div variants={fadeUp} className="flex flex-col gap-2 pb-6">
          <h2 className="font-display font-medium text-[24px] leading-tight text-[var(--color-neutral-800)]">
            Dicas de viagem
          </h2>
          <p className="text-[14px] text-[var(--color-neutral-600)]">
            Deixa eu te ajudar com o que eu já sei
          </p>
        </motion.div>

        <HorizontalCarousel>
          {dicas.map((d) => (
            <DicaCard
              key={d._id}
              id={d._id}
              slug={d.slug}
              cover={d.cover}
              category={d.category}
              title={d.title}
              excerpt={d.excerpt}
              onSelect={() =>
                gtmSelectItem({
                  item_type: "dica",
                  item_id: d._id,
                  item_name: d.title,
                  item_city: null,
                  list_name: "home",
                })
              }
            />
          ))}
        </HorizontalCarousel>
      </div>
    </motion.section>
  );
}
