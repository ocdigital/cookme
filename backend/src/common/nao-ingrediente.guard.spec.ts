import { ehNaoIngrediente } from './nao-ingrediente.guard';

/**
 * Guard do coração do CookMe: despensa só recebe ingrediente de receita.
 * Cada bug de produção ("sabonete na despensa") vira caso aqui.
 */
describe('ehNaoIngrediente', () => {
  // ── Casos reais de produção (2026-07-04) ─────────────────────────────────
  const NAO_INGREDIENTES = [
    'SABONETE LIQUIDO PROTEX 250ML',
    'SABONETE LIQ',
    'SABAO EM PO OMO 1KG',
    'SAB PO TIXAN 800G',
    'SABAO DE COCO YPE',
    'LUSTRA MOVEIS POLIFLOR 200ML',
    'LUSTRA MOV',
    // Limpeza
    'AGUA SANITARIA QBOA 1L',
    'DETERGENTE YPE NEUTRO 500ML',
    'AMACIANTE COMFORT 2L',
    'ALVEJANTE VANISH 450ML',
    'DESINFETANTE PINHO SOL',
    'LIMPADOR MULTIUSO VEJA',
    'LIMPA VIDROS UAU',
    'ESPONJA SCOTCH BRITE',
    'BOMBRIL PALHA DE ACO',
    'ALCOOL 70 1L',
    'ALCOOL GEL 500ML',
    'INSETICIDA SBP',
    'VASSOURA NYLON',
    'PANO DE PRATO ESTAMPADO',
    'FLANELA LARANJA',
    'CERA LIQUIDA INCOLOR',
    // Higiene
    'SHAMPOO SEDA 325ML',
    'CONDICIONADOR PANTENE',
    'CREME DENTAL COLGATE 90G',
    'FIO DENTAL JOHNSON',
    'DESODORANTE REXONA AERO',
    'PAPEL HIG NEVE 12X',
    'PAP HIG PERSONAL',
    'ABSORVENTE SEMPRE LIVRE',
    'FRALDA PAMPERS G',
    'COTONETE 75UN',
    'ALGODAO APOLO 50G',
    'DIPIRONA 500MG',
    // Descartáveis / utilidades
    'PAPEL TOALHA SNOB',
    'PAPEL ALUMINIO WYDA',
    'PAPEL MANTEIGA 30CM',
    'GUARDANAPO SANTEPEL',
    'COPO DESCARTAVEL 180ML',
    'PRATO DESCARTAVEL 15CM',
    'SACO DE LIXO 50L',
    'SACOLA PLASTICA',
    'PALITO DE DENTE GINA',
    'FOSFORO FIAT LUX',
    'VELA BRANCA 8UN',
    'CARVAO VEGETAL 3KG',
    'PILHA AA DURACELL',
    'LAMPADA LED 9W',
    'ISQUEIRO BIC',
    // Pet
    'RACAO PEDIGREE 1KG',
    'AREIA HIGIENICA PIPICAT',
    'BIFINHO FRANGO CAES',
    // Abreviações curtas de cupom
    'SAB YPE GLICERINA',
    'DET LIMPOL 500ML',
    'COND CAP DOVE',
    'CR TRAT PANTENE',
  ];

  // ── Ingredientes que NUNCA podem ser bloqueados (falsos positivos) ────────
  const INGREDIENTES = [
    'QUEIJO PRATO FATIADO 150G',      // 'prato' ≠ 'prato descartavel'
    'MANTEIGA EXTRA AVIACAO 200G',    // 'manteiga' ≠ 'papel manteiga'
    'VINAGRE DE ALCOOL CASTELO',      // vinagre culinário, não álcool de limpeza
    'AGUA MINERAL CRYSTAL 1.5L',      // 'agua' ≠ 'agua sanitaria'
    'LEITE DE COCO SOCOCO 200ML',     // 'coco' ≠ 'sabao de coco'
    'OLEO DE COCO EXTRAVIRGEM',
    'CR LEITE ITALAC 200GR',
    'ARROZ CAMIL 5KG',
    'FEIJAO CARIOCA 1KG',
    'PEITO DE FRANGO SADIA KG',
    'SAL GROSSO CHURRASCO 1KG',       // sal de churrasco é ingrediente; carvão não
    'ACUCAR REFINADO UNIAO',
    'FARINHA DE TRIGO RENATA',
    'MACARRAO ESPAGUETE 500G',
    'TOMATE ITALIANO KG',
    'BANANA PRATA KG',                // 'prata' ≠ 'prato'
    'OVOS BRANCOS C/30',
    'AZEITE PORTUGUES GALLO',
    'CAFE MELITTA 500G',
    'GELATINA MORANGO ROYAL',
    'FERMENTO BIOLOGICO SECO',
    'COCO RALADO 100G',
    'PIMENTA DO REINO MOIDA',
    'MOLHO DE TOMATE FUGINI',
    'CREME DE LEITE NESTLE',
    'LEITE CONDENSADO MOCA',
    'PAO DE FORMA PULLMAN',
  ];

  it.each(NAO_INGREDIENTES)('bloqueia: %s', (nome) => {
    expect(ehNaoIngrediente(nome)).toBe(true);
  });

  it.each(INGREDIENTES)('NUNCA bloqueia (falso positivo): %s', (nome) => {
    expect(ehNaoIngrediente(nome)).toBe(false);
  });

  it('vazio/null não bloqueia (dúvida → IA decide)', () => {
    expect(ehNaoIngrediente('')).toBe(false);
    expect(ehNaoIngrediente(undefined as any)).toBe(false);
  });

  it('é case/acento-insensível', () => {
    expect(ehNaoIngrediente('Água Sanitária')).toBe(true);
    expect(ehNaoIngrediente('sabonete líquido')).toBe(true);
  });
});
