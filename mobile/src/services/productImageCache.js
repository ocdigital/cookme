import { produtosService } from './api';

/**
 * Serviço para gerenciar cache de imagens de produtos
 * Busca e cacheia imagens de produtos automaticamente em background
 */

let imageCache = new Map();

/**
 * Buscar imagem de um produto
 * Tenta cache local primeiro, depois backend
 */
export const getProductImage = async (productId, productName) => {
  // Se está em cache, retornar
  if (imageCache.has(productId)) {
    return imageCache.get(productId);
  }

  // Tentar buscar do backend de forma assíncrona (sem bloquear)
  fetchProductImageAsync(productId, productName);

  // Retornar null enquanto carrega
  return null;
};

/**
 * Buscar imagem em background e atualizar cache
 * Não bloqueia a UI
 */
export const fetchProductImageAsync = async (productId, productName) => {
  try {
    // Chamar endpoint que busca e salva imagem
    const response = await produtosService.fetchProductImage(productId);

    if (response && response.imagem_url) {
      imageCache.set(productId, response.imagem_url);
      return response.imagem_url;
    }
  } catch (error) {
    console.debug(`Erro ao buscar imagem para ${productName}:`, error.message);
  }

  return null;
};

/**
 * Pre-carregar imagens de uma lista de produtos
 * Útil quando a tela é renderizada
 */
export const preloadProductImages = async (products) => {
  const promises = products
    .filter(item => item.produto && !imageCache.has(item.produto_id))
    .map(item => {
      const produtoId = item.produto_id;
      const produtoNome = item.produto?.nome;
      return fetchProductImageAsync(produtoId, produtoNome);
    });

  // Executar em paralelo mas sem bloquear
  Promise.allSettled(promises).catch(() => {
    // Silenciosamente ignorar erros de loading de imagens
  });
};

/**
 * Limpar cache (útil para logout ou reset)
 */
export const clearImageCache = () => {
  imageCache.clear();
};

/**
 * Obter estatísticas do cache
 */
export const getImageCacheStats = () => {
  return {
    size: imageCache.size,
    keys: Array.from(imageCache.keys()),
  };
};
