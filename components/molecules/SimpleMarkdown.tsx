"use client";

import React from "react";

/**
 * Tiny markdown renderer for legal/policy pages. Supports:
 *   - # / ## / ### headings
 *   - **bold** and *italic*
 *   - paragraphs
 *   - bullet lists (lines starting with "- ")
 *   - ordered lists (lines starting with "1. ")
 *   - inline `code`
 *
 * No nested lists, no images, no tables, no HTML. Good enough for terms
 * and privacy pages.
 */
export function SimpleMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];

  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const raw = lines[i];

    // Heading
    const hm = raw.match(/^(#{1,4})\s+(.*)$/);
    if (hm) {
      const level = hm[1].length;
      const text = hm[2];
      const cls = ({
        1: "font-display font-medium text-[22px] leading-[1.25] text-[var(--color-neutral-800)] mt-6 mb-3",
        2: "font-display font-medium text-[18px] leading-[1.3] text-[var(--color-neutral-800)] mt-6 mb-2",
        3: "font-display font-medium text-[15px] leading-[1.35] text-[var(--color-neutral-800)] mt-5 mb-1.5",
        4: "font-display font-medium text-[14px] text-[var(--color-neutral-800)] mt-4 mb-1",
      } as Record<number, string>)[level];
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      blocks.push(
        React.createElement(
          Tag,
          { key: key++, className: cls },
          renderInline(text),
        ),
      );
      i++;
      continue;
    }

    // Bullet list
    if (/^- /.test(raw)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) {
        items.push(lines[i].replace(/^- /, ""));
        i++;
      }
      blocks.push(
        <ul
          key={key++}
          className="list-disc pl-5 my-2 text-[14px] leading-[1.65] text-[var(--color-neutral-700)] space-y-1"
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(raw)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol
          key={key++}
          className="list-decimal pl-5 my-2 text-[14px] leading-[1.65] text-[var(--color-neutral-700)] space-y-1"
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Empty line
    if (raw.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    blocks.push(
      <p
        key={key++}
        className="my-2 text-[14px] leading-[1.65] text-[var(--color-neutral-700)]"
      >
        {renderInline(raw)}
      </p>,
    );
    i++;
  }

  return <div className="font-display">{blocks}</div>;
}

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let buf = text;
  let key = 0;

  // Replace **bold** and *italic* and `code` iteratively
  const PATTERNS: { re: RegExp; render: (m: string) => React.ReactNode }[] = [
    {
      re: /\*\*([^*]+)\*\*/,
      render: (m) => (
        <strong key={key++} className="font-medium text-[var(--color-neutral-800)]">
          {m}
        </strong>
      ),
    },
    {
      re: /\*([^*]+)\*/,
      render: (m) => (
        <em key={key++} className="italic">
          {m}
        </em>
      ),
    },
    {
      re: /`([^`]+)`/,
      render: (m) => (
        <code
          key={key++}
          className="bg-[var(--color-neutral-100)] rounded px-1 py-0.5 font-mono text-[12.5px]"
        >
          {m}
        </code>
      ),
    },
  ];

  function takeNextToken(): {
    pre: string;
    matched?: string;
    render?: (m: string) => React.ReactNode;
    rest: string;
  } | null {
    if (buf.length === 0) return null;
    let bestIdx = -1;
    let bestLen = 0;
    let bestPattern: typeof PATTERNS[0] | null = null;
    for (const p of PATTERNS) {
      const m = buf.match(p.re);
      if (m && m.index !== undefined) {
        if (bestIdx === -1 || m.index < bestIdx) {
          bestIdx = m.index;
          bestLen = m[0].length;
          bestPattern = p;
        }
      }
    }
    if (bestIdx === -1 || !bestPattern) {
      return { pre: buf, rest: "" };
    }
    const inner = buf.match(bestPattern.re)?.[1] ?? "";
    return {
      pre: buf.slice(0, bestIdx),
      matched: inner,
      render: bestPattern.render,
      rest: buf.slice(bestIdx + bestLen),
    };
  }

  while (true) {
    const tok = takeNextToken();
    if (!tok) break;
    if (tok.pre) out.push(tok.pre);
    if (tok.matched && tok.render) out.push(tok.render(tok.matched));
    if (tok.rest === "") break;
    buf = tok.rest;
  }

  return out;
}
