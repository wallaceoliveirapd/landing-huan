import type { Field } from "@/components/organisms/admin/AdminCrudPage";
import { api } from "@/convex/_generated/api";

export const FIELDS: Field[] = [
  { key: "name", label: "Nome", type: "text", required: true },
  { key: "slug", label: "Slug (URL)", type: "text", required: true, slugFrom: "name" },
  { key: "shortDesc", label: "Resumo curto", type: "text", required: true },
  { key: "description", label: "Descrição completa", type: "rich", required: true },
  { key: "cuisine", label: "Tipo de cozinha", type: "text", placeholder: "Frutos do mar", required: true },
  {
    key: "priceRange",
    label: "Faixa de preço",
    type: "select",
    required: true,
    options: [
      { value: "$", label: "$, Econômico" },
      { value: "$$", label: "$$, Moderado" },
      { value: "$$$", label: "$$$, Premium" },
    ],
  },
  { key: "image", label: "Imagem principal", type: "image", required: true, uploadCategory: "restaurantes" },
  { key: "photos", label: "Galeria de fotos", type: "photos", uploadCategory: "restaurantes" },
  { key: "address", label: "Endereço", type: "text", required: true },
  { key: "phone", label: "Telefone", type: "text", placeholder: "(83) 99999-9999" },
  { key: "instagram", label: "Instagram (@handle)", type: "text", placeholder: "@restaurante" },
  { key: "website", label: "Site (URL)", type: "url" },
  { key: "rating", label: "Avaliação (ex: 4.7)", type: "number" },
  { key: "reviewCount", label: "Nº de avaliações", type: "number" },
  { key: "hours", label: "Horário de funcionamento", type: "hours" },
  { key: "tags", label: "Tags", type: "tags" },
  { key: "city", label: "Cidade (Nordeste)", type: "city" },
  { key: "discountBanner", label: "Banner de desconto", type: "banner" },
  {
    key: "coupons",
    label: "Cupons vinculados",
    type: "refs",
    optionsQuery: api.coupons.list,
    optionsQueryArgs: { activeOnly: false },
  },
  { key: "tripAdvisorUrl", label: "URL do TripAdvisor", type: "url" },
  { key: "featured", label: "Destaque na home", type: "boolean" },
  { key: "active", label: "Ativo (visível no site)", type: "boolean" },
  { key: "order", label: "Ordem de exibição", type: "number" },
];
