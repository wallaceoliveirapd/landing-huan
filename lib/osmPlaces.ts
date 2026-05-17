/**
 * OpenStreetMap (Overpass API) helpers, shared between server (Convex
 * action) and client (planning UI).
 *
 * Why OSM: 100% free, no API key, no signup, public data. Coverage
 * across Brazil is decent for the major cities of the Northeast.
 * Limitations: no rating/reviews, no photos. Has name, address,
 * lat/lng, opening hours, phone, website.
 */

/**
 * Categories used in our app. Each maps to a set of OSM filter clauses
 * that we'll feed into an Overpass QL query.
 *
 * Filter syntax (Overpass QL):
 *   node["amenity"="restaurant"](around:RADIUS,LAT,LNG);
 *   way["amenity"="restaurant"](around:RADIUS,LAT,LNG);
 *
 * Every filter becomes a (node + way) pair so we get points AND areas.
 */
export type OsmKind =
  | "restaurant"
  | "praia"
  | "tour"
  | "nightlife"
  | "attraction";

const OSM_FILTERS: Record<OsmKind, string[]> = {
  restaurant: [
    '["amenity"="restaurant"]',
    '["amenity"="cafe"]',
    '["amenity"="bar"]["food"="yes"]',
  ],
  praia: [
    '["natural"="beach"]',
    '["leisure"="beach_resort"]',
  ],
  tour: [
    '["tourism"="attraction"]',
    '["tourism"="viewpoint"]',
    '["historic"~"monument|memorial|castle|fort"]',
    '["sport"~"surfing|kitesurfing|diving"]',
  ],
  nightlife: [
    '["amenity"="nightclub"]',
    '["amenity"="bar"]',
    '["amenity"="pub"]',
  ],
  attraction: [
    '["tourism"="museum"]',
    '["tourism"="zoo"]',
    '["tourism"="aquarium"]',
    '["tourism"="artwork"]',
    '["amenity"="theatre"]',
    '["amenity"="place_of_worship"]["historic"]',
    '["historic"~"building|church|monument|memorial"]',
    '["leisure"="park"]',
    '["leisure"="nature_reserve"]',
  ],
};

/**
 * Trip-style → OSM categories. Some styles span multiple OSM kinds
 * (e.g. "natureza" wants viewpoints, nature reserves AND parks).
 */
export function osmKindsForTripType(tripType: string): OsmKind[] {
  switch (tripType) {
    case "praia":
      return ["praia", "restaurant"];
    case "historica":
      return ["attraction", "restaurant"];
    case "natureza":
      return ["attraction", "tour", "restaurant"];
    case "aventura":
      return ["tour", "praia", "restaurant"];
    case "gastronomia":
      return ["restaurant", "attraction"];
    case "festa":
      return ["nightlife", "restaurant"];
    case "roadtrip":
      return ["attraction", "praia", "restaurant", "tour"];
    case "familia":
      return ["attraction", "praia", "restaurant"];
    case "solo":
      return ["attraction", "tour", "restaurant", "praia"];
    case "cultural":
      return ["attraction", "restaurant", "nightlife"];
    default:
      return ["attraction", "restaurant"];
  }
}

/**
 * Builds an Overpass QL query for the given kinds in a circle around
 * a (lat, lng) coordinate.
 *
 * Returns up to LIMIT results total. We split the search radius by kind
 * count so the query stays under the Overpass timeout (25s).
 */
export function buildOverpassQuery(
  lat: number,
  lng: number,
  kinds: OsmKind[],
  radiusMeters = 8000,
): string {
  const lines: string[] = [];
  for (const kind of kinds) {
    for (const filter of OSM_FILTERS[kind]) {
      lines.push(
        `  node${filter}(around:${radiusMeters},${lat},${lng});`,
        `  way${filter}(around:${radiusMeters},${lat},${lng});`,
      );
    }
  }
  return `[out:json][timeout:25];
(
${lines.join("\n")}
);
out tags center 60;`;
}

/** Parsed OSM place, what we store in cache and pass to the AI. */
export type OsmPlace = {
  osmId: string;
  name: string;
  kind: OsmKind;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  cuisine?: string;
  tags: string[];
};

/**
 * Classify a raw OSM element into one of our OsmKind categories. Picks
 * the most specific match based on tag values.
 */
function classifyKind(tags: Record<string, string>): OsmKind {
  if (tags.amenity === "nightclub" || tags.amenity === "pub") return "nightlife";
  if (tags.natural === "beach" || tags.leisure === "beach_resort") return "praia";
  if (tags.amenity === "restaurant" || tags.amenity === "cafe") return "restaurant";
  if (tags.amenity === "bar") {
    // bars with food → restaurant; bars without → nightlife
    return tags.food === "yes" ? "restaurant" : "nightlife";
  }
  if (
    tags.tourism === "attraction" ||
    tags.tourism === "viewpoint" ||
    tags.sport
  ) {
    return "tour";
  }
  return "attraction";
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

/**
 * Maps raw Overpass JSON into clean OsmPlace records. Drops items
 * without a name (most OSM POIs without a name are noise).
 */
export function parseOverpassResponse(
  data: { elements?: OverpassElement[] },
): OsmPlace[] {
  const elements = data.elements ?? [];
  const seen = new Set<string>();
  const out: OsmPlace[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name?.trim();
    if (!name) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== "number" || typeof lng !== "number") continue;

    const osmId = `${el.type}/${el.id}`;
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    const kind = classifyKind(tags);

    // Build a single-line address from OSM address tags.
    const addressBits = [
      tags["addr:street"],
      tags["addr:housenumber"],
      tags["addr:suburb"] ?? tags["addr:neighbourhood"],
      tags["addr:city"],
    ].filter(Boolean);
    const address = addressBits.length > 0 ? addressBits.join(", ") : undefined;

    // Significant tags for prompting (helps AI understand each place)
    const tagBag: string[] = [];
    if (tags.cuisine) tagBag.push(`cuisine:${tags.cuisine}`);
    if (tags.tourism) tagBag.push(`tourism:${tags.tourism}`);
    if (tags.historic) tagBag.push(`historic:${tags.historic}`);
    if (tags.sport) tagBag.push(`sport:${tags.sport}`);
    if (tags.leisure) tagBag.push(`leisure:${tags.leisure}`);
    if (tags.natural) tagBag.push(`natural:${tags.natural}`);

    out.push({
      osmId,
      name,
      kind,
      lat,
      lng,
      address,
      phone: tags.phone ?? tags["contact:phone"],
      website: tags.website ?? tags["contact:website"],
      openingHours: tags.opening_hours,
      cuisine: tags.cuisine,
      tags: tagBag,
    });
  }

  return out;
}

/** Cache key for a search, `kinds:lat:lng:radius`. */
export function osmCacheKey(
  kinds: OsmKind[],
  lat: number,
  lng: number,
  radius: number,
): string {
  return `${kinds.slice().sort().join(",")}:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
}

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
export const OVERPASS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
