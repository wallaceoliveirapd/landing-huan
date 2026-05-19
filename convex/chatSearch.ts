import { v } from "convex/values";
import { query } from "./_generated/server";
import { matchesCity } from "./cityFilter";

// ─── Tokenization + scoring helpers ────────────────────────────────────────

/** Strip accents and lowercase: "Catamarã" → "catamara". */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Stopwords we ignore when tokenizing, they pollute the match. */
const STOPWORDS = new Set([
  // Artigos e Pronomes Básicos
  "a", "o", "as", "os", "um", "uma", "uns", "umas",
  "este", "esta", "estes", "estas", "esse", "essa", "esses", "essas",
  "aquele", "aquela", "aqueles", "aquelas", "isto", "isso", "aquilo",
  "meu", "minha", "meus", "minhas", "seu", "sua", "seus", "suas",

  // Preposições e Conjunções Coloquiais
  "de", "do", "da", "dos", "das", "no", "na", "nos", "nas",
  "em", "por", "para", "pra", "pro", "pras", "pros", "com", "sem",
  "ou", "e", "que", "com", "pelo", "pela", "pelos", "pelas", "ate", "num", "numa",

  // Verbos de Ligação e Auxiliares
  "é", "sao", "ser", "estar", "ter", "ha", "tem", "vai", "vou", "fui",
  "esta", "estao", "tinham", "tinha", "fazer", "ir",

  // Verbos de Desejo/Ação do Usuário (Poluição de Input)
  "quero", "queria", "preciso", "procuro", "buscar", "ver", "olhar",
  "encontrar", "achar", "gostaria", "indica", "indique", "sugerir", "mostra", "mostre",
  "diga", "sabem", "sabe", "conhecer", "recomenda",

  // Quantificadores e Pronomes Indefinidos
  "todas", "todos", "tudo", "mais", "menos", "algum", "alguma", "alguns", "algumas",
  "nenhum", "nenhuma", "bastante", "muito", "muita", "muitos", "muitas", "tanto", "tanta",
  "demais", "pouco", "pouca", "cada", "outro", "outra", "outros", "outras",

  // Interrogações e Advérbios de Tempo/Lugar
  "qual", "quais", "quando", "onde", "porque", "por que", "porquê", "como", "agora",
  "aqui", "ali", "la", "hoje", "amanha", "ontem", "perto", "longe",

  // Adjetivos de Opinião/Filtros Subjetivos (Inúteis para Scoring de Tags Fatais)
  "principais", "melhores", "melhor", "otimas", "otima", "boas", "boa", "bonito",
  "bonita", "lindas", "linda", "lindos", "lindos", "perfeito", "perfeita", "legal",
  "top", "massa", "maravilhoso", "maravilhosa", "famoso", "famosa", "famosos", "incrivel",
  "ruim", "pior", "piores", "barato", "barata", "caro", "cara"
]);

/**
 * "Generic" category words, they describe the CATEGORY of thing the user
 * wants (already detected via INTENT rules) but are NOT useful for scoring
 * within the category. e.g. "passeio" matches every single tour title;
 * the discriminating word is "barco" / "catamarã" / "buggy" etc.
 *
 * These tokens stay in the tokenized list so they can be detected, but
 * scoring gives them weight 0 (i.e. they don't help nor hurt).
 */
/**
 * "Generic" category words, they describe the CATEGORY of thing the user
 * wants (already detected via INTENT rules) but are NOT useful for scoring
 * within the category. e.g. "passeio" matches every single tour title;
 * the discriminating word is "barco" / "catamarã" / "buggy" etc.
 *
 * These tokens stay in the tokenized list so they can be detected, but
 * scoring gives them weight 0 (i.e. they don't help nor hurt).
 */
const GENERIC_CATEGORY_TOKENS = new Set([
  // --- Turismo e Lazer ---
  "passeio", "passeios", "tour", "tours", "atividade", "atividades",
  "atracao", "atracoes", "roteiro", "roteiros", "destino", "destinos",
  "ponto-turistico", "pontos-turisticos", "excursao", "excursoes",

  // --- Gastronomia e Bares ---
  "restaurante", "restaurantes", "comer", "comida", "comidas", "culinaria",
  "almoço", "jantar", "gastronomia", "bar", "bares", "balada", "baladas",
  "show", "shows", "quiosque", "quiosques", "barraca", "barracas",

  // --- Destinos e Locais ---
  "lugar", "lugares", "praia", "praias", "costa", "litoral", "orla",
  "cidade", "cidades", "vila", "vilas", "regiao", "regioes",

  // --- Hospedagem ---
  "hospedagem", "hospedagens", "hotel", "hoteis", "pousada", "pousadas",
  "resort", "resorts", "aluguel", "hostel", "hostels", "airbnb",

  // --- Comercial e Vantagens ---
  "cupom", "cupons", "desconto", "descontos", "oferta", "ofertas",
  "promocao", "promocoes", "dica", "dicas", "recomendacao", "recomendacoes"
]);

/**
 * Synonyms, keys are normalized tokens, values are extra tokens.
 * IMPORTANT: keep these tight. Don't expand specific things ("barco")
 * to generic categories ("passeio"), that pollutes results.
 */
const SYNONYMS: Record<string, string[]> = {
  // --- TRANSPORTE E PASSEIOS MARÍTIMOS (MANTIDO E EXPANDIDO) ---
  barco: ["catamara", "lancha", "veleiro", "navio", "jangada", "escuna", "chalana", "embarcacao", "maritimo", "travessea", "passeio-de-barco", "marinheiro", "balsa", "canoa", "flutuante"],
  catamara: ["barco", "lancha", "veleiro", "escuna", "passeio-de-barco", "catamara-nordeste"],
  lancha: ["barco", "catamara", "voadeira", "jet-ski", "passeio-de-lancha", "marinheiro", "iate"],
  veleiro: ["barco", "velejar", "catamara", "monocasco", "veleirismo"],
  jangada: ["barco", "passeio-de-jangada", "rustico", "pescador", "jangadeiro", "vela-de-jangada"],

  // --- GASTRONOMIA E ALIMENTAÇÃO (MANTIDO E MASSIVAMENTE EXPANDIDO) ---
  comer: ["restaurante", "comida", "gastronomia", "culinaria", "almoco", "jantar", "cardapio", "tapiocaria", "petisco", "frutos-do-mar", "comer-bem", "onde-comer", "pizzaria", "hamburgueria", "toca-do-caranguejo", "creperia", "pastelaria"],
  comida: ["restaurante", "comer", "culinaria", "gastronomia", "alimento", "refeicao", "prato-feito", "alimentacao", "buffet", "self-service"],
  restaurante: ["comer", "comida", "gastronomia", "culinaria", "polo-gastronomico", "bar-de-praia", "quiosque", "barraca", "bistrô", "chiringuito", "pizzaria", "churrascaria"],
  gastronomia: ["culinaria", "restaurante", "chef", "cardapio", "gastronomia-local", "gastronomia-refinada", "cozinha-baiana", "cozinha-nordestina", "gourmet", "alta-gastronomia"],
  "frutos-do-mar": ["peixe", "camarao", "lagosta", "caranguejo", "caranguejada", "marisco", "ostra", "moqueca", "siri", "caldeirada", "paella", "polvo", "lula", "peixe-frito", "isca-de-peixe", "chora-menino"],
  "culinaria-local": ["tapioca", "acaraje", "beiju", "cuscuz", "carne-de-sol", "macaxeira", "mandioca", "baiao-de-dois", "queijo-coalho", "caldinho", "agua-de-coco"],

  // --- ENTRETENIMENTO, VIDA NOTURNA E AGITO (MANTIDO E EXPANDIDO) ---
  noite: ["bar", "balada", "show", "vida-noturna", "baladinha", "luau", "musica-ao-vivo", "dj", "festa", "agito", "badalada", "noitada", "curtição", "onde-ir-a-noite", "pub", "balada-sertaneja", "forrozo"],
  bar: ["boteco", "pub", "quiosque", "barraca", "drinks", "cerveja", "chopp", "coquetel", "badalada", "botequim", "caipirinha", "cachaçaria", "gintoneria"],
  balada: ["festa", "night", "noite", "agito", "jovem", "badalada", "vida-noturna", "luau", "rave", "sunset-party", "clubber", "fervo", "resenha"],
  show: ["musica-ao-vivo", "concerto", "evento", "forro", "reggae", "mpb", "banda", "axé", "samba", "pagode", "sertanejo", "festa-junina", "sao-joao"],

  // --- HOSPEDAGEM E ACOMODAÇÃO (MANTIDO E EXPANDIDO) ---
  hospedagem: ["hotel", "pousada", "airbnb", "hostel", "resort", "aluguel-por-temporada", "quarto", "estadia", "chale", "camping", "albergue", "onde-ficar", "glamping", "flat", "casa-de-praia", "acomodacao"],
  hotel: ["pousada", "hospedagem", "resort", "estadia", "acomodacao", "quarto-de-hotel", "hoteis"],
  pousada: ["hotel", "hospedagem", "pousadas-charmosas", "pousada-boutique", "chale", "estadia", "rustico", "pousadinhas", "estalagem"],
  resort: ["hotel", "all-inclusive", "hospedagem-de-luxo", "infraestrutura-completa", "hotel-fazenda", "spa", "resorts", "tudo-incluido", "cinco-estrelas"],

  // --- BENEFÍCIOS E PROMOÇÕES (MANTIDO) ---
  cupom: ["desconto", "oferta", "promocao", "voucher", "barato", "gratis", "off", "codigo", "descontao", "cupom-promocional"],
  desconto: ["cupom", "oferta", "promocao", "liquidacao", "abaixou", "preço-baixo", "economizar", "poupanca", "mais-barato"],
  promocao: ["cupom", "desconto", "oferta", "combo", "especial", "imperdivel", "bota-fora", "saldão"],

  // --- AVENTURA, VEÍCULOS E PASSEIOS EM TERRA (MANTIDO E EXPANDIDO) ---
  buggy: ["dunas", "areia", "passeio-de-buggy", "4x4", "quadriciclo", "offroad", "com-emocao", "aventura", "bugueiro", "bugi", "passeio-de-bugue"],
  quadriciclo: ["buggy", "4x4", "offroad", "passeio", "moto", "aventura", "aluguel-de-quadriciclo", "atv", "quadri"],
  trilha: ["ecologica", "natureza", "caminhada", "trekking", "hiking", "acesso-por-trilha", "ecoturismo", "reserva", "caminhar", "trekking-nordeste", "exploracao"],

  // --- ESPORTES AQUÁTICOS E MERGULHO (MANTIDO E EXPANDIDO) ---
  mergulho: ["snorkel", "scuba", "mergulhar", "subaquatico", "vida-marinha", "corais", "recifes", "mergulho-com-snorkel", "batismo", "cilindro", "apneia"],
  snorkel: ["mergulho", "mascara-de-mergulho", "aguas-cristalinas", "peixinhos", "piscinas-naturais", "snorkeling", "peixes-coloridos"],
  surf: ["surfando", "prancha", "ondas", "mar-aberto", "pico-de-surf", "bodyboard", "surfe", "surfista", "ondas-grandes", "escolinha-de-surf"],
  kitesurf: ["kite", "windsurf", "velejar", "vento", "ventos-fortes", "esportes-aquaticos", "prancha-a-vela", "downwind", "kiteboard", "kiter", "velejador", "escola-de-kite"],
  "stand-up-paddle": ["sup", "remar", "prancha-com-remo", "mar-calmo", "caiaque", "esportes-aquaticos", "paddleboard", "remada"],

  // --- CARACTERÍSTICAS DA PRAIA (ESTADO DO MAR E NATUREZA) (MANTIDO E EXPANDIDO) ---
  "mar-calmo": ["mar-manso", "sem-ondas", "piscina", "lagoa", "raso", "mar-raso", "aguas-calmas", "protegido-por-recifes", "piscininha", "flat", "espelho-d-agua", "mar-parado"],
  "mar-aberto": ["mar-forte", "ondas", "agitado", "fundo", "correnteza", "surf", "mar-bravo", "repuxo", "mar-grosso", "ondas-fortes"],
  "aguas-cristalinas": ["agua-limpa", "transparente", "azul-turquesa", "verde-esmeralda", "caribe", "translúcida", "visibilidade", "caribe-brasileiro", "agua-transparente", "sem-algas"],
  "praia-deserta": ["isolada", "selvagem", "intocada", "afastada", "vazia", "pouca-gente", "escondida", "paraiso-escondido", "sossego", "sossegada", "desabitada", "paz-e-amor", "roots"],
  falesias: ["paredoes", "barreiras", "areias-coloridas", "morro-de-areia", "escarpas", "rochas", "barreiras-de-argila", "falesia"],
  dunas: ["montanhas-de-areia", "areia-branca", "passeio-de-buggy", "esquibunda", "tirolesa", "pôr-do-sol", "morro-de-areia", "lençois"],
  "encontro-com-rio": ["foz", "rio", "agua-doce", "lagoa", "barra", "manguezal", "desaguar", "banho-de-rio", "encontro-do-rio", "rio-e-mar"],

  // --- COMPORTAMENTO, PÚBLICO E PERFIL (MANTIDO E ULTRA-EXPANDIDO) ---
  "ideal-para-familias": ["criancas", "idosos", "bebes", "seguro", "raso", "familiar", "tranquilo", "playground", "fraldario", "vovo", "com-criancas", "criancada", "ambiente-familiar", "rasinho"],
  sossego: ["paz", "tranquilidade", "relaxar", "descanso", "silencio", "calmaria", "desconectar", "privacidade", "relax", "calmo", "sossegado", "zen", "meditacao", "slow-travel"],
  badalada: ["vibrante", "movimentada", "cheia", "point", "famosa", "agitada", "turistica", "lotada", "popular", "muvuca", "agito", "pipoco", "famosinha", "hype", "bombando", "top", "massa"],
  "beach-club": ["clube-de-praia", "lounge", "estrutura-vip", "sofisticada", "pe-na-areia", "bar-de-luxo", "bangalo", "beachclub", "day-use", "exclusive", "camarote"],
  "turismo-sustentavel": ["ecologico", "preservado", "natureza-preservada", "projeto-tamar", "ecoturismo", "consciente", "reserva-ambiental", "preservacao", "sustentabilidade", "parque-nacional", "reserva-ecologica"],
  "orla-urbana": ["cidade", "calcadao", "avenida-litoranea", "ciclovia", "urbana", "central", "proximo-ao-centro", "avenida-beira-mar", "orla"],
  "perfil-romantico": ["casal", "casais", "lua-de-mel", "namorados", "romance", "romantico", "casamento", "bodas", "viagem-a-dois", "intimista"],
  instagramavel: ["fotos", "fotografia", "lindo", "cenario", "vista", "mirante", "cartao-postal", "tumblr", "aesthetic", "blogueira", "selfie", "drone", "visual-incrivel"],

  // --- INFRAESTRUTURA E COMODIDADES (MANTIDO E NOVO) ---
  "infraestrutura-completa": ["barracas", "banheiros", "chuveiro", "ducha", "restaurantes", "cadeiras", "guarda-sol", "atendimento", "serviço-de-praia", "bucha", "sombreiro", "garçom", "wi-fi", "internet", "estrutura", "comercio"],
  acessivel: ["rampa", "cadeirante", "acessibilidade", "facil-acesso", "estacionamento-proximo", "passarela", "pcd", "idoso-acesso"],
  estacionamento: ["vaga", "estacionar", "garagem", "parcar", "carro", "flanelinha", "seguro", "estacionamento-privado", "valet", "onde-parar"],
  "pôr-do-sol": ["entardecer", "fim-da-tarde", "sunset", "crepusculo", "mirante", "por-do-sol", "anoitecer", "golden-hour"],
  petfriendly: ["cachorro", "gato", "animais", "pet", "pets", "levar-cachorro", "animal-de-estimacao", "aceita-pet"],
  "maré-baixa": ["tabua-de-mares", "mare-0.0", "mare-baixa", "mare-secando", "mare-morta", "piscina-natural-maré"],

  // --- CORREÇÃO DE TYPOS REGIONAIS E ESTADOS DO NORDESTE (PROTETORES DE UX) ---
  alagoas: ["al", "alagoano", "alagoana", "alagoas-al", "maceio", "maragogi", "milagres"],
  maceio: ["maceió", "maceio-al", "pajuçara", "ponta-verde", "jatiúca", "ipioca", "garça-torta", "pratagy"],
  maragogi: ["maragoji", "antunes", "barra-grande", "gales", "maragogi-al", "peroba", "burgalhau"],
  milagres: ["sao-miguel-dos-milagres", "rota-dos-milagres", "praia-do-toque", "porto-de-pedras", "patacho", "lajes", "tatuamunha"],

  sergipe: ["se", "sergipano", "sergipana", "sergipe-se", "aracaju", "estancia", "pirambu"],
  aracaju: ["aracajú", "aracaju-se", "atalaia", "aruana", "mosqueiro", "robalo", "passarela-do-caranguejo"],
  estancia: ["estância", "praia-do-saco", "abais", "lagoa-dos-tambaquis", "ilhadasogra"],

  bahia: ["ba", "baiano", "baiana", "bahia-ba", "salvador", "trancoso", "porto-seguro", "itacare"],
  salvador: ["salvador-ba", "porto-da-barra", "stella-maris", "farol-da-barra", "itapuã", "ondina", "rio-vermelho"],
  trancoso: ["quadrado", "praia-dos-coqueiros", "praia-dos-nativos", "espelho", "trancoso-ba", "itapororoca", "rio-verde"],
  "porto-seguro": ["porto-seguro-ba", "arraial-d-ajuda", "pitinga", "mucugê", "taperapuan", "mutá", "caraíva"],
  itacare: ["itacaré", "itacare-ba", "engenhoca", "itacarezinho", "resende", "tiririca", "jeribucaçu"],

  ceara: ["ce", "cearense", "ceara-ce", "fortaleza", "jeri", "canoa-quebrada"],
  fortaleza: ["fortaleza-ce", "praia-do-futuro", "meireles", "iracema", "mucuripe", "sabiaguaba"],
  jericoacoara: ["jeri", "jericoacoara-ce", "jijoca", "lagoa-do-paraiso", "malhada", "pedra-furada", "preá"],
  "canoa-quebrada": ["canoa", "canoa-quebrada-ce", "aracati", "falesias-canoa"],

  paraiba: ["pb", "paraíba", "paraibano", "paraibana", "paraiba-pb", "joao-pessoa", "jampa", "conde"],
  "joao-pessoa": ["joão-pessoa", "jampa", "joao-pessoa-pb", "tambaú", "cabo-branco", "bessa", "manaíra", "ponta-do-seixas", "caribessa"],
  conde: ["conde-pb", "coqueirinho", "tambaba", "praia-do-amor", "tabatinga", "carapibus"],
  cabedelo: ["cabedelo-pb", "intermares", "camboinha", "ponta-de-campina", "ilha-de-areia-vermelha", "por-do-sol-jacare"],

  "rio-grande-do-norte": ["rn", "potiguar", "rio-grande-do-norte-rn", "natal", "pipa", "sao-miguel-do-gostoso"],
  natal: ["natal-rn", "ponta-negra", "morro-do-careca", "praia-dos-artistas", "via-costeira"],
  pipa: ["praia-da-pipa", "tibau-do-sul", "praia-do-amor", "baia-dos-golfinhos", "madeiro", "pipa-rn"],
  "sao-miguel-do-gostoso": ["gostoso", "são-miguel-do-gostoso", "gostoso-rn", "ponta-do-santo-cristo", "tourinhos"],

  pernambuco: ["pe", "pernambucano", "pernambucana", "pernambuco-pe", "recife", "porto-de-galinhas", "noronha"],
  recife: ["recife-pe", "boa-viagem", "pina", "piedade"],
  "porto-de-galinhas": ["porto", "porto-de-galinhas-pe", "ipojuca", "maracaípe", "muro-alto", "cupe"],
  "fernando-de-noronha": ["noronha", "fernando-de-noronha-pe", "sancho", "baia-do-sancho", "porcos", "cacimba-do-padre"],

  maranhao: ["ma", "maranhense", "maranhao-ma", "sao-luis", "barreirinhas", "lencois-maranhenses"],
  "sao-luis": ["são-luís", "sao-luis-ma", "calhau", "ponta-d-areia", "olho-d-agua", "litoranea"],
  barreirinhas: ["lencois", "lençóis-maranhenses", "barreirinhas-ma", "atins", "lagoa-azul", "lagoa-bonita"],

  piaui: ["pi", "piauiense", "piaui-pi", "parnaiba", "barra-grande-pi"],
  parnaiba: ["parnaíba", "parnaiba-pi", "delta-do-parnaiba", "pedra-do-sal"],
  "barra-grande-pi": ["barra-grande", "bg", "cajueiro-da-praia", "barra-grande-piaui"]
};

function tokenize(s: string): string[] {
  const tokens = norm(s)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

  // Expand with synonyms
  const expanded = new Set<string>(tokens);
  for (const t of tokens) {
    (SYNONYMS[t] ?? []).forEach((syn) => expanded.add(syn));
  }
  return [...expanded];
}

/**
 * Count token matches inside a haystack. Generic category tokens
 * (e.g. "passeio", "restaurante") count 0, they describe the category
 * already and would otherwise match every item in that category.
 */
function scoreMatch(haystack: string, tokens: string[]): number {
  const h = norm(haystack);
  let score = 0;
  for (const t of tokens) {
    if (GENERIC_CATEGORY_TOKENS.has(t)) continue;
    if (h.includes(t)) score += 1;
  }
  return score;
}

/**
 * Score an item against the query tokens. Title matches weigh more than
 * description, and tags. Returns 0 if no SPECIFIC token (non-generic)
 * matched anywhere, prevents "passeio de barco" from matching every
 * tour titled "Passeio de …".
 */
function scoreItem(
  item: {
    title?: string;
    name?: string;
    description?: string;
    shortDesc?: string;
    excerpt?: string;
    subtitle?: string;
    tags?: string[];
    features?: string[];
    cuisine?: string;
    type?: string;
  },
  tokens: string[],
): number {
  if (tokens.length === 0) return 1; // empty query, return everything

  // Bail early if there are no SPECIFIC tokens, we can't discriminate.
  // (Caller falls back to "browse-by-type" in that case.)
  const specific = tokens.filter((t) => !GENERIC_CATEGORY_TOKENS.has(t));
  if (specific.length === 0) return 0;

  const titleScore = scoreMatch(
    item.title ?? item.name ?? item.subtitle ?? "",
    tokens,
  );
  const descScore = scoreMatch(
    `${item.description ?? ""} ${item.shortDesc ?? ""} ${item.excerpt ?? ""}`,
    tokens,
  );
  const tagsScore = scoreMatch(
    [...(item.tags ?? []), ...(item.features ?? []), item.cuisine ?? "", item.type ?? ""].join(" "),
    tokens,
  );
  return titleScore * 3 + descScore * 1.5 + tagsScore;
}

// ─── Search query ──────────────────────────────────────────────────────────
export const search = query({
  args: {
    q: v.string(),
    type: v.union(
      v.literal("tour"),
      v.literal("restaurant"),
      v.literal("dica"),
      v.literal("praia"),
      v.literal("nightlife"),
      v.literal("itinerary"),
      v.literal("hosting"),
      v.literal("coupon"),
      v.literal("any"),
    ),
    /** Optional city filter (e.g. "Natal"). Compared on the first comma
     *  segment, accent-insensitive. */
    city: v.optional(v.string()),
  },
  handler: async (ctx, { q, type, city }) => {
    let tokens = tokenize(q);

    // When a city filter is active, remove city-name tokens from scoring.
    // "praias de João Pessoa" with city="João Pessoa" → strip "joao"/"pessoa"
    // so the remaining tokens reflect CONTENT (not WHERE), letting the
    // city filter handle WHERE and content scoring handle WHAT.
    if (city) {
      const cityNormTokens = new Set(
        city
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .split(/[\s,]+/)
          .filter((t) => t.length >= 3),
      );
      tokens = tokens.filter((t) => !cityNormTokens.has(t));
    }

    const isEmptyQuery = tokens.length === 0;
    const specificTokens = tokens.filter((t) => !GENERIC_CATEGORY_TOKENS.has(t));
    const isBrowseQuery = isEmptyQuery || specificTokens.length === 0;

    const results: { score: number; item: Record<string, unknown> }[] = [];
    /** Near-miss bucket: items in the requested category that did NOT clear
     *  the strict score threshold. Used to fill the response when the strict
     *  search returns 0 so the user always sees the closest available items. */
    const nearMiss: { score: number; item: Record<string, unknown> }[] = [];

    function passesCity(rawCity: string | undefined): boolean {
      if (!city) return true;
      return matchesCity(rawCity, city);
    }

    function pushScored(
      item: Record<string, unknown>,
      raw: Record<string, unknown>,
    ) {
      const rawCity =
        typeof raw.city === "string" ? raw.city : undefined;
      if (!passesCity(rawCity)) return;
      if (isBrowseQuery) {
        results.push({ score: 1, item });
        return;
      }
      const score = scoreItem(raw, tokens);
      if (score >= 1.5) {
        results.push({ score, item });
      } else {
        // Keep weakly-matching items so we can fall back to "closest" results
        // when no strong match exists in this category.
        nearMiss.push({ score: score + 0.01, item });
      }
    }

    // ── Tours ──
    if (type === "tour" || type === "any") {
      const tours = await ctx.db
        .query("tours")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const t of tours) {
        pushScored(
          {
            kind: "tour",
            id: t._id,
            title: t.title,
            slug: t.slug,
            shortDesc: t.shortDesc,
            description: t.shortDesc,
            tags: t.tags,
            price: t.price,
            duration: t.duration,
            rating: t.rating,
            image: t.image,
            url: t.url,
          },
          t,
        );
      }
    }

    // ── Restaurants ──
    if (type === "restaurant" || type === "any") {
      const restaurants = await ctx.db
        .query("restaurants")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const r of restaurants) {
        pushScored(
          {
            kind: "restaurant",
            id: r._id,
            title: r.name,
            shortDesc: r.shortDesc,
            description: r.shortDesc,
            tags: r.tags,
            cuisine: r.cuisine,
            priceRange: r.priceRange,
            rating: r.rating,
            image: r.image,
            slug: r.slug,
          },
          r,
        );
      }
    }

    // ── Dicas ──
    if (type === "dica" || type === "any") {
      const dicas = await ctx.db
        .query("dicas")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const d of dicas) {
        pushScored(
          {
            kind: "dica",
            id: d._id,
            title: d.title,
            excerpt: d.excerpt,
            tags: d.tags,
            cover: d.cover,
            slug: d.slug,
          },
          d,
        );
      }
    }

    // ── Praias ──
    if (type === "praia" || type === "any") {
      const praias = await ctx.db
        .query("praias")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const p of praias) {
        pushScored(
          {
            kind: "praia",
            id: p._id,
            title: p.name,
            shortDesc: p.shortDesc,
            description: p.shortDesc,
            features: p.features,
            image: p.image,
            slug: p.slug,
          },
          p,
        );
      }
    }

    // ── Nightlife ──
    if (type === "nightlife" || type === "any") {
      const items = await ctx.db
        .query("nightlife")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const n of items) {
        pushScored(
          {
            kind: "nightlife",
            id: n._id,
            title: n.name,
            shortDesc: n.shortDesc,
            description: n.shortDesc,
            tags: n.tags,
            type: n.type,
            image: n.image,
            slug: n.slug,
          },
          n,
        );
      }
    }

    // ── Itineraries ──
    if (type === "itinerary" || type === "any") {
      const itineraries = await ctx.db
        .query("itineraries")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const i of itineraries) {
        pushScored(
          {
            kind: "itinerary",
            id: i._id,
            title: i.title,
            subtitle: i.subtitle,
            description: i.subtitle,
            durationDays: i.durationDays,
            cover: i.cover,
            slug: i.slug,
          },
          i,
        );
      }
    }

    // ── Hosting ──
    if (type === "hosting" || type === "any") {
      const items = await ctx.db
        .query("hosting")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const h of items) {
        pushScored(
          {
            kind: "hosting",
            id: h._id,
            title: h.name,
            shortDesc: h.shortDesc,
            description: h.shortDesc,
            type: h.type,
            amenities: h.amenities,
            priceFrom: h.priceFrom,
            image: h.image,
            affiliateUrl: h.affiliateUrl,
          },
          h,
        );
      }
    }

    // ── Coupons ──
    if (type === "coupon" || type === "any") {
      const items = await ctx.db
        .query("coupons")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const c of items) {
        pushScored(
          {
            kind: "coupon",
            id: c._id,
            title: c.title,
            description: c.description,
            partner: c.partner,
            code: c.code,
            image: c.image,
            discountType: c.discountType,
            discountValue: c.discountValue,
            partnerUrl: c.partnerUrl,
          },
          c,
        );
      }
    }

    const sorted = results.sort((a, b) => b.score - a.score).slice(0, 8);
    if (sorted.length > 0) {
      return { items: sorted.map((r) => r.item), partial: false };
    }
    // Strict search empty: surface the closest matches so the chat can
    // present "não encontrei X exato, mas posso te indicar estes".
    const near = nearMiss
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.item);
    return { items: near, partial: near.length > 0 };
  },
});

/**
 * Returns true when at least one active piece of content (tour, restaurant,
 * praia, nightlife, dica, hosting, coupon) exists for the given city. Used
 * by the chat to decide whether to pre-search or to admit "ainda não tenho
 * conteúdo cadastrado dessa cidade".
 */
export const cityHasContent = query({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    const tables = ["tours", "restaurants", "praias", "nightlife", "dicas"] as const;
    for (const t of tables) {
      const items = await ctx.db
        .query(t)
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      if (items.some((i) => matchesCity(i.city, city))) return true;
    }
    return false;
  },
});

/**
 * Returns all active content (tours, beaches, restaurants, nightlife) without
 * any filter, used by the NordestAI to build itineraries when no pre-made
 * itinerary is found.
 */
export const getContentForItinerary = query({
  args: {},
  handler: async (ctx) => {
    const results: Record<string, unknown>[] = [];

    const [tours, praias, restaurants, nightlife] = await Promise.all([
      ctx.db.query("tours").withIndex("by_active", (q) => q.eq("active", true)).collect(),
      ctx.db.query("praias").withIndex("by_active", (q) => q.eq("active", true)).collect(),
      ctx.db.query("restaurants").withIndex("by_active", (q) => q.eq("active", true)).collect(),
      ctx.db.query("nightlife").withIndex("by_active", (q) => q.eq("active", true)).collect(),
    ]);

    tours.slice(0, 8).forEach((t) =>
      results.push({
        kind: "tour",
        id: t._id,
        title: t.title,
        slug: t.slug,
        shortDesc: t.shortDesc,
        duration: t.duration,
        price: t.price,
        image: t.image,
        url: t.url,
      }),
    );

    praias.slice(0, 6).forEach((p) =>
      results.push({
        kind: "praia",
        id: p._id,
        title: p.name,
        shortDesc: p.shortDesc,
        image: p.image,
        slug: p.slug,
      }),
    );

    restaurants.slice(0, 6).forEach((r) =>
      results.push({
        kind: "restaurant",
        id: r._id,
        title: r.name,
        shortDesc: r.shortDesc,
        cuisine: r.cuisine,
        image: r.image,
        slug: r.slug,
      }),
    );

    nightlife.slice(0, 4).forEach((n) =>
      results.push({
        kind: "nightlife",
        id: n._id,
        title: n.name,
        shortDesc: n.shortDesc,
        image: n.image,
        slug: n.slug,
      }),
    );

    return results;
  },
});
