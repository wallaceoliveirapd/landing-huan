import type { Field } from "@/components/organisms/admin/AdminCrudPage";

export const FIELDS: Field[] = [
  {
    key: "title",
    label: "Título do roteiro",
    type: "text",
    required: true,
    placeholder: "3 dias em João Pessoa: o melhor da cidade",
  },
  {
    key: "slug",
    label: "Slug (URL)",
    type: "text",
    required: true,
    slugFrom: "title",
    placeholder: "gerado-automaticamente",
  },
  {
    key: "subtitle",
    label: "Subtítulo / chamada",
    type: "text",
    required: true,
    placeholder: "O melhor de JP em 3 dias",
  },
  {
    key: "durationDays",
    label: "Duração (em dias)",
    type: "number",
    required: true,
  },
  {
    key: "cover",
    label: "Imagem de capa",
    type: "image",
    required: true,
  },
  {
    key: "days",
    label: "Planejamento dia a dia",
    type: "days",
  },
  {
    key: "city",
    label: "Cidade (Nordeste)",
    type: "city",
  },
  {
    key: "featured",
    label: "Destaque na home",
    type: "boolean",
  },
  {
    key: "active",
    label: "Ativo (visível no site)",
    type: "boolean",
  },
  {
    key: "order",
    label: "Ordem de exibição",
    type: "number",
  },
];
