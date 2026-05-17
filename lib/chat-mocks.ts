import type { Tour, Restaurant, Itinerary } from "./mock-data";
import { TOURS, RESTAURANTS, ITINERARIES, getTourById } from "./mock-data";

/** Raw card data returned by the Convex chatSearch query */
export type RawCardItem = Record<string, unknown>;

export type ChatMessage =
  | { id: string; role: "user" | "assistant"; kind: "text"; content: string }
  | {
      id: string;
      role: "assistant";
      kind: "card";
      content: string;
      card:
        | { type: "tour"; tour: Tour }
        | { type: "restaurant"; restaurant: Restaurant };
    }
  | {
      id: string;
      role: "assistant";
      /** Multiple cards shown as horizontal carousel */
      kind: "cards";
      content: string;
      items: RawCardItem[];
    }
  | {
      id: string;
      role: "assistant";
      kind: "timeline";
      content: string;
      itinerary: Itinerary;
    };

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    kind: "text",
    content:
      "Oi! Sou o **Huan**, seu agente de viagem do Nordeste. Posso indicar passeios, restaurantes, praias e cupons, e também montar uma viagem completa pra você. Por onde a gente começa?",
  },
];

export const SUGGESTED_PROMPTS = [
  "Quero um passeio de barco",
  "Onde comer frutos do mar?",
  "Quero planejar uma viagem",
  "Quais praias têm mar calmo?",
];

/**
 * Mock simples, substituído pela rota /api/chat com Groq na Fase 11.
 * Faz match por palavras-chave em roteiros, passeios e restaurantes.
 */
export function mockReply(userInput: string): ChatMessage[] {
  const q = userInput.toLowerCase();

  // 1) Roteiros / itinerários (timeline)
  if (/roteir|itiner|dias?|programa|agenda/.test(q)) {
    const daysMatch = q.match(/(\d+)\s*dia/);
    const wantedDays = daysMatch ? parseInt(daysMatch[1], 10) : null;
    const itinerary =
      ITINERARIES.find((it) => wantedDays && it.durationDays === wantedDays) ??
      ITINERARIES[1]; // default: 3 dias

    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "text",
        content: `Bora! Te montei um roteiro de ${itinerary.durationDays} ${itinerary.durationDays === 1 ? "dia" : "dias"} em João Pessoa. ${itinerary.subtitle}`,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "timeline",
        content: "",
        itinerary,
      },
    ];
  }

  // 2) Passeio específico
  const tourMatch = TOURS.find((t) =>
    t.title.toLowerCase().split(" ").some((w) => q.includes(w) && w.length > 4),
  );
  if (tourMatch) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "text",
        content: `Encontrei um passeio que combina: **${tourMatch.title}**.`,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "card",
        content: "",
        card: { type: "tour", tour: tourMatch },
      },
    ];
  }

  // 3) Restaurante
  const restMatch = RESTAURANTS.find((r) =>
    r.name.toLowerCase().split(" ").some((w) => q.includes(w) && w.length > 3),
  );
  if (restMatch) {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "text",
        content: `Olha o que achei no nosso guia: **${restMatch.name}**.`,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "card",
        content: "",
        card: { type: "restaurant", restaurant: restMatch },
      },
    ];
  }

  // 4) Fallback
  return [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      kind: "text",
      content:
        "Ainda não encontrei algo específico no catálogo. Em João Pessoa vale conhecer praias urbanas como Cabo Branco e Tambaú, ou bairros como Manaíra e Jacaré (pôr do sol com Bolero de Ravel). Quer que eu sugira algo dentro de uma categoria?",
    },
  ];
}

export { getTourById };
