/**
 * Shopping List Service
 * Gerencia lógica de busca, favoritos e análise de preços
 */

/**
 * Dados fictícios para demonstração
 */
const MOCK_COMPRAS = [
  {
    id: '1',
    data: '20/03/2026',
    local: 'Hipermarket Bom Preço',
    total: 417.18,
    cupom: '11308_176',
    economia: 45.32,
    itens: [
      { id: 1, nome: 'BOLO PANCO ABACAXI 300G', qtd: 1, precoAnterior: 10.50, precoAtual: 10.98, economia: -0.48 },
      { id: 2, nome: 'CAFE MORGES VACUO 500G', qtd: 1, precoAnterior: 25.98, precoAtual: 25.98, economia: 0 },
      { id: 3, nome: 'AGUA MIN BIOLEUE PRIME 12', qtd: 1, precoAnterior: 23.76, precoAtual: 21.80, economia: 1.96 },
      { id: 4, nome: 'BISCOITO INTEGRAL 200G', qtd: 2, precoAnterior: 4.99, precoAtual: 4.99, economia: 0 },
      { id: 5, nome: 'LEITE INTEGRAL 1L', qtd: 3, precoAnterior: 5.50, precoAtual: 5.80, economia: -0.90 },
      { id: 6, nome: 'FRANGO PEITO 800G', qtd: 1, precoAnterior: 18.59, precoAtual: 18.59, economia: 0 },
      { id: 7, nome: 'ARROZ GRAO 5KG', qtd: 1, precoAnterior: 10.98, precoAtual: 10.98, economia: 0 },
      { id: 8, nome: 'FEIJAO BROTO 2 UN', qtd: 2, precoAnterior: 8.99, precoAtual: 8.99, economia: 0 },
      { id: 9, nome: 'TOMATE SALADA KG', qtd: 1, precoAnterior: 10.98, precoAtual: 8.43, economia: 2.55 },
      { id: 10, nome: 'CEBOLA NACIONAL KG', qtd: 1, precoAnterior: 4.69, precoAtual: 4.08, economia: 0.61 },
    ],
  },
  {
    id: '2',
    data: '13/03/2026',
    local: 'Supermercado Zona Sul',
    total: 498.50,
    cupom: '11307_175',
    economia: 12.50,
    itens: [
      { id: 1, nome: 'BOLO PANCO ABACAXI 300G', qtd: 1, precoAnterior: 10.50, precoAtual: 10.50, economia: 0 },
      { id: 2, nome: 'CAFE MORGES VACUO 500G', qtd: 1, precoAnterior: 25.98, precoAtual: 25.98, economia: 0 },
      { id: 3, nome: 'AGUA MIN BIOLEUE PRIME 12', qtd: 2, precoAnterior: 11.88, precoAtual: 23.76, economia: -11.88 },
      { id: 4, nome: 'LEITE INTEGRAL 1L', qtd: 2, precoAnterior: 5.50, precoAtual: 11.00, economia: 0 },
      { id: 5, nome: 'ARROZ GRAO 5KG', qtd: 1, precoAnterior: 10.50, precoAtual: 10.98, economia: -0.48 },
    ],
  },
  {
    id: '3',
    data: '06/03/2026',
    local: 'Hipermarket Bom Preço',
    total: 520.75,
    cupom: '11306_174',
    economia: -18.30,
    itens: [
      { id: 1, nome: 'CAFE MORGES VACUO 500G', qtd: 2, precoAnterior: 25.50, precoAtual: 25.98, economia: -0.96 },
      { id: 2, nome: 'AGUA MIN BIOLEUE PRIME 12', qtd: 1, precoAnterior: 24.50, precoAtual: 23.76, economia: 0.74 },
      { id: 3, nome: 'LEITE INTEGRAL 1L', qtd: 2, precoAnterior: 5.80, precoAtual: 5.50, economia: 0.60 },
    ],
  },
  {
    id: '4',
    data: '27/02/2026',
    local: 'Supermercado Zona Sul',
    total: 445.90,
    cupom: '11305_173',
    economia: 5.20,
    itens: [
      { id: 1, nome: 'CAFE MORGES VACUO 500G', qtd: 1, precoAnterior: 26.20, precoAtual: 25.98, economia: 0.22 },
      { id: 2, nome: 'AGUA MIN BIOLEUE PRIME 12', qtd: 1, precoAnterior: 25.00, precoAtual: 24.50, economia: 0.50 },
      { id: 3, nome: 'LEITE INTEGRAL 1L', qtd: 3, precoAnterior: 5.80, precoAtual: 5.80, economia: 0 },
    ],
  },
  {
    id: '5',
    data: '20/02/2026',
    local: 'Mercado do Bairro',
    total: 389.50,
    cupom: '11304_172',
    economia: 55.40,
    itens: [
      { id: 1, nome: 'CAFE MORGES VACUO 500G', qtd: 1, precoAnterior: 26.50, precoAtual: 25.50, economia: 1.00 },
      { id: 2, nome: 'AGUA MIN BIOLEUE PRIME 12', qtd: 1, precoAnterior: 25.50, precoAtual: 25.00, economia: 0.50 },
      { id: 3, nome: 'LEITE INTEGRAL 1L', qtd: 3, precoAnterior: 5.80, precoAtual: 5.80, economia: 0 },
    ],
  },
];

/**
 * Calcula frequência de cada produto baseado no histórico de compras
 */
export const calcularFavoritos = () => {
  const produtosMap = {};

  // Contar cada produto nos itens de compras
  if (!MOCK_COMPRAS || MOCK_COMPRAS.length === 0) {
    console.warn('Nenhuma compra encontrada');
    return [];
  }

  MOCK_COMPRAS.forEach((compra) => {
    if (!compra.itens) {
      console.warn('Compra sem itens:', compra);
      return;
    }
    compra.itens.forEach((item) => {
      if (!produtosMap[item.nome]) {
        produtosMap[item.nome] = {
          nome: item.nome,
          categoria: item.categoria || 'Diversos',
          frequencia: 0,
          ultimoPreco: 0,
          ultimaCompra: null,
          compras: [],
        };
      }
      produtosMap[item.nome].frequencia += item.qtd || 1;
      produtosMap[item.nome].ultimoPreco = item.precoAtual;
      produtosMap[item.nome].ultimaCompra = compra.data;
      produtosMap[item.nome].compras.push({
        data: compra.data,
        preco: item.precoAtual,
        qtd: item.qtd,
      });
    });
  });

  // Calcular min/max para cada produto
  Object.keys(produtosMap).forEach((key) => {
    const precos = produtosMap[key].compras.map((c) => c.preco);
    produtosMap[key].menorPreco = Math.min(...precos);
    produtosMap[key].maiorPreco = Math.max(...precos);
    produtosMap[key].mediaPreco = (precos.reduce((a, b) => a + b, 0) / precos.length).toFixed(2);
  });

  // Converter para array e ordenar por frequência
  return Object.values(produtosMap).sort((a, b) => b.frequencia - a.frequencia);
};

/**
 * Retorna os top N produtos favoritos
 */
export const obterFavoritos = (limite = 10) => {
  const favoritos = calcularFavoritos();
  return favoritos.slice(0, limite);
};

/**
 * Simples busca fuzzy com levenshtein distance
 * Encontra produtos que contêm o termo ou são similares
 */
const levenshteinDistance = (str1, str2) => {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return track[str2.length][str1.length];
};

/**
 * Calcula similaridade entre duas strings (0-1)
 */
const calcularSimilaridade = (str1, str2) => {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
};

/**
 * Busca produtos por termo (com fuzzy matching)
 */
export const buscarProdutos = (termo) => {
  if (!termo || termo.trim() === '') {
    return [];
  }

  const todos = calcularFavoritos();
  const termoBusca = termo.toLowerCase();

  // Buscar por termo exato primeiro
  const resultados = todos
    .map((produto) => {
      // Verifica se o termo está contido no nome
      const contemTermo = produto.nome.toLowerCase().includes(termoBusca);

      // Calcula similaridade
      const similaridade = calcularSimilaridade(termoBusca, produto.nome.toLowerCase());

      return {
        ...produto,
        score: contemTermo ? 1.0 + similaridade : similaridade,
      };
    })
    .filter((produto) => produto.score > 0.4) // Filtrar apenas resultados relevantes
    .sort((a, b) => b.score - a.score); // Ordenar por relevância

  return resultados.slice(0, 10); // Retornar top 10
};

/**
 * Obtém análise detalhada de preços de um produto
 */
export const obterAnaliseProduto = (nomeProduto) => {
  const favoritos = calcularFavoritos();
  const produto = favoritos.find(
    (p) => p.nome.toLowerCase() === nomeProduto.toLowerCase(),
  );

  if (!produto) {
    return null;
  }

  const precos = produto.compras.map((c) => c.preco).sort((a, b) => a - b);
  const ultimoPreco = produto.ultimoPreco;
  const menorPreco = produto.menorPreco;
  const maiorPreco = produto.maiorPreco;
  const mediaPreco = parseFloat(produto.mediaPreco);

  // Calcular variação
  const variacaoPercentual = ((ultimoPreco - menorPreco) / menorPreco * 100).toFixed(1);
  const diferencaMedia = (ultimoPreco - mediaPreco).toFixed(2);

  // Determinar tendência
  let tendencia = 'ESTÁVEL';
  if (produto.compras.length >= 3) {
    const ultimos3 = produto.compras.slice(-3).map((c) => c.preco);
    const mediaUltimos3 = ultimos3.reduce((a, b) => a + b, 0) / 3;
    const primeiros3 = produto.compras.slice(0, 3).map((c) => c.preco);
    const mediaPrimeiros3 = primeiros3.reduce((a, b) => a + b, 0) / 3;

    if (mediaUltimos3 > mediaPrimeiros3 * 1.05) {
      tendencia = 'ALTA';
    } else if (mediaUltimos3 < mediaPrimeiros3 * 0.95) {
      tendencia = 'QUEDA';
    }
  }

  // Recomendação
  let recomendacao = '';
  if (ultimoPreco > mediaPreco * 1.1) {
    recomendacao = `⚠️ Este preço está ${(((ultimoPreco - mediaPreco) / mediaPreco) * 100).toFixed(0)}% acima da média. Considere esperar.`;
  } else if (ultimoPreco <= menorPreco * 1.05) {
    recomendacao = '✅ Excelente preço! Histórico mostra que isso é uma boa oportunidade.';
  } else if (ultimoPreco <= mediaPreco) {
    recomendacao = '👍 Preço bom! Está abaixo ou na média histórica.';
  } else {
    recomendacao = '📊 Preço na média. Fique atento para melhores ofertas.';
  }

  return {
    nome: produto.nome,
    categoria: produto.categoria,
    frequencia: produto.frequencia,
    ultimaCompra: produto.ultimaCompra,
    precos: {
      atual: ultimoPreco,
      minimo: menorPreco,
      maximo: maiorPreco,
      media: mediaPreco,
    },
    variacao: {
      percentual: variacaoPercentual,
      diferenca: diferencaMedia,
    },
    tendencia,
    recomendacao,
    historico: produto.compras,
  };
};

/**
 * Gera dados para gráfico de preços
 */
export const gerarDadosGrafico = (nomeProduto) => {
  const analise = obterAnaliseProduto(nomeProduto);
  if (!analise) return null;

  return {
    labels: analise.historico.map((_, i) => `${i + 1}ª`).slice(-12), // Últimas 12 compras
    datasets: [
      {
        data: analise.historico.map((c) => c.preco).slice(-12),
        color: () => '#ff6b6b',
        strokeWidth: 2,
      },
    ],
  };
};

export default {
  obterFavoritos,
  buscarProdutos,
  obterAnaliseProduto,
  gerarDadosGrafico,
  calcularFavoritos,
};
