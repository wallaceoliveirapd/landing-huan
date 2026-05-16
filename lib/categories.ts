import type { IconName } from "@/components/atoms/Icon";

const HERO_BASE = "?auto=format&fit=crop&q=80&w=1400";
const heroes = {
  praiaAerea: `https://images.unsplash.com/photo-1733057424920-7cf49b177b79${HERO_BASE}`,
  praiaOceano: `https://images.unsplash.com/photo-1732216467230-42ce323767a8${HERO_BASE}`,
  cidadeLitoral: `https://images.unsplash.com/photo-1732217164523-d147e04babaf${HERO_BASE}`,
  edificioTorre: `https://images.unsplash.com/photo-1657321668786-9211f804d8c3${HERO_BASE}`,
  praiaArenosa: `https://images.unsplash.com/photo-1733057586164-6f9ab1062e7a${HERO_BASE}`,
} as const;

export type Category = {
  key: string;
  label: string;
  href: string;
  image?: string;
  icon?: IconName;
  description: string;
  /** Imagem hero da página interna (full-bleed) */
  heroImage: string;
  /** Subtítulo curto exibido no hero da página interna */
  heroSubtitle: string;
  /** true = aparece na home; false = só no bottom sheet "Ver tudo" */
  primary: boolean;
};

export const CATEGORIES: Category[] = [
  {
    key: "praias",
    label: "Praias",
    href: "/praias",
    icon: "lucide:waves",
    description: "Guia por praia: Cabo Branco, Tambaú, Jacaré, Coqueirinho e mais.",
    heroImage: heroes.praiaArenosa,
    heroSubtitle:
      "Cabo Branco, Tambaú, Manaíra, Bessa, Jacaré, Tabatinga, Coqueirinho e Tambaba — cada uma com sua vibe.",
    primary: true,
  },
  {
    key: "restaurantes",
    label: "Restaurantes",
    href: "/restaurantes",
    image: "/images/category/restaurante.png",
    icon: "lucide:utensils",
    description: "Os principais lugares para comer em João Pessoa.",
    heroImage: heroes.edificioTorre,
    heroSubtitle:
      "Os lugares onde a gente come — frutos do mar, comida regional, cuscuz autêntico e algumas surpresas.",
    primary: true,
  },
  {
    key: "cupons",
    label: "Cupons",
    href: "/cupons",
    icon: "lucide:ticket-percent",
    description: "Cupons e ofertas dos nossos parceiros.",
    heroImage: heroes.praiaOceano,
    heroSubtitle:
      "Cupons e descontos dos nossos parceiros para você economizar mais na sua viagem.",
    primary: true,
  },
  {
    key: "passeios",
    label: "Passeios",
    href: "/passeios",
    image: "/images/category/tickets.png",
    icon: "lucide:ticket",
    description: "Tours, passeios de barco, buggy e roteiros guiados.",
    heroImage: heroes.praiaAerea,
    heroSubtitle:
      "Tours, buggy, catamarã e roteiros guiados — selecionados a dedo.",
    primary: false,
  },
  {
    key: "dicas",
    label: "Dicas",
    href: "/dicas",
    image: "/images/category/dicas.png",
    icon: "lucide:lightbulb",
    description: "Conteúdo curado por IA todos os dias.",
    heroImage: heroes.cidadeLitoral,
    heroSubtitle:
      "Conteúdo curado todos os dias — viagem em geral, novidades em João Pessoa e o que está rolando agora.",
    primary: false,
  },
  {
    key: "vida-noturna",
    label: "Vida noturna",
    href: "/vida-noturna",
    icon: "lucide:martini",
    description: "Bares, casas de shows e baladas.",
    heroImage: heroes.cidadeLitoral,
    heroSubtitle:
      "Bares, casas de shows, baladas e o melhor da boemia pessoense.",
    primary: false,
  },
  {
    key: "roteiros",
    label: "Roteiros prontos",
    href: "/roteiros",
    icon: "lucide:map",
    description: "Itinerários de 1, 3 e 7 dias para curtir sem planejar.",
    heroImage: heroes.praiaOceano,
    heroSubtitle:
      "Itinerários de 1, 3 e 7 dias para curtir João Pessoa sem ficar planejando hora por hora.",
    primary: false,
  },
  {
    key: "hospedagem",
    label: "Hospedagem",
    href: "/hospedagem",
    icon: "lucide:bed-double",
    description: "Pousadas e hotéis recomendados, com links direto pra reserva.",
    heroImage: heroes.edificioTorre,
    heroSubtitle:
      "Pousadas e hotéis recomendados, com links diretos para reserva via parceiros.",
    primary: false,
  },
];

export const PRIMARY_CATEGORIES = CATEGORIES.filter((c) => c.primary);
export const SECONDARY_CATEGORIES = CATEGORIES.filter((c) => !c.primary);
