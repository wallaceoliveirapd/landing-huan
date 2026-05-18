import type { Field } from "@/components/organisms/admin/AdminCrudPage";

export const FIELDS: Field[] = [
  { key: "name", label: "Nome", type: "text", required: true },
  { key: "slug", label: "Slug (URL)", type: "text", required: true, slugFrom: "name" },
  { key: "shortDesc", label: "Resumo curto", type: "text", required: true },
  { key: "description", label: "Descrição completa", type: "rich", required: true },
  {
    key: "type",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      { value: "Bar", label: "Bar" },
      { value: "Balada", label: "Balada" },
      { value: "Show ao Vivo", label: "Show ao Vivo" },
      { value: "Rooftop", label: "Rooftop" },
      { value: "Pub", label: "Pub" },
    ],
  },
  { key: "image", label: "Imagem principal", type: "image", required: true, uploadCategory: "vida-noturna" },
  { key: "photos", label: "Galeria de fotos", type: "photos", uploadCategory: "vida-noturna" },
  { key: "address", label: "Endereço", type: "text", required: true },
  { key: "phone", label: "Telefone", type: "text" },
  { key: "instagram", label: "Instagram (@handle)", type: "text" },
  { key: "hours", label: "Horário de funcionamento", type: "hours" },
  { key: "tags", label: "Tags", type: "tags" },
  { key: "city", label: "Cidade (Nordeste)", type: "city" },
  { key: "featured", label: "Destaque", type: "boolean" },
  { key: "active", label: "Ativo", type: "boolean" },
  { key: "order", label: "Ordem", type: "number" },
];
