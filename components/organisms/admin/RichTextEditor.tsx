"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Icon } from "@/components/atoms/Icon";
import { clsx } from "clsx";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

/**
 * Rich text editor for admin description fields. HTML in/out.
 *
 * Supports: H1–H6 (via dropdown), bold, italic, strike, code, bullet list,
 * ordered list, blockquote, horizontal rule, hard break.
 *
 * Backward-compat: plain-text values without HTML tags are accepted by
 * TipTap and wrapped in <p>.
 */
export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[160px] px-4 py-3 outline-none text-[14px] text-[var(--color-neutral-800)] leading-[1.65] " +
          "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
          "[&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc " +
          "[&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal " +
          "[&_li]:my-1 " +
          "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-neutral-300)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[var(--color-neutral-600)] " +
          "[&_strong]:font-semibold " +
          "[&_em]:italic " +
          "[&_code]:rounded [&_code]:bg-[var(--color-neutral-100)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:font-mono " +
          "[&_hr]:my-4 [&_hr]:border-[var(--color-neutral-200)] " +
          "[&_h1]:text-[20px] [&_h1]:font-bold [&_h1]:leading-[1.3] [&_h1]:my-3 [&_h1]:text-[var(--color-neutral-800)] " +
          "[&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:leading-[1.35] [&_h2]:my-3 [&_h2]:text-[var(--color-neutral-800)] " +
          "[&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:leading-[1.4] [&_h3]:my-2.5 [&_h3]:text-[var(--color-neutral-800)] " +
          "[&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:leading-[1.4] [&_h4]:my-2 [&_h4]:text-[var(--color-neutral-800)] " +
          "[&_h5]:text-[13px] [&_h5]:font-semibold [&_h5]:leading-[1.4] [&_h5]:my-2 [&_h5]:text-[var(--color-neutral-700)] " +
          "[&_h6]:text-[10px] [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-[0.08em] [&_h6]:my-2 [&_h6]:text-[var(--color-neutral-500)] " +
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:text-[var(--color-neutral-400)] [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:h-0",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      // Treat empty doc (just <p></p>) as empty string
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes (e.g. when switching between items)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (current === next) return;
    if (next === "" && current === "<p></p>") return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="rounded-[12px] border border-[var(--color-neutral-300)] min-h-[200px] bg-[var(--color-neutral-50)]" />
    );
  }

  return (
    <div className="rounded-[12px] border border-[var(--color-neutral-300)] bg-white focus-within:border-[var(--color-neutral-800)] overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        // Use a hidden placeholder via CSS when empty
        data-placeholder={placeholder}
      />
    </div>
  );
}

function HeadingSelect({ editor }: { editor: Editor }) {
  const activeLevel = ([1, 2, 3, 4, 5, 6] as const).find((l) =>
    editor.isActive("heading", { level: l })
  );
  const value = activeLevel ? String(activeLevel) : "0";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const level = parseInt(e.target.value);
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setHeading({ level: level as 1|2|3|4|5|6 }).run();
    }
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      title="Estilo de texto"
      className="h-7 rounded-md border-0 bg-transparent text-[12px] text-[var(--color-neutral-700)] pr-1 pl-1 cursor-pointer hover:bg-[var(--color-neutral-200)] focus:outline-none"
    >
      <option value="0">Parágrafo</option>
      <option value="1">H1 — Título</option>
      <option value="2">H2 — Subtítulo</option>
      <option value="3">H3</option>
      <option value="4">H4</option>
      <option value="5">H5</option>
      <option value="6">H6 — Caption</option>
    </select>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center flex-wrap gap-1 px-2 py-1.5 border-b border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)]">
      <HeadingSelect editor={editor} />
      <Divider />
      <ToolbarBtn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Negrito (Ctrl+B)"
      >
        <Icon name="lucide:bold" size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Itálico (Ctrl+I)"
      >
        <Icon name="lucide:italic" size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label="Riscado"
      >
        <Icon name="lucide:strikethrough" size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        label="Código inline"
      >
        <Icon name="lucide:code" size={14} />
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="Lista com bullets"
      >
        <Icon name="lucide:list" size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="Lista numerada"
      >
        <Icon name="lucide:list-ordered" size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="Citação"
      >
        <Icon name="lucide:quote" size={14} />
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="Linha horizontal"
      >
        <Icon name="lucide:minus" size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHardBreak().run()}
        label="Quebra de linha (Shift+Enter)"
      >
        <Icon name="lucide:corner-down-left" size={14} />
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        label="Desfazer (Ctrl+Z)"
        disabled={!editor.can().undo()}
      >
        <Icon name="lucide:undo-2" size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        label="Refazer (Ctrl+Y)"
        disabled={!editor.can().redo()}
      >
        <Icon name="lucide:redo-2" size={14} />
      </ToolbarBtn>
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  active,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={clsx(
        "grid place-items-center size-7 rounded-md text-[var(--color-neutral-700)] transition-colors",
        "hover:bg-[var(--color-neutral-200)] disabled:opacity-40 disabled:cursor-default",
        active && "bg-[var(--color-neutral-800)] text-white hover:bg-[var(--color-neutral-800)]",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="w-px h-5 bg-[var(--color-neutral-200)] mx-0.5" />;
}
