import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { Header } from "@/components/organisms/Header";
import { DicaReactions } from "@/components/organisms/DicaReactions";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const d = await fetchQuery(api.dicas.getBySlug, { slug });
  return { title: d ? `${d.title}, HUAN` : "Dica, HUAN" };
}

/** Minimal Markdown → HTML (headings, bold, lists, line breaks). */
function markdownToHtml(md: string): string {
  return md
    // H1, skip rendering as heading (it duplicates the page title)
    .replace(/^# (.+)$/gm, '')
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="font-display font-medium text-[22px] mt-6 mb-2 text-[var(--color-ink)]">$1</h2>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 class="font-display font-medium text-[18px] mt-5 mb-1.5 text-[var(--color-ink)]">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-[var(--color-ink)]">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, '<li class="ml-5 list-disc leading-relaxed">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[\s\S]*?<\/li>)(\n<li)/g, '$1$2')
    .replace(/(<li[\s\S]+?<\/li>)/g, '<ul class="my-3 space-y-1">$1</ul>')
    // Paragraphs (double newline)
    .replace(/\n\n(?!<)/g, '</p><p class="font-display text-[15px] leading-[1.75] text-[var(--color-neutral-600)] my-3">')
    // Clean up trailing/leading
    .replace(/^(?!<)/, '<p class="font-display text-[15px] leading-[1.75] text-[var(--color-neutral-600)] my-3">')
    .replace(/(?<!>)$/, '</p>');
}

export default async function DicaPage({ params }: PageProps) {
  const { slug } = await params;
  const dica = await fetchQuery(api.dicas.getBySlug, { slug });
  if (!dica) return notFound();

  const badgeTone =
    dica.category === "joao-pessoa" ? "purple" :
      dica.category === "curiosidade" ? "success" : "yellow";

  const badgeLabel =
    dica.category === "joao-pessoa" ? "João Pessoa" :
      dica.category === "curiosidade" ? "Curiosidade" :
        dica.category === "dica" ? "Dica" :
          dica.category;

  return (
    <>
      <GtmViewItem
        item_type="dica"
        item_id={dica._id}
        item_name={dica.title}
        item_category={dica.category}
        item_slug={dica.slug}
      />
      <Header />
      <article className="bg-white pb-28">
        <div className="mx-auto flex w-full max-w-screen-md flex-col gap-6 p-6">
          <Link
            href="/dicas"
            className="inline-flex items-center gap-1 text-[14px] text-[var(--color-neutral-600)] hover:text-[var(--color-ink)]"
          >
            <Icon name="material-symbols:chevron-left" size={18} />
            Todas as dicas
          </Link>

          <div className="flex flex-col gap-3">
            <Badge tone={badgeTone as "yellow" | "purple" | "success"}>{badgeLabel}</Badge>
            <h1 className="font-display font-medium text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-[var(--color-ink)]">
              {dica.title}
            </h1>
            <span className="text-[13px] text-[var(--color-neutral-600)]">
              Publicado em {new Date(dica.publishedAt).toLocaleDateString("pt-BR")}
            </span>
          </div>

          {dica.cover && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card">
              <Image
                src={dica.cover}
                alt={dica.title}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <p className="font-display text-[17px] leading-[1.65] text-[var(--color-ink)]">
            {dica.excerpt}
          </p>

          {dica.content ? (
            <div
              className="prose-reset"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(dica.content) }}
            />
          ) : (
            <p className="font-display text-[15px] leading-[1.65] text-[var(--color-neutral-600)]">
              O conteúdo completo desta dica estará disponível em breve.
            </p>
          )}

          {dica.source === "cowork" && (
            <p className="text-[12px] text-[var(--color-neutral-600)] border-t border-[var(--color-neutral-300)] pt-4 mt-2">
              Conteúdo gerado pelo NordestAI
            </p>
          )}

          {/* Reactions bar, appears at the end of the article */}
          <div className="border-t border-[var(--color-neutral-100)] pt-6 mt-4">
            <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)] mb-3">
              O que achou dessa dica?
            </p>
            <DicaReactions dicaId={dica._id} />
          </div>
        </div>
      </article>
    </>
  );
}
