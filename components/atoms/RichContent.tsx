import { clsx } from "clsx";

type Props = {
  /** Either HTML (from the rich editor) or plain text (legacy data). */
  content: string | undefined | null;
  className?: string;
};

/**
 * Renders description-style content from admin. Detects HTML vs plain text
 * by checking for any tag, so legacy plain-text rows still display with
 * line breaks preserved.
 *
 * Trusts admin input, not user-generated — no sanitization here. If we
 * ever expose this to user submissions, swap for DOMPurify.
 */
export function RichContent({ content, className }: Props) {
  if (!content) return null;
  const isHtml = /<\w+[^>]*>/.test(content);
  if (isHtml) {
    return (
      <div
        className={clsx(
          "text-[var(--color-neutral-700)] leading-[1.65]",
          "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
          "[&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc",
          "[&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal",
          "[&_li]:my-1",
          "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-neutral-300)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[var(--color-neutral-600)]",
          "[&_strong]:font-semibold [&_strong]:text-[var(--color-neutral-800)]",
          "[&_em]:italic",
          "[&_code]:rounded [&_code]:bg-[var(--color-neutral-100)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:font-mono",
          "[&_hr]:my-4 [&_hr]:border-[var(--color-neutral-200)]",
          "[&_h1]:text-[20px] [&_h1]:font-bold [&_h1]:leading-[1.3] [&_h1]:my-3 [&_h1]:text-[var(--color-neutral-800)]",
          "[&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:leading-[1.35] [&_h2]:my-3 [&_h2]:text-[var(--color-neutral-800)]",
          "[&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:leading-[1.4] [&_h3]:my-2.5 [&_h3]:text-[var(--color-neutral-800)]",
          "[&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:leading-[1.4] [&_h4]:my-2 [&_h4]:text-[var(--color-neutral-800)]",
          "[&_h5]:text-[13px] [&_h5]:font-semibold [&_h5]:leading-[1.4] [&_h5]:my-2 [&_h5]:text-[var(--color-neutral-700)]",
          "[&_h6]:text-[10px] [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-[0.08em] [&_h6]:my-2 [&_h6]:text-[var(--color-neutral-500)]",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <p className={clsx("whitespace-pre-line text-[var(--color-neutral-700)]", className)}>
      {content}
    </p>
  );
}
