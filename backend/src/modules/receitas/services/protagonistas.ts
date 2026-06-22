/**
 * Mapeamento prato → ingredientes protagonistas aceitos.
 * Chave = palavra/frase que aparece no TÍTULO da receita (sem acento, lowercase).
 * Valor = array de strings; basta UM deles aparecer nos ingredientes da receita.
 *
 * Regra: chave deve ser única. Sinônimos do mesmo prato: mesclados na mesma entrada.
 * Gerado e mantido pelo Claude Code — culinária brasileira regional completa.
 */
export const PROTAGONISTAS: Record<string, string[]> = {

  // ── Carnes bovinas ───────────────────────────────────────────────────────────
  'picanha':          ['picanha'],
  'alcatra':          ['alcatra'],
  'contrafile':       ['contrafile', 'contrafilé'],
  'maminha':          ['maminha'],
  'fraldinha':        ['fraldinha'],
  'patinho':          ['patinho', 'carne'],
  'cupim':            ['cupim'],
  'bife':             ['bife', 'carne'],
  'costela':          ['costela'],
  'rabada':           ['rabo de boi', 'rabo'],
  'mocoto':           ['mocoto', 'pe de boi'],
  'chambaril':        ['chambaril', 'ossobuco'],
  'dobradinha':       ['dobradinha', 'tripa', 'bucho'],
  'buchada':          ['bucho', 'miudezas'],
  'sarapatel':        ['figado', 'miudezas'],
  'carne seca':       ['carne seca', 'charque'],
  'carne de sol':     ['carne de sol'],
  'maria isabel':     ['carne seca', 'charque'],
  'carreteiro':       ['charque', 'carne seca'],
  'barreado':         ['carne', 'musculo'],
  'churrasco':        ['picanha', 'costela', 'alcatra', 'fraldinha', 'carne'],
  'cozido':           ['carne', 'frango', 'legumes'],

  // ── Aves ─────────────────────────────────────────────────────────────────────
  'frango':           ['frango', 'peito de frango', 'coxa', 'sobrecoxa', 'file de frango'],
  'galinha':          ['galinha', 'frango'],
  'galinhada':        ['frango', 'galinha'],
  'fricasse':         ['frango', 'creme de leite', 'requeijao'],
  'coxinha':          ['frango'],
  'peru':             ['peru'],
  'pato':             ['pato'],
  'codorna':          ['codorna'],
  'chester':          ['chester', 'frango'],
  'canja':            ['frango', 'galinha'],
  'frango com quiabo':['frango', 'quiabo'],

  // ── Suínos ───────────────────────────────────────────────────────────────────
  'lombo':            ['lombo', 'porco'],
  'pernil':           ['pernil', 'porco'],
  'costelinha':       ['costelinha', 'porco'],
  'leitao':           ['leitao', 'porco'],
  'linguica':         ['linguica', 'calabresa', 'paio'],
  'calabresa':        ['calabresa', 'linguica'],
  'bacon':            ['bacon'],

  // ── Receitas compostas com carne ─────────────────────────────────────────────
  'feijoada':         ['feijao preto', 'feijao', 'feijão', 'carne seca', 'linguica'],
  'tutu':             ['feijao', 'feijão', 'farinha de mandioca'],
  'virado':           ['feijao', 'feijão', 'farinha de milho', 'farinha'],
  'tropeiro':         ['feijao', 'feijão', 'farinha', 'linguica', 'bacon'],
  'escondidinho':     ['carne seca', 'carne de sol', 'frango', 'mandioca', 'batata'],
  'strogonoff':       ['carne', 'frango', 'camarao', 'camarão'],
  'stroganoff':       ['carne', 'frango', 'camarao', 'camarão'],
  'estrogonofe':      ['carne', 'frango', 'camarao', 'camarão'],

  // ── Peixes ───────────────────────────────────────────────────────────────────
  'peixe':            ['peixe', 'tilapia', 'bacalhau', 'merluza', 'corvina', 'sardinha', 'salmao', 'robalo', 'tainha'],
  'bacalhau':         ['bacalhau'],
  'salmao':           ['salmao', 'salmão'],
  'atum':             ['atum'],
  'sardinha':         ['sardinha'],
  'tilapia':          ['tilapia', 'tilápia'],
  'corvina':          ['corvina'],
  'merluza':          ['merluza'],
  'robalo':           ['robalo'],
  'tainha':           ['tainha'],
  'pirarucu':         ['pirarucu'],
  'tambaqui':         ['tambaqui'],
  'tucunare':         ['tucunare', 'tucunaré'],
  'pintado':          ['pintado', 'surubim'],
  'dourado':          ['dourado'],
  'piranha':          ['piranha'],
  'caldeirada':       ['peixe', 'frutos do mar'],
  'moqueca':          ['peixe', 'camarao', 'camarão', 'salmao'],

  // ── Frutos do mar ────────────────────────────────────────────────────────────
  'camarao':          ['camarao', 'camarão'],
  'lagosta':          ['lagosta'],
  'lagostim':         ['lagostim'],
  'caranguejo':       ['caranguejo'],
  'siri':             ['siri'],
  'marisco':          ['marisco', 'mexilhao'],
  'lula':             ['lula'],
  'polvo':            ['polvo'],
  'vatapa':           ['camarao seco', 'camarao', 'amendoim', 'castanha'],
  'bobo':             ['camarao', 'camarão', 'mandioca', 'aipim'],

  // ── Culinária baiana ─────────────────────────────────────────────────────────
  'acaraje':          ['feijao-fradinho', 'fradinho', 'feijao'],
  'caruru':           ['quiabo'],
  'xinxim':           ['frango', 'camarao', 'amendoim'],
  'moqueca baiana':   ['peixe', 'camarao', 'leite de coco', 'azeite de dende'],
  'moqueca capixaba': ['peixe'],

  // ── Culinária nordestina ─────────────────────────────────────────────────────
  'baiao':            ['feijao-de-corda', 'feijao de corda', 'fradinho', 'feijao'],
  'pacoca':           ['carne de sol', 'carne seca', 'amendoim'],
  'cuscuz':           ['flocos de milho', 'flocao', 'flocão', 'farinha de milho'],
  'pamonha':          ['milho verde', 'milho'],
  'caldo de piranha': ['piranha'],

  // ── Culinária amazônica ───────────────────────────────────────────────────────
  'tacaca':           ['tucupi', 'jambu'],
  'manicoba':         ['maniva', 'folha de mandioca'],
  'pato no tucupi':   ['pato', 'tucupi'],
  'acai':             ['acai', 'açaí'],
  'beiju':            ['tapioca', 'polvilho', 'goma'],
  'tapioca':          ['tapioca', 'polvilho', 'goma'],

  // ── Culinária mineira ────────────────────────────────────────────────────────
  'pao de queijo':    ['polvilho'],
  'feijao tropeiro':  ['feijao', 'feijão', 'farinha', 'linguica'],
  'arroz com pequi':  ['pequi'],
  'quibebe':          ['abobora', 'jerimum', 'moranga'],

  // ── Culinária sul ────────────────────────────────────────────────────────────
  'chineque':         ['farinha', 'creme'],
  'cuca':             ['farinha', 'manteiga'],

  // ── Culinária maranhense ─────────────────────────────────────────────────────
  'arroz de cuxa':    ['vinagreira'],
  'cuxá':             ['vinagreira'],

  // ── Ovos ─────────────────────────────────────────────────────────────────────
  'omelete':          ['ovo', 'ovos'],
  'fritada':          ['ovo', 'ovos'],
  'quiche':           ['ovo', 'ovos', 'creme de leite'],
  'moqueca de ovos':  ['ovo', 'ovos'],

  // ── Legumes e verduras protagonistas ─────────────────────────────────────────
  'abobrinha':        ['abobrinha'],
  'berinjela':        ['berinjela'],
  'brocolis':         ['brocolis', 'brócolis'],
  'espinafre':        ['espinafre'],
  'cogumelo':         ['cogumelo', 'champignon', 'shiitake', 'shimeji', 'portobello'],
  'abobora':          ['abobora', 'abóbora', 'jerimum', 'moranga'],
  'couve-flor':       ['couve-flor', 'couve flor'],
  'couve':            ['couve'],
  'cenoura':          ['cenoura'],
  'batata':           ['batata'],
  'batata doce':      ['batata doce', 'batata-doce'],
  'mandioca':         ['mandioca', 'aipim', 'macaxeira'],
  'quiabo':           ['quiabo'],
  'milho':            ['milho', 'milho verde'],
  'pequi':            ['pequi'],
  'jaca':             ['jaca'],
  'palmito':          ['palmito'],
  'alcachofra':       ['alcachofra'],
  'aspargo':          ['aspargo'],
  'jilo':             ['jilo', 'jiló'],
  'maxixe':           ['maxixe'],
  'chuchu':           ['chuchu'],
  'vinagreira':       ['vinagreira'],
  'ora-pro-nobis':    ['ora-pro-nobis'],

  // ── Grãos ────────────────────────────────────────────────────────────────────
  'feijao':           ['feijao', 'feijão'],
  'lentilha':         ['lentilha'],
  'grao-de-bico':     ['grao-de-bico', 'grao de bico'],
  'ervilha':          ['ervilha'],

  // ── Arroz ────────────────────────────────────────────────────────────────────
  'arroz':            ['arroz'],
  'risoto':           ['arroz', 'risoto'],
  'arroz doce':       ['arroz', 'leite'],
  'canjica':          ['canjica', 'milho branco'],
  'mugunza':          ['canjica', 'milho'],
  'curau':            ['milho verde', 'leite'],
  'creme de milho':   ['milho verde', 'milho'],

  // ── Massas ───────────────────────────────────────────────────────────────────
  'macarrao':         ['macarrao', 'espaguete', 'penne', 'fusilli', 'fettuccine', 'talharim'],
  'espaguete':        ['espaguete', 'macarrao'],
  'lasanha':          ['massa de lasanha', 'massa', 'mussarela'],
  'nhoque':           ['batata', 'farinha', 'mandioca'],
  'polenta':          ['fuba', 'farinha de milho'],
  'quinoa':           ['quinoa'],

  // ── Sopas ────────────────────────────────────────────────────────────────────
  'caldo verde':      ['couve', 'batata'],
  'sopa de feijao':   ['feijao', 'feijão'],
  'minestrone':       ['legumes', 'macarrao', 'feijao'],

  // ── Frutas ───────────────────────────────────────────────────────────────────
  'banana':           ['banana', 'banana-da-terra', 'banana da terra'],
  'cartola':          ['banana', 'banana-da-terra'],
  'morango':          ['morango'],
  'manga':            ['manga'],
  'abacaxi':          ['abacaxi'],
  'maracuja':         ['maracuja', 'maracujá'],
  'goiaba':           ['goiaba', 'goiabada'],
  'coco':             ['coco', 'leite de coco'],
  'acerola':          ['acerola'],
  'cupuacu':          ['cupuacu', 'cupuaçu'],
  'graviola':         ['graviola'],
  'pitanga':          ['pitanga'],
  'jabuticaba':       ['jabuticaba'],
  'amendoim':         ['amendoim'],

  // ── Laticínios ───────────────────────────────────────────────────────────────
  'queijo':           ['queijo', 'mussarela', 'parmesao', 'ricota', 'cottage', 'provolone', 'gruyere', 'coalho', 'minas'],
  'requeijao':        ['requeijao', 'requeijão'],
  'ricota':           ['ricota'],
  'mussarela':        ['mussarela', 'mozarela', 'mozzarella'],

  // ── Doces e sobremesas ───────────────────────────────────────────────────────
  'brigadeiro':       ['leite condensado'],
  'quindim':          ['gema', 'gemas', 'ovo', 'ovos', 'coco'],
  'ambrosia':         ['leite', 'ovos'],
  'pudim':            ['leite condensado', 'ovos', 'leite'],
  'cocada':           ['coco'],
  'beijinho':         ['coco', 'leite condensado'],
  'cajuzinho':        ['amendoim', 'castanha'],
  'bolo de rolo':     ['goiabada'],
  'bolo de fuba':     ['fuba', 'farinha de milho'],
  'bolo de cenoura':  ['cenoura'],
  'bolo de banana':   ['banana'],
  'bolo de chocolate':['chocolate', 'cacau'],
  'bolo de laranja':  ['laranja'],
  'bolo de limao':    ['limao', 'limão'],
  'bolo de coco':     ['coco'],
  'mousse':           ['chocolate', 'maracuja', 'limao', 'morango', 'maracujá'],
  'romeu e julieta':  ['queijo', 'goiabada'],
  'pe de moleque':    ['amendoim', 'rapadura', 'melado'],
  'manjar':           ['leite de coco', 'coco'],
  'maria mole':       ['leite de coco', 'coco', 'gelatina'],
  'doce de leite':    ['leite'],
  'goiabada':         ['goiaba', 'goiabada'],
  'rocambole':        ['ovos', 'farinha'],
  'chocolate':        ['chocolate', 'cacau'],

  // ── Salgados / lanches ───────────────────────────────────────────────────────
  'empada':           ['frango', 'palmito', 'camarao', 'carne'],
  'esfiha':           ['carne', 'frango', 'queijo', 'farinha'],
  'kibe':             ['carne', 'trigo'],
  'pizza':            ['mussarela', 'farinha', 'massa'],
  'calzone':          ['mussarela', 'presunto', 'farinha'],

  // ── Saladas ──────────────────────────────────────────────────────────────────
  'tabule':           ['trigo', 'tomate', 'salsinha'],
  'vinagrete':        ['tomate', 'cebola', 'pimentao'],
};
