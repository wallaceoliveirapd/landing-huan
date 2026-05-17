// Placeholders por keyword. Usamos picsum.photos por confiabilidade, sempre
// retorna 200. Quando o Cloudflare R2 estiver ligado, este helper é substituído.
// O `seed` deterministico garante que a mesma keyword renderiza a mesma foto.

const SEEDS: Record<string, string> = {
  "jp-praia-cabo-branco": "jp-cabo-branco",
  "jp-litoral": "jp-litoral",
  "jp-pier": "jp-pier-jacare",
  "tour-catamaran": "tour-catamaran-jp",
  "tour-buggy": "tour-buggy-paraiba",
  "tour-praia-aerea": "tour-praia-aerea",
  "restaurant-mesa": "restaurant-mesa-bonita",
  "restaurant-frutos-mar": "restaurant-frutos-mar",
  "restaurant-cuscuz": "restaurant-cuscuz-paraiba",
  "dica-viagem": "dica-viagem-mundo",
  "dica-mapa": "dica-mapa-papel",
  "icon-tickets": "icon-tickets-amarelo",
  "icon-food": "icon-food-prato",
  "icon-tip": "icon-tip-bulbo",
};

export function unsplash(keyword: keyof typeof SEEDS | string, w = 800, h = 600): string {
  const seed = SEEDS[keyword as keyof typeof SEEDS] ?? String(keyword);
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

export const placeholders = SEEDS;
