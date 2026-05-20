/**
 * "Generic" default packing/preparation checklists per trip type. 
 * Used to seed the trip checklist on first open. 
 * User can edit/add/remove freely after.
 */

const COMMON: string[] = [
  // --- Documentos e Finanças ---
  "Documentos originais (RG, CNH ou Passaporte)",
  "Cartões de crédito/débito + avisos de viagem ativados",
  "Dinheiro em espécie (cédulas trocadas para emergências)",
  "Comprovantes de reserva, passagens e ingressos (offline ou impressos)",

  // --- Tecnologia ---
  "Carregador do celular e cabos extras",
  "Carregador portátil (Powerbank) carregado",
  "Fone de ouvido",

  // --- Higiene e Saúde ---
  "Kit de higiene pessoal (escova, pasta, fio dental, desodorante, shampoo)",
  "Necessaire de medicamentos básicos (analgésico, antitérmico, curativos)",
  "Medicamentos de uso contínuo (com receita, se necessário)",

  // --- Vestuário e Conforto ---
  "Roupas íntimas e meias (com margem de sobra)",
  "Roupas confortáveis para o trajeto (avião/carro)",
  "Casaco leve para imprevistos de frio ou ar-condicionado",
  "Óculos de grau / lentes de contato e líquido de limpeza",

  // --- Utilitários ---
  "Sacolas vazias para separar roupa suja ou molhada",
  "Guarda-chuva pequeno ou capa de chuva compacta",
];

const BY_TYPE: Record<string, string[]> = {
  praia: [
    "Protetor solar corporal e facial (FPS 50+)",
    "Pós-sol ou hidratante com aloe vera",
    "Biquínis, sungas, maiôs e saídas de praia",
    "Óculos de sol com proteção UV",
    "Chapéu, boné ou viseira",
    "Toalha de praia de secagem rápida ou canga",
    "Chinelos e sandálias leves",
    "Repelente de insetos (essencial para o fim de tarde)",
    "Bolsa de praia impermeável",
    "Mascara de mergulho / Snorkel",
    "Capa impermeável para o celular",
  ],
  natureza: [
    "Bota ou tênis de trilha amaciado e confortável",
    "Repelente de insetos de alta eficácia (Icaridina)",
    "Garrafa de água térmica ou sistema de hidratação (Camelbak)",
    "Lanternas (de cabeça ou de mão) + pilhas extras",
    "Canivete multifuncional ou ferramenta compacta",
    "Capa de chuva resistente ou casaco corta-vento (Anorak)",
    "Calças de trilha leves e de secagem rápida",
    "Camisas com proteção UV e manga longa",
    "Mochila de ataque leve (Daypack de 15L a 30L)",
    "Kit de primeiros socorros avançado (antisséptico, esparadrapo, gaze)",
    "Isqueiro ou fósforos em embalagem impermeável",
  ],
  historica: [
    "Tênis macio com excelente amortecimento (para pisos de pedra/paralelepípedo)",
    "Câmera fotográfica ou lentes extras para o celular",
    "Cartão de memória limpo + espaço livre no armazenamento do celular",
    "Mapas, rotas e guias offline baixados no aplicativo",
    "Boné ou chapéu de abas largas",
    "Roupas leves e respiráveis para caminhadas sob o sol",
    "Doleira (Money belt) para segurança em locais movimentados",
    "Caderno de viagem ou bloco de notas compacto",
  ],
  aventura: [
    "Roupas de secagem rápida (dry-fit) e tecidos sintéticos",
    "Tênis fechado antiderrapante ou sapatilha aquática",
    "Snacks de energia de rápido consumo (barras de proteína, castanhas, gel)",
    "Toalha de microfibra compacta",
    "Prendedor de cabelo ou faixa de cabeça",
    "Saco estanque impermeável para proteger eletrônicos",
    "Protetor solar resistente à água e ao suor",
    "Mudança de roupa completa extra para deixar no carro/base",
  ],
  gastronomia: [
    "Roupas sociais/esporte fino para jantares e restaurantes renomados",
    "Calçados elegantes (sapato/salto), mas confortáveis para a noite",
    "Lista com endereços, horários e rotas dos restaurantes salvos",
    "Antiácidos, digestivos, protetores gástricos e analgésicos",
    "Aplicativos de avaliação e reservas atualizados (TheFork, OpenTable, etc.)",
    "Perfume ou colônia preferida",
  ],
  festa: [
    "Documento oficial de identificação original com foto (físico ou app oficial)",
    "Looks específicos para as festas, baladas ou festivais programados",
    "Calçado confortável e resistente para aguentar horas de pé e dança",
    "Glitter, maquiagem ou adereços temáticos (se aplicável)",
    "chicletes, balas ou drops",
    "Dinheiro ou cartão de backup guardado em local diferente do celular",
    "Kit ressaca (analgésico, isotônico em pó, protetor hepático)",
  ],
  familia: [
    "Documentos originais de todos (inclusive certidão de nascimento dos filhos pequenos)",
    "Kit infantil (fraldas descartáveis, lenço umedecido, pomada, mamadeiras)",
    "Farmácia infantil completa (antitérmico, termômetro, remédio de cólica, inalador)",
    "Lanches práticos, papinhas, biscoitos e frutas higienizadas",
    "Carrinho de bebê compacto, canguru ou 'slings'",
    "Brinquedos pequenos, livros de colorir ou tablet com vídeos offline para distrair",
    "Mudança de roupa extra de fácil acesso para imprevistos durante o trajeto",
    "Pulseira de identificação para as crianças com telefone dos pais",
  ],
  solo: [
    "Cópia digital de todos os documentos salva na nuvem e acessível offline",
    "Lista física e digital de contatos de emergência (ICE) anotados",
    "Cadeados de segredo pequenos para malas e lockers de hostel",
    "Livro físico ou leitor digital (Kindle) para momentos de espera",
    "Apito de emergência ou chaveiro de segurança",
    "Cartão de visita do hotel ou endereço anotado em papel local",
    "Roteador Wi-Fi portátil ou chip de internet internacional (eSIM) configurado",
  ],
  cultural: [
    "Ingressos antecipados impressos ou salvos no Wallet/Google Files",
    "Fones de ouvido com fio (vários audioguias de museus exigem a entrada P2 tradicional)",
    "Roupas que respeitem dress-codes de templos, igrejas ou teatros (ombros e joelhos cobertos)",
    "Tênis confortável e silencioso para caminhar em galerias",
    "Óculos de leitura ou lupa (se necessário para acervos)",
    "Caneta e bloco para rascunhos de insights",
  ],
  roadtrip: [
    "Documentação do veículo em dia (CRLV físico ou digital baixado)",
    "Verificação de segurança feita: estepe calibrado, macaco, chave de roda e triângulo",
    "Carregador de celular veicular (adaptador de acendedor 12V ou USB do painel)",
    "Suporte de celular seguro para o painel ou para o vidro do carro",
    "Playlists de música e podcasts baixados 100% offline",
    "Mapas offline configurados no Google Maps ou Waze",
    "Cooler térmico compacto com água, sucos e lanches para a estrada",
    "Óculos de sol para dirigir com segurança contra o reflexo",
    "Flanela de microfibra e spray limpa-vidros para o para-brisa",
    "Chave reserva do veículo guardada com outro passageiro",
  ],
};

export function defaultChecklistForType(type: string): string[] {
  const base = BY_TYPE[type] ?? [];
  return [...base, ...COMMON];
}