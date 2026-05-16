import { internalMutation } from "./_generated/server";

/**
 * Seed inicial do banco.
 * Rodar com: ./node_modules/.bin/convex run seed:run
 */
export const run = internalMutation({
  handler: async (ctx) => {
    // Limpa tudo antes
    for (const table of [
      "tours",
      "restaurants",
      "dicas",
      "praias",
      "nightlife",
      "itineraries",
      "hosting",
      "siteContent",
    ] as const) {
      const docs = await ctx.db.query(table).collect();
      await Promise.all(docs.map((d) => ctx.db.delete(d._id)));
    }

    // ── Tours ───────────────────────────────────────────────────
    const t1 = await ctx.db.insert("tours", {
      title: "Passeio de Catamarã",
      slug: "passeio-de-catamara",
      description:
        "Navegue pelas belas águas do litoral norte de João Pessoa, passando por Picãozinho e Areia Vermelha. Inclui snorkel, frutas e bebidas a bordo.",
      shortDesc: "Navegação pelas piscinas naturais de Picãozinho e Areia Vermelha.",
      price: 180,
      originalPrice: 220,
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
      duration: "4 horas",
      rating: 4.9,
      reviewCount: 347,
      url: "https://www.civitatis.com/br/joao-pessoa/passeio-catamara/",
      tags: ["mar", "natureza", "família", "snorkel"],
      featured: true,
      active: true,
      order: 1,
    });

    const t2 = await ctx.db.insert("tours", {
      title: "City Tour Histórico",
      slug: "city-tour-historico",
      description:
        "Conheça o centro histórico de João Pessoa, a segunda cidade mais antiga do Brasil. Visite o Mosteiro de São Bento, a Catedral Basílica e o Ponto de Turismo.",
      shortDesc: "Tour completo pelo centro histórico e pontos icônicos da cidade.",
      price: 120,
      originalPrice: 150,
      image:
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80",
      duration: "6 horas",
      rating: 4.7,
      reviewCount: 189,
      url: "https://www.civitatis.com/br/joao-pessoa/",
      tags: ["história", "cultura", "centro"],
      featured: true,
      active: true,
      order: 2,
    });

    const t3 = await ctx.db.insert("tours", {
      title: "Pôr do Sol em Jacaré",
      slug: "por-do-sol-jacara",
      description:
        "Assista ao famoso pôr do sol no Rio Paraíba ao som do Bolero de Ravel, considerado um dos 10 mais bonitos do mundo. Passeio de barco pelo rio Jacaré.",
      shortDesc: "O pôr do sol ao som do Bolero de Ravel no Rio Jacaré.",
      price: 90,
      image:
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80",
      duration: "2 horas",
      rating: 4.8,
      reviewCount: 512,
      url: "https://www.civitatis.com/br/joao-pessoa/passeio-por-do-sol-jacara/",
      tags: ["pôr do sol", "barco", "rio", "romântico"],
      featured: true,
      active: true,
      order: 3,
    });

    await ctx.db.insert("tours", {
      title: "Trilha das Falésias de Cabo Branco",
      slug: "trilha-falesias-cabo-branco",
      description:
        "Caminhada guiada pelo Parque Natural Municipal das Timbaúbas, passando pelas falésias do Cabo Branco — o ponto mais oriental das Américas.",
      shortDesc: "Caminhada nas falésias do ponto mais a leste das Américas.",
      price: 75,
      image:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
      duration: "3 horas",
      rating: 4.6,
      reviewCount: 98,
      url: "https://www.civitatis.com/br/joao-pessoa/",
      tags: ["trilha", "natureza", "esporte"],
      featured: false,
      active: true,
      order: 4,
    });

    // ── Restaurants ─────────────────────────────────────────────
    await ctx.db.insert("restaurants", {
      name: "Mangai João Pessoa",
      slug: "mangai-joao-pessoa",
      description:
        "Um dos restaurantes mais famosos do Nordeste, o Mangai oferece um self-service de comida típica nordestina com mais de 100 pratos. Ambiente charmoso com decoração regional.",
      shortDesc: "Self-service nordestino com mais de 100 pratos típicos.",
      cuisine: "Nordestino",
      priceRange: "$$",
      image:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
      photos: [
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
      ],
      rating: 4.8,
      reviewCount: 2341,
      address: "Av. Gen. Edson Ramalho, 696 - Manaíra",
      phone: "(83) 3226-1615",
      instagram: "@mangaijoaopessoa",
      hours: [
        { day: "Segunda–Sexta", open: "11:00", close: "15:30" },
        { day: "Sábado–Domingo", open: "11:00", close: "16:00" },
      ],
      tags: ["nordestino", "regional", "almoço", "família"],
      featured: true,
      active: true,
      order: 1,
    });

    await ctx.db.insert("restaurants", {
      name: "Restaurante do Mercado",
      slug: "restaurante-do-mercado",
      description:
        "Frutos do mar fresquíssimos no coração do mercado de peixe de João Pessoa. Os melhores camarões e lagostas da Paraíba, preparados na hora.",
      shortDesc: "Frutos do mar frescos no melhor mercado de peixe da cidade.",
      cuisine: "Frutos do Mar",
      priceRange: "$$",
      image:
        "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      photos: [],
      rating: 4.6,
      reviewCount: 876,
      address: "Mercado Central, R. Maciel Pinheiro - Centro",
      hours: [
        { day: "Segunda–Sábado", open: "10:00", close: "18:00" },
        { day: "Domingo", open: "10:00", close: "15:00" },
      ],
      tags: ["frutos do mar", "peixe", "almoço"],
      featured: true,
      active: true,
      order: 2,
    });

    // ── Dicas ────────────────────────────────────────────────────
    await ctx.db.insert("dicas", {
      title: "Melhores praias para família em João Pessoa",
      slug: "melhores-praias-familia",
      excerpt:
        "Descubra quais praias têm infraestrutura, águas calmas e são ideais para levar as crianças. Dica: Praia de Tambaú e Manaíra são as favoritas!",
      content: `# Melhores praias para família em João Pessoa

João Pessoa tem um litoral de 24km com praias para todos os gostos. Para quem viaja com crianças, as melhores opções são:

## Praia de Tambaú
A praia mais famosa da cidade, com ampla infraestrutura, barracas, quiosques e o famoso calçadão. Ótima para iniciantes no mar nordestino.

## Praia de Manaíra
Menos movimentada que Tambaú, com águas calmas e muitas opções de comida nas proximidades.

## Praia do Bessa
Mais tranquila, com piscinas naturais formadas pelas pedras na maré baixa. Perfeita para snorkel com crianças.

**Dica:** Vá sempre de manhã cedo para pegar as piscinas naturais com a maré baixa!`,
      cover:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      category: "dica",
      tags: ["praias", "família", "crianças"],
      publishedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      featured: true,
      active: true,
      source: "manual",
    });

    await ctx.db.insert("dicas", {
      title: "O que comer em João Pessoa: guia completo",
      slug: "o-que-comer-joao-pessoa",
      excerpt:
        "De tapiocas na praia a frutos do mar frescos: um guia definitivo da gastronomia paraibana para quem visita pela primeira vez.",
      content: `# O que comer em João Pessoa

A culinária paraibana é um patrimônio à parte. Aqui está o que você não pode deixar de provar:

## Tapioca
Onipresente no café da manhã nordestino, a tapioca em JP é especialmente famosa na orla. Experimente com coalho e mel de engenho.

## Sururu ao leite de coco
Prato típico da região, o sururu (molusco) preparado com leite de coco é uma experiência gastronômica única.

## Camarão
Fresquíssimo e barato. O preço cai pela metade comparado ao Sudeste do país.

## Onde comer
- **Mangai**: para comida regional (self-service incrível)
- **Tambaú Food Park**: vários food trucks na orla
- **Mercado de Peixe**: frutos do mar diretamente dos pescadores`,
      cover:
        "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
      category: "dica",
      tags: ["gastronomia", "comida", "nordestino"],
      publishedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      featured: true,
      active: true,
      source: "manual",
    });

    // ── Praias ───────────────────────────────────────────────────
    await ctx.db.insert("praias", {
      name: "Praia de Tambaú",
      slug: "praia-de-tambau",
      description:
        "A praia mais famosa de João Pessoa, com ampla infraestrutura turística, calçadão, quiosques e fácil acesso a hotéis e restaurantes.",
      shortDesc: "A praia mais famosa de JP, com tudo perto.",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
      photos: [],
      location: "Tambaú, João Pessoa - PB",
      features: ["Infraestrutura completa", "Calçadão", "Barracas"],
      featured: true,
      active: true,
      order: 1,
    });

    await ctx.db.insert("praias", {
      name: "Praia de Cabo Branco",
      slug: "praia-de-cabo-branco",
      description:
        "Ao lado das famosas falésias alaranjadas do Cabo Branco, ponto mais oriental das Américas. Uma praia espetacular para fotos ao amanhecer.",
      shortDesc: "Falésias espetaculares e o nascer do sol mais bonito do Brasil.",
      image:
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
      photos: [],
      location: "Cabo Branco, João Pessoa - PB",
      features: ["Falésias", "Nascer do sol", "Ponto mais oriental"],
      featured: true,
      active: true,
      order: 2,
    });

    // ── Itineraries ──────────────────────────────────────────────
    await ctx.db.insert("itineraries", {
      title: "1 dia clássico em João Pessoa",
      slug: "1-dia-classico",
      subtitle:
        "Um dia intenso para quem tem pouco tempo: praias, história e o pôr do sol mais bonito do Nordeste.",
      durationDays: 1,
      cover:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      days: [
        {
          day: 1,
          title: "Praias + Centro Histórico + Jacaré",
          description: "O melhor de JP em um único dia.",
          stops: [
            { type: "tour", tourId: String(t1) },
            { type: "place", name: "Almoço no Mangai", address: "Av. Gen. Edson Ramalho, 696 - Manaíra", time: "12:30" },
            { type: "tour", tourId: String(t3) },
          ],
        },
      ],
      featured: true,
      active: true,
      order: 1,
    });

    await ctx.db.insert("itineraries", {
      title: "3 dias no litoral paraibano",
      slug: "3-dias-litoral",
      subtitle:
        "Praias do sul ao norte: Cabo Branco, Tambaú, Intermares e as piscinas naturais de Picãozinho.",
      durationDays: 3,
      cover:
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
      days: [
        {
          day: 1,
          title: "Chegada + Orla de Tambaú",
          description: "Check-in, passeio na orla e jantar de frutos do mar.",
          stops: [
            { type: "place", name: "Check-in na pousada", address: "Tambaú, JP", time: "14:00" },
            { type: "place", name: "Calçadão de Tambaú", address: "Av. Almirante Tamandaré, Tambaú", time: "17:00" },
          ],
        },
        {
          day: 2,
          title: "Piscinas naturais + Cabo Branco",
          description: "Manhã nas piscinas, tarde nas falésias do Cabo Branco.",
          stops: [
            { type: "tour", tourId: String(t1) },
            { type: "place", name: "Falésia do Cabo Branco", address: "Cabo Branco, JP", time: "16:00" },
          ],
        },
        {
          day: 3,
          title: "City Tour + Pôr do Sol",
          description: "Centro histórico de manhã, Jacaré ao entardecer.",
          stops: [
            { type: "tour", tourId: String(t2) },
            { type: "tour", tourId: String(t3) },
          ],
        },
      ],
      featured: true,
      active: true,
      order: 2,
    });

    // ── Site Content ─────────────────────────────────────────────
    const siteDefaults = [
      { key: "hero_title", value: "Tá vindo pra João Pessoa?" },
      { key: "hero_subtitle", value: "A gente te conta o que vale a pena." },
      {
        key: "coupon_code",
        value: "HUAN10",
      },
      {
        key: "coupon_description",
        value: "10% OFF nos passeios selecionados",
      },
      {
        key: "featured_title",
        value: "Não sabe por onde começar?",
      },
      {
        key: "featured_subtitle",
        value: "O NordestAI te ajuda a montar o roteiro perfeito.",
      },
    ];

    for (const { key, value } of siteDefaults) {
      await ctx.db.insert("siteContent", { key, value, updatedAt: Date.now() });
    }

    console.log("✅ Seed concluído!");
  },
});
