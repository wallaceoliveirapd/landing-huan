export type NordesteCity = {
  name: string;
  state: string;
  lat: number;
  lng: number;
  tags: string[]; // "praia" | "historica" | "natureza" | "festa" etc.
};

export const NORDESTE_CITIES: NordesteCity[] = [
  // Paraíba
  { name: "João Pessoa", state: "PB", lat: -7.1195, lng: -34.845, tags: ["praia", "historica", "gastronomia"] },
  { name: "Campina Grande", state: "PB", lat: -7.2306, lng: -35.8811, tags: ["festa", "historica"] },
  { name: "Areia", state: "PB", lat: -6.9614, lng: -35.6958, tags: ["historica", "natureza"] },
  { name: "Cabaceiras", state: "PB", lat: -7.4908, lng: -36.2853, tags: ["natureza"] },

  // Pernambuco
  { name: "Recife", state: "PE", lat: -8.0476, lng: -34.877, tags: ["historica", "gastronomia", "cultural"] },
  { name: "Olinda", state: "PE", lat: -7.9983, lng: -34.8557, tags: ["historica", "cultural", "festa"] },
  { name: "Caruaru", state: "PE", lat: -8.2839, lng: -35.9761, tags: ["cultural", "festa"] },
  { name: "Porto de Galinhas", state: "PE", lat: -8.5039, lng: -35.0044, tags: ["praia"] },
  { name: "Fernando de Noronha", state: "PE", lat: -3.8547, lng: -32.4297, tags: ["praia", "natureza", "aventura"] },
  { name: "Petrolina", state: "PE", lat: -9.3986, lng: -40.5077, tags: ["gastronomia"] },
  { name: "Triunfo", state: "PE", lat: -7.8344, lng: -38.1028, tags: ["natureza", "historica"] },

  // Ceará
  { name: "Fortaleza", state: "CE", lat: -3.7172, lng: -38.5433, tags: ["praia", "gastronomia", "cultural"] },
  { name: "Jericoacoara", state: "CE", lat: -2.7975, lng: -40.5139, tags: ["praia", "aventura", "natureza"] },
  { name: "Canoa Quebrada", state: "CE", lat: -4.5139, lng: -37.6633, tags: ["praia", "festa"] },
  { name: "Cumbuco", state: "CE", lat: -3.6308, lng: -38.7636, tags: ["praia", "aventura"] },
  { name: "Juazeiro do Norte", state: "CE", lat: -7.213, lng: -39.3155, tags: ["cultural", "historica"] },
  { name: "Guaramiranga", state: "CE", lat: -4.2689, lng: -38.9289, tags: ["natureza", "festa"] },
  { name: "Morro Branco", state: "CE", lat: -4.1689, lng: -38.0217, tags: ["praia"] },

  // Rio Grande do Norte
  { name: "Natal", state: "RN", lat: -5.7945, lng: -35.211, tags: ["praia", "gastronomia"] },
  { name: "Pipa", state: "RN", lat: -6.2281, lng: -35.0497, tags: ["praia", "aventura", "festa"] },
  { name: "Mossoró", state: "RN", lat: -5.1875, lng: -37.3444, tags: ["historica", "cultural"] },
  { name: "São Miguel do Gostoso", state: "RN", lat: -5.1222, lng: -35.6292, tags: ["praia", "aventura"] },
  { name: "Tibau do Sul", state: "RN", lat: -6.1928, lng: -35.0875, tags: ["praia"] },

  // Bahia
  { name: "Salvador", state: "BA", lat: -12.9714, lng: -38.5014, tags: ["historica", "cultural", "gastronomia", "festa"] },
  { name: "Morro de São Paulo", state: "BA", lat: -13.3753, lng: -38.9131, tags: ["praia", "aventura"] },
  { name: "Trancoso", state: "BA", lat: -16.5928, lng: -39.0853, tags: ["praia", "historica"] },
  { name: "Porto Seguro", state: "BA", lat: -16.4486, lng: -39.0653, tags: ["praia", "historica"] },
  { name: "Arraial d'Ajuda", state: "BA", lat: -16.4728, lng: -39.0825, tags: ["praia"] },
  { name: "Chapada Diamantina", state: "BA", lat: -12.4611, lng: -41.3313, tags: ["natureza", "aventura"] },
  { name: "Lençóis", state: "BA", lat: -12.5628, lng: -41.3908, tags: ["natureza", "aventura", "historica"] },
  { name: "Ilhéus", state: "BA", lat: -14.7889, lng: -39.0444, tags: ["praia", "historica"] },
  { name: "Itacaré", state: "BA", lat: -14.2781, lng: -38.9969, tags: ["praia", "aventura"] },
  { name: "Boipeba", state: "BA", lat: -13.6636, lng: -38.9244, tags: ["praia", "natureza"] },

  // Maranhão
  { name: "São Luís", state: "MA", lat: -2.5391, lng: -44.2829, tags: ["historica", "cultural", "gastronomia"] },
  { name: "Lençóis Maranhenses", state: "MA", lat: -2.4853, lng: -43.1264, tags: ["natureza", "aventura", "praia"] },
  { name: "Barreirinhas", state: "MA", lat: -2.7661, lng: -42.8281, tags: ["natureza", "aventura"] },
  { name: "Alcântara", state: "MA", lat: -2.4053, lng: -44.4133, tags: ["historica"] },

  // Piauí
  { name: "Teresina", state: "PI", lat: -5.0892, lng: -42.8019, tags: ["gastronomia", "cultural"] },
  { name: "Delta do Parnaíba", state: "PI", lat: -2.9083, lng: -41.7842, tags: ["natureza", "aventura", "praia"] },
  { name: "Serra da Capivara", state: "PI", lat: -8.8158, lng: -42.3361, tags: ["historica", "natureza", "aventura"] },

  // Alagoas
  { name: "Maceió", state: "AL", lat: -9.6658, lng: -35.735, tags: ["praia", "gastronomia"] },
  { name: "Maragogi", state: "AL", lat: -9.0089, lng: -35.2211, tags: ["praia"] },
  { name: "Penedo", state: "AL", lat: -10.2944, lng: -36.5858, tags: ["historica"] },
  { name: "São Miguel dos Milagres", state: "AL", lat: -9.2764, lng: -35.4047, tags: ["praia"] },

  // Sergipe
  { name: "Aracaju", state: "SE", lat: -10.9472, lng: -37.0731, tags: ["praia", "gastronomia"] },
  { name: "Canindé de São Francisco", state: "SE", lat: -9.6386, lng: -37.7917, tags: ["aventura", "natureza"] },
];

export function searchCities(query: string): NordesteCity[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return NORDESTE_CITIES.filter((c) => {
    const name = c.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const full = `${name} ${c.state.toLowerCase()}`;
    return name.startsWith(q) || full.includes(q);
  }).slice(0, 6);
}

export function getCityByName(name: string): NordesteCity | undefined {
  return NORDESTE_CITIES.find((c) => `${c.name}, ${c.state}` === name);
}
