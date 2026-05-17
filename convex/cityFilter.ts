/**
 * Shared helper for filtering content lists by a trip's city.
 *
 * Items store city as "Cidade, Estado" or just "Cidade". The trip passes
 * the city portion of "Cidade, Estado" too. Compare normalized (lowercase,
 * accent-stripped) on the FIRST comma-segment so João Pessoa matches
 * "João Pessoa, PB" and "joao pessoa" alike.
 */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export function matchesCity(
  itemCity: string | undefined | null,
  target: string,
): boolean {
  if (!itemCity) return false;
  const a = norm(itemCity).split(",")[0].trim();
  const b = norm(target).split(",")[0].trim();
  return a === b;
}
