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
