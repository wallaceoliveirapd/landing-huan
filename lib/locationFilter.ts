/**
 * Shared helpers for the State + City location filter pattern.
 * Items in the DB store city as "Cidade, Estado" (e.g. "João Pessoa, PB").
 */

// Keys are normalized (NFD stripped, uppercase) so "PB", "PARAIBA", "Paraíba"
// all match a single canonical state label.
export const STATE_LABEL: Record<string, string> = {
  AL: "Alagoas",       ALAGOAS: "Alagoas",
  BA: "Bahia",         BAHIA: "Bahia",
  CE: "Ceará",         CEARA: "Ceará",
  MA: "Maranhão",      MARANHAO: "Maranhão",
  PB: "Paraíba",       PARAIBA: "Paraíba",
  PE: "Pernambuco",    PERNAMBUCO: "Pernambuco",
  PI: "Piauí",         PIAUI: "Piauí",
  RN: "Rio Grande do Norte", "RIO GRANDE DO NORTE": "Rio Grande do Norte",
  SE: "Sergipe",       SERGIPE: "Sergipe",
};

export function normalizeKey(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
}

export function parseCity(value: string): { name: string; state: string } {
  const [name, raw] = value.split(",").map((s) => s.trim());
  const key = normalizeKey(raw ?? "");
  const state = STATE_LABEL[key] ?? (raw ?? "");
  return { name: name ?? "", state };
}

export type CityOption = { name: string; state: string };

/** Build deduped CityOption[] from a list of "Cidade, Estado" strings. */
export function buildCityOptions(rawCities: (string | undefined | null)[]): CityOption[] {
  const seen = new Map<string, CityOption>();
  for (const raw of rawCities) {
    const r = (raw ?? "").trim();
    if (!r) continue;
    const { name, state } = parseCity(r);
    if (!name) continue;
    const k = `${name}|${state}`;
    if (!seen.has(k)) seen.set(k, { name, state });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

