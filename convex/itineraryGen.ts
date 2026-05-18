"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { osmKindsForTripType, type OsmPlace } from "../lib/osmPlaces";

// ─── Types ─────────────────────────────────────────────────────────────────
type Activity = {
  source: "db" | "osm" | "suggestion";
  kind: "tour" | "restaurant" | "praia" | "nightlife" | "activity";
  timeOfDay: "morning" | "afternoon" | "evening" | "fullday";
  title: string;
  note?: string;
  itemId?: string; // db: Convex id; osm: osmId (e.g. "node/123")
  icon?: string;
  // OSM-specific fields persisted on the activity for rendering without
  // re-querying. Optional and only present when source = "osm".
  osmLat?: number;
  osmLng?: number;
  osmAddress?: string;
  osmWebsite?: string;
};

type Day = { day: number; theme: string; activities: Activity[] };

type ContentItem = { _id: string; kind: string; title: string; shortDesc: string; relevant: boolean };
type ContentBundle = {
  tours: (ContentItem & { duration: string; price: number; tags: string[] })[];
  restaurants: (ContentItem & { cuisine: string; priceRange: string; tags: string[] })[];
  praias: ContentItem[];
  nightlife: (ContentItem & { type: string })[];
};

type Trip = {
  type: string;
  destination: string;
  lat: number;
  lng: number;
  duration?: number;
  groupSize?: number;
  budget?: string;
};

// ─── Main action ───────────────────────────────────────────────────────────
export const generate = action({
  args: { tripId: v.id("trips") },
  handler: async (ctx, { tripId }): Promise<Day[]> => {
    const trip = await ctx.runQuery(internal.itineraryHelpers.getTrip, { tripId });
    if (!trip) throw new Error("Trip not found");

    // 1. Curated DB content (highest priority). Pass the trip city so the
    // helper drops any items from other cities — prevents Natal places from
    // showing up in a João Pessoa trip.
    const tripCity = trip.destination?.split(",")[0]?.trim() || undefined;
    const content = await ctx.runQuery(internal.itineraryHelpers.collectContent, {
      type: trip.type,
      budget: trip.budget,
      city: tripCity,
    });

    // 2. Real-world places from OpenStreetMap (medium priority, exists in
    // reality, but no rating/photo). We fetch a relevant set for the trip
    // type around the destination coordinates.
    let osmPlaces: OsmPlace[] = [];
    try {
      const kinds = osmKindsForTripType(trip.type);
      osmPlaces = await ctx.runAction(api.osmPlaces.searchAroundCity, {
        lat: trip.lat,
        lng: trip.lng,
        kinds,
        radius: 8000,
      });
    } catch (err) {
      console.warn("[itineraryGen] OSM fetch failed:", err);
    }

    // 3. Plan with AI (using DB + OSM context); deterministic fallback.
    let itinerary: Day[];
    try {
      itinerary = await planWithAI(trip, content, osmPlaces);
    } catch (err) {
      console.warn("[itineraryGen] AI failed, using deterministic fallback:", err);
      itinerary = deterministicPlan(trip, content, osmPlaces);
    }

    // 4. Enrich OSM activities with lat/lng/address/website for rendering.
    const osmById = new Map(osmPlaces.map((p) => [p.osmId, p]));
    itinerary = itinerary.map((d) => ({
      ...d,
      activities: d.activities.map((a) => {
        if (a.source !== "osm" || !a.itemId) return a;
        const p = osmById.get(a.itemId);
        if (!p) return a;
        return {
          ...a,
          osmLat: p.lat,
          osmLng: p.lng,
          osmAddress: p.address,
          osmWebsite: p.website,
        };
      }),
    }));

    await ctx.runMutation(internal.itineraryHelpers.setItinerary, {
      tripId,
      itinerary,
    });

    return itinerary;
  },
});

// ─── AI planner (Gemini structured output) ─────────────────────────────────
async function planWithAI(
  trip: Trip,
  content: ContentBundle,
  osmPlaces: OsmPlace[],
): Promise<Day[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          days: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                day: { type: SchemaType.NUMBER },
                theme: { type: SchemaType.STRING },
                activities: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      source: { type: SchemaType.STRING },
                      kind: { type: SchemaType.STRING },
                      timeOfDay: { type: SchemaType.STRING },
                      title: { type: SchemaType.STRING },
                      note: { type: SchemaType.STRING },
                      itemId: { type: SchemaType.STRING },
                      icon: { type: SchemaType.STRING },
                    },
                    required: ["source", "kind", "timeOfDay", "title"],
                  },
                },
              },
              required: ["day", "theme", "activities"],
            },
          },
        },
        required: ["days"],
      },
      temperature: 0.65,
    },
  });

  // Restaurants are EXCLUDED from the db/osm pools so the model never
  // pins a real restaurant. Dining slots are always generic "suggestion"
  // titles; the user picks a real restaurant later from AddActivitySheet.
  const dbItems = [
    ...content.tours.map((t) => ({ ...t, source: "db" })),
    ...content.praias.map((p) => ({ ...p, source: "db" })),
    ...content.nightlife.map((n) => ({ ...n, source: "db" })),
  ];

  const osmCompact = osmPlaces
    .filter((p) => p.kind !== "restaurant")
    .slice(0, 40)
    .map((p) => ({
      osmId: p.osmId,
      name: p.name,
      kind: p.kind,
      address: p.address,
      tags: p.tags.slice(0, 4),
    }));

  const days = trip.duration ?? 3;
  const groupSize = trip.groupSize ?? 2;
  const cityName = trip.destination.split(",")[0].trim();

  const prompt = `Planejador de viagens pelo Nordeste/BR. Monte JSON do roteiro.

VIAGEM: destino=${trip.destination} cidade=${cityName} estilo=${trip.type} dias=${days} grupo=${groupSize} orcamento=${trip.budget ?? "medio"}

DB CURADO (passeios/praias/vida noturna) — use _id em itemId:
${JSON.stringify(dbItems.slice(0, 30))}

OSM REAL (atrações/passeios/praias) — use osmId em itemId:
${JSON.stringify(osmCompact)}

REGRAS:
1. RESTRIÇÃO DE CIDADE: TODAS as atividades devem ficar em ${cityName} ou bairros/praias da própria cidade. NUNCA inclua lugares de outras cidades (ex: para João Pessoa, NUNCA Natal/Recife/Maceió/etc). Se o DB ou OSM trouxer algo de fora, ignore.
2. Passeios/praias/vida noturna: PREFIRA db, depois osm. Suggestion só se nada cobrir.
3. Restaurantes (kind="restaurant"): SEMPRE source="suggestion". NUNCA cite nome real ou cadastro. Title genérico tipo "Almoço em restaurante regional na Orla" / "Jantar de frutos do mar em ${cityName}" / "Café da manhã em padaria local". Usuário escolhe o restaurante real depois.
4. Cada dia: tema (3-5 palavras) + 3 a 5 atividades.
5. Atividade:
   - source: "db" | "osm" | "suggestion"
   - kind: "tour" | "restaurant" | "praia" | "nightlife" | "activity"
   - timeOfDay: "morning" | "afternoon" | "evening" | "fullday"
   - title curto
   - note opcional (1 linha)
   - itemId só se source db/osm
   - icon só se suggestion (Lucide: "utensils","music","waves","compass","sunset","map-pin","coffee","wind")
6. fullday substitui manhã+tarde (sem almoço no mesmo dia).
7. SEMPRE 1 jantar (suggestion) por dia.
8. Balanceie relax/movimento. Orcamento baixo=grátis/econômico, alto=premium.

Retorne: { "days": [{ "day": 1, "theme": "...", "activities": [...] }] }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text) as { days: Day[] };

  return parsed.days.map((d, i) => ({
    day: d.day ?? i + 1,
    theme: String(d.theme ?? `Dia ${i + 1}`),
    activities: (d.activities ?? []).map((a): Activity => {
      const kind: Activity["kind"] = ["tour", "restaurant", "praia", "nightlife", "activity"].includes(a.kind)
        ? (a.kind as Activity["kind"])
        : "activity";
      // Enforcement: restaurant slots are ALWAYS generic suggestions.
      // Drops the itemId so we don't accidentally pin a real restaurant
      // even if the model insisted on returning one.
      const rawSource: Activity["source"] =
        a.source === "db" ? "db" : a.source === "osm" ? "osm" : "suggestion";
      const source: Activity["source"] = kind === "restaurant" ? "suggestion" : rawSource;
      return {
        source,
        kind,
        timeOfDay: ["morning", "afternoon", "evening", "fullday"].includes(a.timeOfDay)
          ? (a.timeOfDay as Activity["timeOfDay"])
          : "morning",
        title: String(a.title ?? "Atividade"),
        note: a.note ? String(a.note) : undefined,
        itemId: (source === "db" || source === "osm") && a.itemId ? String(a.itemId) : undefined,
        icon: source === "suggestion" && (a.icon ?? kind === "restaurant")
          ? String(a.icon ?? "utensils")
          : undefined,
      };
    }),
  }));
}

// ─── Deterministic fallback ────────────────────────────────────────────────
// Used when Gemini is unavailable. Order of preference per slot:
//   1) DB item (curated)
//   2) OSM place (real, no curation)
//   3) Hardcoded suggestion
function deterministicPlan(
  trip: Trip,
  content: ContentBundle,
  osmPlaces: OsmPlace[],
): Day[] {
  const days = trip.duration ?? 3;
  const dbTours = content.tours.filter((t) => t.relevant);
  const dbPraias = content.praias.filter((p) => p.relevant);
  const dbNightlife = content.nightlife;
  const cityName = trip.destination.split(",")[0].trim();

  // Restaurants intentionally NOT pulled from db/osm. Dining slots always
  // resolve to generic suggestions (the user picks the real restaurant
  // later from AddActivitySheet).
  const osmTours = osmPlaces.filter((p) => p.kind === "tour" || p.kind === "attraction");
  const osmPraias = osmPlaces.filter((p) => p.kind === "praia");
  const osmNightlife = osmPlaces.filter((p) => p.kind === "nightlife");

  const FB = {
    tour: [
      { title: "Caminhada pelo centro histórico", icon: "map-pin", note: "Roteiro a pé pelas principais atrações." },
      { title: "Passeio de buggy nas dunas", icon: "wind", note: "Aventura clássica do Nordeste." },
    ],
    praia: [{ title: "Tarde em uma praia urbana", icon: "waves", note: "Relaxar e curtir o pôr do sol." }],
    breakfast: [{ title: `Café da manhã em padaria local`, icon: "coffee", note: "Pão, cuscuz e tapioca." }],
    lunch: [{ title: `Almoço em restaurante regional em ${cityName}`, icon: "utensils", note: "Comida típica nordestina." }],
    dinner: [{ title: `Jantar de frutos do mar em ${cityName}`, icon: "utensils", note: "Peixe, camarão ou moqueca." }],
    nightlife: [{ title: "Bar com música ao vivo", icon: "music", note: "MPB e forró pé de serra." }],
  };

  function pickActivity<DB extends { _id: string; title: string }>(
    dbPool: DB[],
    dbIdx: { i: number },
    osmPool: OsmPlace[],
    osmIdx: { i: number },
    fb: { title: string; icon: string; note: string }[],
    kind: Activity["kind"],
  ): Omit<Activity, "timeOfDay"> {
    if (dbIdx.i < dbPool.length) {
      const item = dbPool[dbIdx.i++];
      return { source: "db", kind, title: item.title, itemId: item._id };
    }
    if (osmIdx.i < osmPool.length) {
      const place = osmPool[osmIdx.i++];
      return {
        source: "osm",
        kind,
        title: place.name,
        itemId: place.osmId,
        note: place.address,
      };
    }
    const f = fb[(dbIdx.i + osmIdx.i) % fb.length];
    return { source: "suggestion", kind, title: f.title, note: f.note, icon: f.icon };
  }

  const tDb = { i: 0 }, tOsm = { i: 0 };
  const pDb = { i: 0 }, pOsm = { i: 0 };
  const nDb = { i: 0 }, nOsm = { i: 0 };

  function restaurantSuggestion(kind: "breakfast" | "lunch" | "dinner"): Activity {
    const fb = FB[kind][0];
    return {
      source: "suggestion",
      kind: "restaurant",
      timeOfDay:
        kind === "breakfast" ? "morning" : kind === "lunch" ? "afternoon" : "evening",
      title: fb.title,
      icon: fb.icon,
      note: fb.note,
    };
  }

  const themes = [
    "Primeiro contato com a cidade",
    "Mar e relax",
    "Aventura e descobertas",
    "Sabores e cultura local",
    "Sol e descanso",
    "Encerramento com forró",
  ];

  const result: Day[] = [];
  for (let d = 1; d <= days; d++) {
    const activities: Activity[] = [];
    const theme = themes[(d - 1) % themes.length];

    // Morning, alternate between tour and praia
    if (d % 2 === 1) {
      activities.push({
        ...pickActivity(dbTours, tDb, osmTours, tOsm, FB.tour, "tour"),
        timeOfDay: "morning",
      });
    } else {
      activities.push({
        ...pickActivity(dbPraias, pDb, osmPraias, pOsm, FB.praia, "praia"),
        timeOfDay: "morning",
      });
    }
    // Lunch (always a generic suggestion, never a real restaurant)
    activities.push(restaurantSuggestion("lunch"));
    // Afternoon: optional second tour
    if (d % 2 === 0) {
      activities.push({
        ...pickActivity(dbTours, tDb, osmTours, tOsm, FB.tour, "tour"),
        timeOfDay: "afternoon",
      });
    }
    // Dinner (always a generic suggestion)
    activities.push(restaurantSuggestion("dinner"));
    // Last day: nightlife
    if (d === days) {
      activities.push({
        ...pickActivity(dbNightlife, nDb, osmNightlife, nOsm, FB.nightlife, "nightlife"),
        timeOfDay: "evening",
      });
    }

    result.push({ day: d, theme, activities });
  }

  return result;
}
