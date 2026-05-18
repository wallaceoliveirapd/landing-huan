import type { Field } from "@/components/organisms/admin/AdminCrudPage";

export const FIELDS: Field[] = [
  { key: "title", label: "Título do cupom", type: "text", required: true, placeholder: "8% off em passeios" },
  { key: "description", label: "Subtítulo / descrição curta", type: "text", required: true, placeholder: "Use na GetYourGuide" },
  { key: "code", label: "Código do cupom", type: "text", required: true, placeholder: "HUAN10" },
  { key: "image", label: "Imagem de fundo (aparece no card)", type: "image", required: true, uploadCategory: "cupons" },
  {
    key: "discountType",
    label: "Tipo de desconto",
    type: "select",
    required: true,
    options: [
      { value: "percent", label: "%, Percentual" },
      { value: "fixed",   label: "R$, Valor fixo"  },
    ],
  },
  { key: "discountValue", label: "Valor do desconto (número)", type: "number", required: true, placeholder: "8" },
  { key: "partner", label: "Parceiro", type: "text", placeholder: "GetYourGuide, Civitatis…" },
  { key: "partnerUrl", label: "URL do parceiro (botão Detalhes)", type: "url", placeholder: "https://www.getyourguide.com.br/…" },
  { key: "conditions", label: "Condições de uso", type: "rich", placeholder: "Ex: Válido para passeios acima de R$100. Não cumulativo." },
  { key: "rules", label: "Regras e restrições", type: "rich", placeholder: "Ex: Limite de 1 uso por CPF." },
  { key: "maxUses", label: "Limite de usos (0 = ilimitado)", type: "number" },
  { key: "firstPurchaseOnly", label: "Apenas primeira compra", type: "boolean" },
  { key: "featured", label: "Destaque na home", type: "boolean" },
  { key: "active", label: "Ativo (visível no site)", type: "boolean" },
  { key: "order", label: "Ordem de exibição", type: "number" },
];
