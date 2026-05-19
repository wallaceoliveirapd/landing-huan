/**
 * Shared helper for filtering content lists by a trip's city or state.
 *
 * Items store city as "Cidade, Estado" or just "Cidade". Compare normalized
 * (lowercase, accent-stripped) on the FIRST comma-segment so João Pessoa
 * matches "João Pessoa, PB" and "joao pessoa" alike.
 *
 * State-level matching: if target is a state name or abbreviation (e.g.
 * "Bahia" or "BA"), any item whose state segment matches is included.
 *
 * Items WITHOUT a city set are treated as untagged (city-agnostic) and
 * always pass the filter.
 */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Maps state abbreviation (normalized) to full name (normalized)
const STATE_ABBR: Record<string, string> = {
  al: "alagoas",
  ba: "bahia",
  ce: "ceara",
  ma: "maranhao",
  pb: "paraiba",
  pe: "pernambuco",
  pi: "piaui",
  rj: "rio de janeiro",
  rn: "rio grande do norte",
  se: "sergipe",
};

export function matchesCity(
  itemCity: string | undefined | null,
  target: string,
): boolean {
  if (!itemCity) return true; // untagged items are city-agnostic
  const normTarget = norm(target).split(",")[0].trim();
  const parts = norm(itemCity).split(",");
  const cityPart = parts[0].trim();
  const statePart = parts[1]?.trim();

  // Exact city match
  if (cityPart === normTarget) return true;

  // State match: target is a state abbreviation or full name
  if (statePart) {
    if (statePart === normTarget) return true;
    // Expand abbreviation and compare full name
    const fullName = STATE_ABBR[statePart];
    if (fullName && fullName === normTarget) return true;
    // Target is abbreviation, item has full name
    const targetFull = STATE_ABBR[normTarget];
    if (targetFull && targetFull === statePart) return true;
  }

  return false;
}
