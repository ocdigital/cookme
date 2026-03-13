/**
 * Mapa de ícones para produtos comuns
 * Baseado em nome do produto, categoria ou tipo
 */
const PRODUCT_ICONS = {
  // Frutas
  'maçã': '🍎',
  'apple': '🍎',
  'banana': '🍌',
  'laranja': '🍊',
  'uva': '🍇',
  'morango': '🍓',
  'melancia': '🍉',
  'abacaxi': '🍍',
  'pêra': '🍐',
  'limão': '🍋',

  // Vegetais
  'cenoura': '🥕',
  'tomate': '🍅',
  'abóbora': '🎃',
  'batata': '🥔',
  'cebola': '🧅',
  'alho': '🧄',
  'alface': '🥬',
  'espinafre': '🥬',
  'brócolis': '🥦',
  'couve': '🥬',
  'pimentão': '🫑',

  // Proteínas
  'frango': '🍗',
  'carne': '🥩',
  'peixe': '🐟',
  'salmão': '🐟',
  'atum': '🐟',
  'ovo': '🥚',
  'ovos': '🥚',
  'linguiça': '🌭',
  'presunto': '🥓',
  'bacon': '🥓',
  'camarão': '🦐',

  // Laticínios e Derivados
  'leite': '🥛',
  'queijo': '🧀',
  'iogurte': '🥛',
  'manteiga': '🧈',
  'creme': '🥄',

  // Bebidas
  'cerveja': '🍺',
  'chopp': '🍺',
  'vinho': '🍷',
  'suco': '🧃',
  'refrigerante': '🥤',
  'água': '💧',
  'café': '☕',
  'chá': '🍵',

  // Pão e Cereais
  'pão': '🍞',
  'arroz': '🍚',
  'macarrão': '🍝',
  'pasta': '🍝',
  'biscoito': '🍪',
  'bolacha': '🍪',
  'bolo': '🎂',
  'cereal': '🥣',
  'granola': '🥣',

  // Doces e Chocolates
  'chocolate': '🍫',
  'doce': '🍬',
  'bala': '🍬',
  'caramelo': '🍬',
  'sorvete': '🍦',
  'pudim': '🍮',

  // Legumes
  'feijão': '🫘',
  'lentilha': '🫘',
  'grão de bico': '🫘',

  // Óleos e Condimentos
  'azeite': '🫒',
  'óleo': '🫒',
  'sal': '🧂',

  // Frutas Secas e Castanhas
  'castanha': '🥜',
  'amendoim': '🥜',
  'noz': '🥜',
  'amêndoa': '🥜',

  // Outros
  'pizza': '🍕',
  'hambúrguer': '🍔',
  'sanduíche': '🥪',
  'salada': '🥗',
  'sopa': '🍲',
};

/**
 * Retorna o ícone apropriado para um produto
 * @param {string} productName - Nome do produto
 * @returns {string} Emoji icon para o produto
 */
export const getProductIcon = (productName) => {
  // Validar input
  if (!productName || typeof productName !== 'string') {
    return '📦';
  }

  const normalizedName = productName.toLowerCase().trim();

  // Buscar correspondência exata primeiro
  if (PRODUCT_ICONS[normalizedName]) {
    return PRODUCT_ICONS[normalizedName];
  }

  // Buscar correspondência parcial (palavra-chave contida no nome)
  for (const [keyword, icon] of Object.entries(PRODUCT_ICONS)) {
    if (normalizedName.includes(keyword) || keyword.includes(normalizedName.split(' ')[0])) {
      return icon;
    }
  }

  // Fallback: ícone padrão de pacote
  return '📦';
};

/**
 * Retorna cor baseada no tipo de produto
 * @param {string} productName - Nome do produto
 * @returns {string} Cor em hexadecimal
 */
export const getProductColor = (productName) => {
  const icon = getProductIcon(productName);

  const colorMap = {
    '🍎': '#E53935', // Vermelho para frutas vermelhas
    '🍌': '#FFD54F', // Amarelo
    '🍊': '#FB8C00', // Laranja
    '🍗': '#A1887F', // Marrom para carnes
    '🥛': '#FFFFFF', // Branco para laticínios
    '🍺': '#FFB300', // Ouro para bebidas
    '🍞': '#D2691E', // Marrom para pão
    '🥕': '#FF7043', // Laranja para vegetais
    '🧀': '#FFD54F', // Amarelo
    '📦': '#90A4AE', // Cinza padrão
  };

  return colorMap[icon] || '#90A4AE';
};

/**
 * Retorna categoria baseada no ícone
 * @param {string} productName - Nome do produto
 * @returns {string} Categoria do produto
 */
export const getProductCategory = (productName) => {
  const normalizedName = (productName || '').toLowerCase();

  if (normalizedName.match(/(maçã|banana|laranja|uva|morango|melancia|abacaxi|pêra|limão)/)) {
    return 'Frutas';
  }
  if (normalizedName.match(/(cenoura|tomate|abóbora|batata|cebola|alho|alface|espinafre|brócolis|couve|pimentão)/)) {
    return 'Vegetais';
  }
  if (normalizedName.match(/(frango|carne|peixe|salmão|atum|ovo|linguiça|presunto|bacon|camarão)/)) {
    return 'Proteínas';
  }
  if (normalizedName.match(/(leite|queijo|iogurte|manteiga|creme)/)) {
    return 'Laticínios';
  }
  if (normalizedName.match(/(cerveja|chopp|vinho|suco|refrigerante|água|café|chá)/)) {
    return 'Bebidas';
  }
  if (normalizedName.match(/(pão|arroz|macarrão|pasta|biscoito|bolacha|bolo|cereal|granola)/)) {
    return 'Cereais e Grãos';
  }
  if (normalizedName.match(/(chocolate|doce|bala|caramelo|sorvete|pudim)/)) {
    return 'Doces';
  }
  if (normalizedName.match(/(feijão|lentilha|grão de bico)/)) {
    return 'Legumes';
  }

  return 'Alimentos';
};
