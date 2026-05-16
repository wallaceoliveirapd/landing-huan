"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

type Role = "user" | "assistant";

// ─── Inline markdown → ReactNode ──────────────────────────────────────────
// Handles **bold**, *italic*, `code` within a single line/segment.
function renderInline(text: string): ReactNode {
  // Tokenize by bold, italic, inline-code
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**"))
      return <strong key={i} className="font-medium">{tok.slice(2, -2)}</strong>;
    if (tok.startsWith("*") && tok.endsWith("*"))
      return <em key={i}>{tok.slice(1, -1)}</em>;
    if (tok.startsWith("`") && tok.endsWith("`"))
      return <code key={i} className="rounded px-1 bg-black/10 text-[13px] font-mono">{tok.slice(1, -1)}</code>;
    return tok;
  });
}

// ─── Full markdown block renderer ────────────────────────────────────────
export function ChatMarkdown({ text, isUser }: { text: string; isUser: boolean }) {
  // Split into logical blocks by double newline
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l !== "");

        // ── Bullet list block ──
        if (lines.some((l) => /^[-•*]\s/.test(l))) {
          return (
            <ul key={bi} className="flex flex-col gap-[3px] pl-0">
              {lines.map((line, li) => {
                const match = line.match(/^[-•*]\s+(.+)/);
                if (match) {
                  return (
                    <li key={li} className="flex gap-2 items-start">
                      <span className="shrink-0 mt-[2px] text-[11px] opacity-60">•</span>
                      <span>{renderInline(match[1])}</span>
                    </li>
                  );
                }
                return <span key={li}>{renderInline(line)}</span>;
              })}
            </ul>
          );
        }

        // ── Numbered list block ──
        if (lines.some((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={bi} className="flex flex-col gap-[3px] pl-0">
              {lines.map((line, li) => {
                const match = line.match(/^(\d+)\.\s+(.+)/);
                if (match) {
                  return (
                    <li key={li} className="flex gap-2 items-start">
                      <span className={cn(
                        "shrink-0 font-medium text-[12px] mt-[1px] min-w-[16px]",
                        isUser ? "opacity-80" : "text-[var(--color-brand-purple)]",
                      )}>
                        {match[1]}.
                      </span>
                      <span>{renderInline(match[2])}</span>
                    </li>
                  );
                }
                return <span key={li}>{renderInline(line)}</span>;
              })}
            </ol>
          );
        }

        // ── Multi-line paragraph (may have single line breaks as visual separators) ──
        // Render each line separately to preserve line breaks
        return (
          <p key={bi} className="leading-[1.5]">
            {lines.map((line, li) => {
              // Heading-like line: starts with **Text** standalone (entire line is bold)
              const headingMatch = line.match(/^\*\*(.+?)\*\*\s*—?\s*(.*)$/);
              if (headingMatch && line.startsWith("**")) {
                return (
                  <span key={li} className="block">
                    <span className="font-medium text-[16px] leading-[1.35]">
                      {headingMatch[1]}
                      {headingMatch[2] ? ` — ${headingMatch[2]}` : ""}
                    </span>
                  </span>
                );
              }
              return (
                <span key={li} className={li > 0 ? "block" : undefined}>
                  {renderInline(line)}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

// ─── Bubble component ────────────────────────────────────────────────────
export function ChatBubble({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[88%] rounded-[20px] px-5 py-3.5 text-[15px] leading-[1.5]",
          isUser
            ? "bg-[var(--color-brand-yellow)] text-black rounded-br-[6px]"
            : "bg-[#F2F4F5] text-black rounded-bl-[6px]",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
