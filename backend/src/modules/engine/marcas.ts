/**
 * Marcas brasileiras de supermercado — chave normalizada (minúscula, sem
 * acento) → nome de exibição. Usada para EXTRAIR a marca da descrição
 * (valor no JSON da API) e para limpá-la antes da canonização.
 *
 * Curadoria: só marcas reais aqui. Qualificadores ("premium", "tradicional")
 * ficam nos PACKAGING_PATTERNS do ocr-alias — não são marcas.
 */
export const MARCAS: Record<string, string> = {
  // Laticínios
  italac: 'Italac', piracanjuba: 'Piracanjuba', vigor: 'Vigor', lactel: 'Lactel',
  elege: 'Elegê', ccgl: 'CCGL', betania: 'Betânia', leitbom: 'Leitbom',
  tirol: 'Tirol', frimesa: 'Frimesa', ninho: 'Ninho', danone: 'Danone',
  batavo: 'Batavo', quata: 'Quatá', itambe: 'Itambé', tirolez: 'Tirolez',
  polenghi: 'Polenghi', scala: 'Scala', 'presidente': 'Président',
  // Proteínas
  sadia: 'Sadia', perdigao: 'Perdigão', seara: 'Seara', aurora: 'Aurora',
  friboi: 'Friboi', swift: 'Swift', copacol: 'Copacol', 'pif paf': 'Pif Paf',
  rezende: 'Rezende', korin: 'Korin',
  // Grãos / massas / farináceos
  camil: 'Camil', 'tio joao': 'Tio João', 'broto legal': 'Broto Legal',
  urbano: 'Urbano', quaker: 'Quaker', yoki: 'Yoki', 'dona benta': 'Dona Benta',
  renata: 'Renata', adria: 'Adria', isabela: 'Isabela', barilla: 'Barilla',
  galo: 'Galo', vitarella: 'Vitarella', fortaleza: 'Fortaleza',
  // Óleos / azeites / gorduras
  liza: 'Liza', soya: 'Soya', cocinero: 'Cocinero', qualy: 'Qualy',
  becel: 'Becel', doriana: 'Doriana', gallo: 'Gallo', andorinha: 'Andorinha',
  'la espanhola': 'La Española', aviacao: 'Aviação',
  // Temperos / molhos / enlatados
  maggi: 'Maggi', knorr: 'Knorr', ajinomoto: 'Ajinomoto', kitano: 'Kitano',
  hikari: 'Hikari', hemmer: 'Hemmer', fugini: 'Fugini', oderich: 'Oderich',
  predilecta: 'Predilecta', cica: 'Cica', heinz: 'Heinz', hellmanns: "Hellmann's",
  quero: 'Quero', elefante: 'Elefante', pomarola: 'Pomarola', salsaretti: 'Salsaretti',
  // Café / bebidas
  melitta: 'Melitta', pilao: 'Pilão', 'tres coracoes': '3 Corações',
  '3 coracoes': '3 Corações', caboclo: 'Caboclo', moraes: 'Moraes',
  'do ponto': 'Café do Ponto', nescafe: 'Nescafé', tang: 'Tang',
  'coca cola': 'Coca-Cola', guarana: 'Guaraná Antarctica', fanta: 'Fanta',
  crystal: 'Crystal', bioleve: 'Bioleve',
  // Pães / biscoitos / doces
  wickbold: 'Wickbold', bauducco: 'Bauducco', pullman: 'Pullman',
  nutrella: 'Nutrella', plusvita: 'Plus Vita', 'seven boys': 'Seven Boys',
  panco: 'Panco', marilan: 'Marilan', piraque: 'Piraquê', trakinas: 'Trakinas',
  passatempo: 'Passatempo', oreo: 'Oreo', lacta: 'Lacta', garoto: 'Garoto',
  hersheys: "Hershey's", nestle: 'Nestlé', arcor: 'Arcor', cassini: 'Cassini',
  triunfo: 'Triunfo', bono: 'Bono',
  // Açúcar / adoçantes
  uniao: 'União', caravelas: 'Caravelas', 'alto alegre': 'Alto Alegre',
  maisdoce: 'Mais Doce', guarani: 'Guarani',
  // Congelados / snacks
  pringles: 'Pringles', elma: 'Elma Chips', ruffles: 'Ruffles',
  doritos: 'Doritos', mccain: 'McCain',
  // Higiene/limpeza (para extração de marca em não-alimentos)
  ype: 'Ypê', omo: 'OMO', comfort: 'Comfort', colgate: 'Colgate',
  nivea: 'Nivea', rexona: 'Rexona', protex: 'Protex', dove: 'Dove',
  seda: 'Seda', pantene: 'Pantene', qboa: 'Qboa', veja: 'Veja',
  scotch: 'Scotch-Brite', bombril: 'Bombril',
};

/** Normaliza para lookup: minúsculas, sem acento. */
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Extrai a marca de uma descrição de cupom.
 * Procura bigramas primeiro ("tio joao"), depois tokens únicos.
 */
export function extrairMarca(descricao: string): string | null {
  const n = norm(descricao);
  const tokens = n.split(' ');

  for (let i = 0; i < tokens.length - 1; i++) {
    const bigrama = `${tokens[i]} ${tokens[i + 1]}`;
    if (MARCAS[bigrama]) return MARCAS[bigrama];
  }
  for (const t of tokens) {
    if (MARCAS[t]) return MARCAS[t];
  }
  return null;
}
