import { unsplash } from "./unsplash";

export type Tour = {
  id: string;
  slug: string;
  title: string;
  image: string;
  rating: number;
  ratingLabel: string;
  duration: string;
  price: number;
  priceFrom?: number;
  discountPct?: number;
  url: string;
  tags: string[];
  description?: string;
  shortDesc?: string;
  reviewCount?: number;
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  ratingLabel: string;
  openUntil?: string;
  address: string;
  instagram?: string;
  phone?: string;
  hours: { weekday: string; hours: string | "Fechado" }[];
  photos: string[];
};

export type Dica = {
  id: string;
  slug: string;
  title: string;
  cover: string;
  excerpt: string;
  tipo: "Geral" | "João Pessoa" | "Notícia";
  publishedAt: string;
};

export const TOURS: Tour[] = [
  {
    id: "t1",
    slug: "tour-litoral-norte",
    title: "Tour de um dia pelas praias do litoral norte de João Pessoa",
    image: unsplash("tour-praia-aerea", 600, 400),
    rating: 4.4,
    ratingLabel: "Muito bom",
    duration: "10 horas",
    price: 180,
    priceFrom: 210,
    discountPct: 14,
    url: "https://www.example.com/tour-litoral-norte",
    tags: ["Particular disponível", "Serviço de busca disponível"],
  },
  {
    id: "t2",
    slug: "catamara-picaozinho",
    title: "Passeio de catamarã ao Picãozinho com snorkeling",
    image: unsplash("tour-catamaran", 600, 400),
    rating: 4.7,
    ratingLabel: "Excelente",
    duration: "4 horas",
    price: 90,
    priceFrom: 110,
    discountPct: 18,
    url: "https://www.example.com/catamara-picaozinho",
    tags: ["Saídas diárias", "Inclui equipamento"],
  },
  {
    id: "t3",
    slug: "buggy-litoral-sul",
    title: "Buggy pelo litoral sul: Tambaba, Coqueirinho e Tabatinga",
    image: unsplash("tour-buggy", 600, 400),
    rating: 4.6,
    ratingLabel: "Muito bom",
    duration: "8 horas",
    price: 150,
    url: "https://www.example.com/buggy-litoral-sul",
    tags: ["Particular disponível"],
  },
  {
    id: "t4",
    slug: "city-tour-historico",
    title: "City tour histórico pelo centro de João Pessoa",
    image: unsplash("jp-litoral", 600, 400),
    rating: 4.3,
    ratingLabel: "Bom",
    duration: "3 horas",
    price: 60,
    url: "https://www.example.com/city-tour",
    tags: ["Guia em português"],
  },
];

export const RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    slug: "bar-do-cuscuz",
    name: "Bar do Cuscuz João Pessoa",
    image: unsplash("restaurant-cuscuz", 600, 400),
    rating: 4.4,
    ratingLabel: "Muito bom",
    openUntil: "01:00",
    address: "Avenida Cabo Branco 3056, João Pessoa, Paraíba 58045-010 Brasil",
    instagram: "@bardocuscuz",
    phone: "+558332475396",
    hours: [
      { weekday: "Domingo", hours: "Fechado" },
      { weekday: "Segunda", hours: "11:00 - 01:00" },
      { weekday: "Terça", hours: "11:00 - 01:00" },
      { weekday: "Quarta", hours: "11:00 - 01:00" },
      { weekday: "Quinta", hours: "11:00 - 01:00" },
      { weekday: "Sexta", hours: "11:00 - 01:00" },
      { weekday: "Sábado", hours: "11:00 - 01:00" },
    ],
    photos: [
      unsplash("restaurant-mesa", 600, 500),
      unsplash("restaurant-frutos-mar", 600, 500),
      unsplash("restaurant-cuscuz", 600, 500),
      unsplash("icon-food", 600, 500),
    ],
  },
  {
    id: "r2",
    slug: "mangai",
    name: "Mangai",
    image: unsplash("restaurant-mesa", 600, 400),
    rating: 4.5,
    ratingLabel: "Muito bom",
    openUntil: "23:00",
    address: "Av. Edson Ramalho 696, Manaíra, João Pessoa, Paraíba",
    instagram: "@mangaijp",
    phone: "+558332264120",
    hours: [
      { weekday: "Domingo", hours: "11:00 - 22:00" },
      { weekday: "Segunda", hours: "11:00 - 23:00" },
      { weekday: "Terça", hours: "11:00 - 23:00" },
      { weekday: "Quarta", hours: "11:00 - 23:00" },
      { weekday: "Quinta", hours: "11:00 - 23:00" },
      { weekday: "Sexta", hours: "11:00 - 23:00" },
      { weekday: "Sábado", hours: "11:00 - 23:00" },
    ],
    photos: [
      unsplash("restaurant-frutos-mar", 600, 500),
      unsplash("restaurant-mesa", 600, 500),
    ],
  },
  {
    id: "r3",
    slug: "casa-do-frances",
    name: "Casa do Francês",
    image: unsplash("restaurant-frutos-mar", 600, 400),
    rating: 4.6,
    ratingLabel: "Excelente",
    openUntil: "00:00",
    address: "Av. Cabo Branco 1300, João Pessoa, Paraíba",
    instagram: "@casadofrances",
    phone: "+558332478585",
    hours: [
      { weekday: "Domingo", hours: "12:00 - 22:00" },
      { weekday: "Segunda", hours: "Fechado" },
      { weekday: "Terça", hours: "12:00 - 23:00" },
      { weekday: "Quarta", hours: "12:00 - 23:00" },
      { weekday: "Quinta", hours: "12:00 - 23:00" },
      { weekday: "Sexta", hours: "12:00 - 00:00" },
      { weekday: "Sábado", hours: "12:00 - 00:00" },
    ],
    photos: [
      unsplash("restaurant-mesa", 600, 500),
      unsplash("restaurant-frutos-mar", 600, 500),
    ],
  },
];

/**
 * Cada parada de um dia de roteiro pode ser:
 * - um passeio já cadastrado ("tour", linkado por id), OU
 * - um lugar/atividade livre, só com nome/endereço/descrição (sem imagem).
 */
export type ItineraryStop =
  | { type: "tour"; tourId: string }
  | {
      type: "place";
      name: string;
      address?: string;
      description?: string;
      time?: string;
    };

export type ItineraryDay = {
  day: number;
  title: string;
  description: string;
  stops: ItineraryStop[];
};

export type Itinerary = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  durationDays: number;
  cover: string;
  days: ItineraryDay[];
};

export const ITINERARIES: Itinerary[] = [
  {
    id: "i1",
    slug: "1-dia-classico",
    title: "1 dia clássico em João Pessoa",
    subtitle: "City tour pela manhã, praia urbana à tarde e Bolero de Ravel no fim do dia.",
    durationDays: 1,
    cover: "https://images.unsplash.com/photo-1732217164523-d147e04babaf?auto=format&fit=crop&q=80&w=1200",
    days: [
      {
        day: 1,
        title: "Centro histórico, praia urbana e pôr do sol",
        description:
          "Comece no centro histórico, almoce em Tambaú e termine vendo o sol se pôr no rio Jacaré.",
        stops: [
          { type: "tour", tourId: "t4" },
          {
            type: "place",
            time: "13h",
            name: "Almoço no Mangai",
            address: "Av. Edson Ramalho 696, Manaíra",
            description: "Buffet de comida regional paraibana.",
          },
          { type: "tour", tourId: "t1" },
          {
            type: "place",
            time: "17h30",
            name: "Bolero de Ravel no Jacaré",
            address: "Praia do Jacaré, Cabedelo",
            description: "Pôr do sol clássico com o saxofonista tocando ao vivo.",
          },
        ],
      },
    ],
  },
  {
    id: "i2",
    slug: "3-dias-litoral",
    title: "3 dias de litoral em João Pessoa",
    subtitle: "Litoral norte, litoral sul e o melhor da cidade — sem pressa, com tempo de curtir.",
    durationDays: 3,
    cover: "https://images.unsplash.com/photo-1733057424920-7cf49b177b79?auto=format&fit=crop&q=80&w=1200",
    days: [
      {
        day: 1,
        title: "Litoral norte e centro",
        description: "Tour de barco no litoral norte pela manhã, almoço e tarde livre no centro histórico.",
        stops: [
          { type: "tour", tourId: "t1" },
          {
            type: "place",
            time: "14h",
            name: "Almoço no centro histórico",
            address: "Largo de São Frei Pedro Gonçalves",
            description: "Restaurantes coloniais com peixada de cação.",
          },
          { type: "tour", tourId: "t4" },
        ],
      },
      {
        day: 2,
        title: "Catamarã e Picãozinho",
        description: "Manhã no Picãozinho com snorkeling, almoço em Tambaú e fim de tarde no Bessa.",
        stops: [
          { type: "tour", tourId: "t2" },
          {
            type: "place",
            time: "13h",
            name: "Almoço pé na areia em Tambaú",
            address: "Orla de Tambaú",
            description: "Frutos do mar e tapioca regional.",
          },
          {
            type: "place",
            time: "17h",
            name: "Pôr do sol no Bessa",
            address: "Av. Olinda, Bessa",
            description: "Praia mais tranquila pra fechar o dia.",
          },
        ],
      },
      {
        day: 3,
        title: "Litoral sul de buggy",
        description: "Buggy por Tambaba, Coqueirinho e Tabatinga, com paradas pra fotos e mergulhos.",
        stops: [
          { type: "tour", tourId: "t3" },
          {
            type: "place",
            time: "19h",
            name: "Jantar de despedida",
            address: "Casa do Francês — Cabo Branco",
            description: "Cozinha autoral com sotaque paraibano.",
          },
        ],
      },
    ],
  },
  {
    id: "i3",
    slug: "7-dias-pe-na-areia",
    title: "7 dias de pé na areia",
    subtitle: "Uma semana inteira pra mergulhar na Paraíba — praia, cultura, gastronomia e descanso.",
    durationDays: 7,
    cover: "https://images.unsplash.com/photo-1733057586164-6f9ab1062e7a?auto=format&fit=crop&q=80&w=1200",
    days: [
      {
        day: 1, title: "Chegada e centro histórico", description: "Aclimatação, city tour e jantar leve.",
        stops: [
          { type: "tour", tourId: "t4" },
          { type: "place", time: "20h", name: "Jantar em Tambaú", address: "Orla de Tambaú", description: "Para descansar do voo." },
        ],
      },
      {
        day: 2, title: "Picãozinho de catamarã", description: "Mergulho com snorkeling em piscinas naturais.",
        stops: [{ type: "tour", tourId: "t2" }],
      },
      {
        day: 3, title: "Litoral norte", description: "Praias de Cabedelo, Camboinha e Poço.",
        stops: [{ type: "tour", tourId: "t1" }],
      },
      {
        day: 4, title: "Litoral sul de buggy", description: "Tambaba, Coqueirinho, Tabatinga, mirantes e falésias.",
        stops: [{ type: "tour", tourId: "t3" }],
      },
      {
        day: 5, title: "Dia livre em Tambaú", description: "Praia, mercado de artesanato e gastronomia.",
        stops: [
          { type: "place", time: "10h", name: "Mercado de Artesanato Paraibano", address: "Av. Almirante Tamandaré, Tambaú" },
          { type: "place", time: "13h", name: "Almoço pé na areia", address: "Orla de Tambaú" },
        ],
      },
      {
        day: 6, title: "Bolero de Ravel no Jacaré", description: "Passeio de barco no rio Jacaré com o pôr do sol clássico.",
        stops: [
          { type: "tour", tourId: "t1" },
          { type: "place", time: "17h30", name: "Bolero de Ravel no Jacaré", address: "Praia do Jacaré, Cabedelo" },
        ],
      },
      {
        day: 7, title: "Descanso e despedida", description: "Manhã de praia, almoço regional e retorno tranquilo.",
        stops: [
          { type: "place", time: "9h", name: "Manhã de praia em Cabo Branco" },
          { type: "place", time: "12h30", name: "Almoço de despedida", address: "Restaurante Mangai" },
        ],
      },
    ],
  },
];

export function getTourById(id: string): Tour | undefined {
  return TOURS.find((t) => t.id === id);
}

export function getItineraryBySlug(slug: string): Itinerary | undefined {
  return ITINERARIES.find((i) => i.slug === slug);
}

export const DICAS: Dica[] = [
  {
    id: "d1",
    slug: "melhor-epoca-para-visitar-joao-pessoa",
    title: "Qual a melhor época para visitar João Pessoa?",
    cover: unsplash("dica-viagem", 800, 500),
    excerpt:
      "Setembro a fevereiro têm sol garantido e mar calmo. Veja o que esperar mês a mês e como evitar a alta temporada.",
    tipo: "João Pessoa",
    publishedAt: "2026-05-12",
  },
  {
    id: "d2",
    slug: "5-erros-comuns-em-viagens-de-praia",
    title: "5 erros comuns em viagens de praia (e como evitar)",
    cover: unsplash("dica-mapa", 800, 500),
    excerpt:
      "Da escolha do hotel ao protetor solar errado — pequenos detalhes que arruinam uma viagem inteira.",
    tipo: "Geral",
    publishedAt: "2026-05-10",
  },
  {
    id: "d3",
    slug: "mercado-de-artesanato-de-tambau",
    title: "Mercado de Artesanato de Tambaú: o que comprar e por quanto",
    cover: unsplash("jp-praia-cabo-branco", 800, 500),
    excerpt:
      "Renda renascença, redes e cachaças paraibanas. Um guia rápido com faixas de preço e dicas de barganha.",
    tipo: "João Pessoa",
    publishedAt: "2026-05-08",
  },
];

const FEATURED_BASE = "?auto=format&fit=crop&q=80&w=1400";

export const FEATURED_SLIDES = [
  {
    src: `https://images.unsplash.com/photo-1732217164523-d147e04babaf${FEATURED_BASE}`,
    alt: "Vista aérea de uma cidade litorânea e o oceano",
  },
  {
    src: `https://images.unsplash.com/photo-1732216467230-42ce323767a8${FEATURED_BASE}`,
    alt: "Vista aérea de uma praia e do oceano",
  },
  {
    src: `https://images.unsplash.com/photo-1733057424920-7cf49b177b79${FEATURED_BASE}`,
    alt: "Vista aérea de uma praia arenosa e oceano",
  },
  {
    src: `https://images.unsplash.com/photo-1657321668786-9211f804d8c3${FEATURED_BASE}`,
    alt: "Edifício histórico com torre em João Pessoa",
  },
  {
    src: `https://images.unsplash.com/photo-1733057586164-6f9ab1062e7a${FEATURED_BASE}`,
    alt: "Vista aérea de uma praia e do oceano",
  },
];

export const SITE_CONTENT = {
  hero: {
    title: "Sua viagem no Nordeste começa aqui",
    subtitle: "Deixa eu te ajudar a montar o seu roteiro perfeito!",
    searchPlaceholder: "Como eu posso te ajudar?",
  },
  featured: {
    title: "Não sabe por onde começar?",
    slides: FEATURED_SLIDES,
    cta: "Conversar com Agente de IA",
  },
  coupon: {
    headline: "8% de desconto",
    rest: " nos seus passeios",
    code: "Use o cupom HUAN10",
  },
};
