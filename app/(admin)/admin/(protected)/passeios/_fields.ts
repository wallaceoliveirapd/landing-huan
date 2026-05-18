import type { Field } from "@/components/organisms/admin/AdminCrudPage";

export const FIELDS: Field[] = [
  { key: "title", label: "Título", type: "text", required: true },
  { key: "slug", label: "Slug (URL)", type: "text", required: true, slugFrom: "title", placeholder: "gerado-do-titulo" },
  { key: "shortDesc", label: "Resumo curto", type: "text", required: true },
  { key: "description", label: "Descrição completa", type: "rich", required: true },
  { key: "price", label: "Preço (R$)", type: "number", required: true },
  { key: "originalPrice", label: "Preço original (R$, 0 = sem desconto)", type: "number" },
  { key: "image", label: "Imagem principal", type: "image", required: true, uploadCategory: "passeios" },
  { key: "duration", label: "Duração", type: "text", placeholder: "4 horas", required: true },
  { key: "rating", label: "Avaliação (ex: 4.9)", type: "number" },
  { key: "reviewCount", label: "Nº de avaliações", type: "number" },
  { key: "url", label: "Link externo (Civitatis / GetYourGuide)", type: "url", required: true },
  { key: "tags", label: "Tags", type: "tags" },
  { key: "city", label: "Cidade (Nordeste)", type: "city" },
  { key: "featured", label: "Destaque na home", type: "boolean" },
  { key: "active", label: "Ativo (visível no site)", type: "boolean" },
  { key: "order", label: "Ordem de exibição", type: "number" },
];
