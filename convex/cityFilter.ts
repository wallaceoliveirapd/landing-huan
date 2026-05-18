/**
 * Shared helper for filtering content lists by a trip's city.
 *
 * Items store city as "Cidade, Estado" or just "Cidade". The trip passes
 * the city portion of "Cidade, Estado" too. Compare normalized (lowercase,
 * accent-stripped) on the FIRST comma-segment so João Pessoa matches
 * "João Pessoa, PB" and "joao pessoa" alike.
 *
 * Items WITHOUT a city set are treated as untagged (city-agnostic) and
 * always pass the filter — they won't be excluded just because their city
 * field was left blank in the admin.
 */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export function matchesCity(
  itemCity: string | undefined | null,
  target: string,
): boolean {
  if (!itemCity) return true; // untagged items are city-agnostic
  const a = norm(itemCity).split(",")[0].trim();
  const b = norm(target).split(",")[0].trim();
  return a === b;
}
