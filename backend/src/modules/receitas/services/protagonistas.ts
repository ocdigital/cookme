/**
 * Mapeamento prato → ingredientes protagonistas aceitos.
 * Fonte base: lista_receitas_brasileiras_protagonistas.xlsx (Gemini, jun/2026)
 * Chave = palavra que aparece no TÍTULO da receita (normalizada sem acento, lowercase).
 * Valor = array de strings que devem aparecer nos INGREDIENTES da receita.
 *
 * Para adicionar nova receita: basta adicionar entrada aqui — sem mexer em outra lógica.
 */
export const PROTAGONISTAS: Record<string, string[]> = {

  // ── Proteínas animais ────────────────────────────────────────────────────────
  'frango':       ['frango', 'peito de frango', 'coxa', 'sobrecoxa', 'file de frango', 'galinha'],
  'galinha':      ['galinha', 'frango'],
  'galinhada':    ['frango', 'galinha'],
  'carne':        ['carne', 'patinho', 'alcatra', 'maminha', 'picanha', 'acem', 'musculo', 'contrafile', 'bife', 'charque', 'carne seca', 'carne de sol'],
  'costela':      ['costela'],
  'churrasco':    ['carne', 'costela', 'picanha', 'alcatra', 'fraldinha', 'contrafile', 'frango'],
  'carreteiro':   ['charque', 'carne seca', 'carne'],
  'barreado':     ['carne', 'musculo', 'coxao'],
  'porco':        ['porco', 'suino', 'lombo', 'pernil', 'costelinha'],
  'bacon':        ['bacon'],
  'linguica':     ['linguica', 'calabresa', 'paio'],
  'paçoca':       ['carne de sol', 'amendoim'],  // dois pratos distintos
  'pacoca':       ['carne de sol', 'amendoim'],
  'lagosta':      ['lagosta'],
  'camarao':      ['camarao', 'camarão'],
  'camarão':      ['camarao', 'camarão'],
  'camaroes':     ['camarao', 'camarão'],
  'salmao':       ['salmao', 'salmão'],
  'atum':         ['atum'],
  'bacalhau':     ['bacalhau'],
  'sardinha':     ['sardinha'],
  'tilapia':      ['tilapia', 'tilápia'],
  'corvina':      ['corvina'],
  'merluza':      ['merluza'],
  'peixe':        ['peixe', 'tilapia', 'atum', 'bacalhau', 'merluza', 'corvina', 'sardinha'],
  'piranha':      ['piranha'],
  'ovo':          ['ovo', 'ovos'],
  'ovos':         ['ovo', 'ovos'],

  // ── Laticínios ───────────────────────────────────────────────────────────────
  'queijo':       ['queijo', 'mussarela', 'parmesao', 'ricota', 'cottage', 'provolone', 'gruyere', 'brie', 'coalho'],
  'requeijao':    ['requeijao', 'requeijão'],
  'ricota':       ['ricota'],
  'mussarela':    ['mussarela', 'mozarela', 'mozzarella'],
  'brigadeiro':   ['leite condensado'],
  'quindim':      ['gema', 'gemas', 'ovo', 'ovos'],
  'ambrosia':     ['leite'],
  'arroz doce':   ['arroz'],
  'canjica':      ['milho', 'canjica'],
  'mugunza':      ['milho', 'canjica'],

  // ── Receitas compostas brasileiras ───────────────────────────────────────────
  'feijoada':     ['feijao', 'feijão', 'feijao preto', 'carne seca', 'linguica'],
  'feijao':       ['feijao', 'feijão'],
  'tutu':         ['farinha de mandioca', 'farinha', 'feijao', 'feijão'],
  'baiao':        ['feijao', 'feijão', 'feijao-de-corda', 'feijao de corda', 'fradinho'],
  'fricasse':     ['frango', 'creme de leite', 'requeijao'],
  'bobó':         ['mandioca', 'aipim', 'macaxeira'],
  'bobo':         ['mandioca', 'aipim', 'macaxeira'],
  'vatapa':       ['camarao', 'camarão', 'camarao seco'],
  'vatapá':       ['camarao', 'camarão', 'camarao seco'],
  'acaraje':      ['feijao-fradinho', 'fradinho', 'feijao'],
  'acarajé':      ['feijao-fradinho', 'fradinho', 'feijao'],
  'caruru':       ['quiabo'],
  'maniçoba':     ['maniva', 'folha de mandioca'],
  'manicoba':     ['maniva', 'folha de mandioca'],
  'tacaca':       ['tucupi'],
  'tacacá':       ['tucupi'],
  'moqueca':      ['peixe', 'camarao', 'camarão'],
  'escondidinho': ['mandioca', 'batata', 'aipim', 'macaxeira', 'pure'],
  'caldo verde':  ['couve'],

  // ── Massas / farinhas ────────────────────────────────────────────────────────
  'lasanha':      ['massa', 'molho', 'mussarela'],
  'macarrao':     ['macarrao', 'espaguete', 'penne', 'fusilli', 'fettuccine'],
  'coxinha':      ['frango', 'massa', 'farinha'],
  'cuscuz':       ['flocos de milho', 'flocao', 'flocão', 'farinha de milho', 'cuscuz'],
  'pamonha':      ['milho verde', 'milho'],
  'tapioca':      ['tapioca', 'polvilho', 'goma'],
  'pao de queijo':['polvilho', 'queijo'],
  'bolo de rolo': ['goiabada'],
  'bolo de fuba': ['fuba', 'farinha de milho'],
  'rocambole':    ['pao de lo', 'farinha'],
  'cuca':         ['farinha', 'manteiga'],
  'chineque':     ['creme de confeiteiro', 'creme', 'farinha'],

  // ── Vegetais protagonistas ───────────────────────────────────────────────────
  'abobrinha':    ['abobrinha'],
  'berinjela':    ['berinjela'],
  'brocolis':     ['brocolis', 'brócolis'],
  'espinafre':    ['espinafre'],
  'cogumelo':     ['cogumelo', 'champignon', 'shiitake', 'shimeji', 'portobello'],
  'abobora':      ['abobora', 'abóbora', 'jerimum', 'moranga'],
  'couve-flor':   ['couve-flor', 'couve flor'],
  'cenoura':      ['cenoura'],
  'batata':       ['batata', 'batata-doce', 'batata doce'],
  'mandioca':     ['mandioca', 'aipim', 'macaxeira'],
  'lentilha':     ['lentilha'],
  'grao-de-bico': ['grao-de-bico', 'grao de bico', 'grão-de-bico'],
  'quiabo':       ['quiabo'],
  'milho':        ['milho', 'milho verde'],
  'pequi':        ['pequi'],
  'vinagreira':   ['vinagreira'],
  'palmito':      ['palmito'],
  'alcachofra':   ['alcachofra'],
  'banana':       ['banana', 'banana-da-terra', 'banana da terra'],
  'cartola':      ['banana', 'banana-da-terra'],

  // ── Grãos / carboidratos ─────────────────────────────────────────────────────
  'arroz':        ['arroz'],
  'quinoa':       ['quinoa'],
  'viarado':      ['farinha de milho', 'farinha', 'feijao'],
  'virado':       ['farinha de milho', 'farinha', 'feijao'],
  'baião de dois':['feijao-de-corda', 'fradinho', 'feijao'],

  // ── Doces / sobremesas ───────────────────────────────────────────────────────
  'chocolate':    ['chocolate'],
  'morango':      ['morango'],
  'limao':        ['limao', 'limão'],
  'abacaxi':      ['abacaxi'],
  'coco':         ['coco', 'leite de coco'],
  'manga':        ['manga'],
  'amendoim':     ['amendoim'],
  'goiabada':     ['goiabada'],

};
