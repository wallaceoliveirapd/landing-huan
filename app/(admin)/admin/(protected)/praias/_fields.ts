import type { Field } from "@/components/organisms/admin/AdminCrudPage";
import { api } from "@/convex/_generated/api";

export const FIELDS: Field[] = [
  { key: "name", label: "Nome", type: "text", required: true },
  { key: "slug", label: "Slug (URL)", type: "text", required: true, slugFrom: "name" },
  { key: "shortDesc", label: "Resumo curto", type: "text", required: true },
  { key: "description", label: "Descrição completa", type: "rich", required: true },
  { key: "image", label: "Imagem principal", type: "image", required: true, uploadCategory: "praias" },
  { key: "photos", label: "Galeria de fotos", type: "photos", uploadCategory: "praias" },
  { key: "location", label: "Localização (link do Google Maps)", type: "text", required: true, placeholder: "https://maps.app.goo.gl/..." },
  { key: "features", label: "Características (ex: ondas calmas, quiosques)", type: "tags", suggestionsQuery: api.praias.allFeatures },
  { key: "city", label: "Cidade (Nordeste)", type: "city" },
  { key: "featured", label: "Destaque", type: "boolean" },
  { key: "active", label: "Ativo", type: "boolean" },
  { key: "order", label: "Ordem", type: "number" },
];
