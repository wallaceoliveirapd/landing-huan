import type { Field } from "@/components/organisms/admin/AdminCrudPage";

export const FIELDS: Field[] = [
  { key: "title", label: "Título", type: "text", required: true },
  { key: "slug", label: "Slug (URL)", type: "text", required: true, slugFrom: "title" },
  { key: "excerpt", label: "Resumo (aparece na listagem)", type: "textarea", required: true },
  { key: "content", label: "Conteúdo", type: "rich", required: true },
  { key: "cover", label: "Imagem de capa", type: "image", required: true, uploadCategory: "dicas" },
  {
    key: "category",
    label: "Categoria",
    type: "select",
    required: true,
    options: [
      { value: "dica", label: "Dica geral" },
      { value: "joao-pessoa", label: "João Pessoa" },
      { value: "curiosidade", label: "Curiosidade" },
      { value: "gastronomia", label: "Gastronomia" },
      { value: "praias", label: "Praias" },
    ],
  },
  { key: "tags", label: "Tags", type: "tags" },
  { key: "city", label: "Cidade (Nordeste)", type: "city" },
  { key: "featured", label: "Destaque", type: "boolean" },
  { key: "active", label: "Publicado", type: "boolean" },
];
