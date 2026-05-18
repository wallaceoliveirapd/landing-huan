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
      { value: "Hotel", label: "Hotel" },
      { value: "Pousada", label: "Pousada" },
      { value: "Airbnb", label: "Airbnb" },
      { value: "Resort", label: "Resort" },
      { value: "Hostel", label: "Hostel" },
    ],
  },
  { key: "stars", label: "Estrelas (1–5)", type: "number" },
  { key: "image", label: "Imagem principal", type: "image", required: true, uploadCategory: "hospedagem" },
  { key: "photos", label: "Galeria de fotos", type: "photos", uploadCategory: "hospedagem" },
  { key: "address", label: "Endereço", type: "text", required: true },
  { key: "priceFrom", label: "A partir de (R$)", type: "number", required: true },
  { key: "affiliateUrl", label: "Link afiliado", type: "url", required: true },
  { key: "amenities", label: "Comodidades", type: "tags" },
  { key: "city", label: "Cidade (Nordeste)", type: "city" },
  { key: "featured", label: "Destaque", type: "boolean" },
  { key: "active", label: "Ativo", type: "boolean" },
  { key: "order", label: "Ordem", type: "number" },
];
