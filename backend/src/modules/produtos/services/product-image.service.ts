import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '../entities/produto.entity';
import axios from 'axios';

@Injectable()
export class ProductImageService {
  private readonly logger = new Logger(ProductImageService.name);
  private readonly imageCache = new Map<string, string>(); // Cache em memória

  constructor(
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
  ) {}

  /**
   * Busca e salva imagem de um produto
   * Se já existe imagem em cache, retorna o produto sem buscar na internet
   */
  async fetchAndSaveProductImage(produtoId: string): Promise<Produto | null> {
    try {
      const produto = await this.produtoRepository.findOne({
        where: { id: produtoId },
      });

      if (!produto) {
        this.logger.warn(`Produto não encontrado: ${produtoId}`);
        return null;
      }

      // Se já tem imagem cached, retornar produto
      if (produto.imagem_url) {
        return produto;
      }

      // Buscar imagem da internet
      const imageUrl = await this.searchImageUrl(produto.nome);

      if (imageUrl && (await this.isImageUrlValid(imageUrl))) {
        produto.imagem_url = imageUrl;
        await this.produtoRepository.save(produto);
        this.logger.log(
          `Imagem salva para produto ${produto.nome}: ${imageUrl}`,
        );
      }

      return produto;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar imagem para produto ${produtoId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Busca URL de imagem usando múltiplas estratégias
   * 1. Tenta Google Images Custom Search
   * 2. Tenta Unsplash API
   * 3. Tenta DuckDuckGo
   */
  async searchImageUrl(productName: string): Promise<string | null> {
    // Verificar se está em cache de memória
    if (this.imageCache.has(productName)) {
      return this.imageCache.get(productName) || null;
    }

    try {
      // Tentar Unsplash API (requer chave)
      const unsplashUrl = await this.searchUnsplash(productName);
      if (unsplashUrl) {
        this.imageCache.set(productName, unsplashUrl);
        return unsplashUrl;
      }

      // Tentar Pexels API (requer chave)
      const pexelsUrl = await this.searchPexels(productName);
      if (pexelsUrl) {
        this.imageCache.set(productName, pexelsUrl);
        return pexelsUrl;
      }

      // Fallback: Google Images (sem autenticação, pode não funcionar)
      const googleUrl = await this.searchGoogle(productName);
      if (googleUrl) {
        this.imageCache.set(productName, googleUrl);
        return googleUrl;
      }

      this.logger.warn(
        `Nenhuma imagem encontrada para: ${productName}`,
      );
      this.imageCache.set(productName, null);
      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar imagem para ${productName}:`,
        error,
      );
      this.imageCache.set(productName, null);
      return null;
    }
  }

  /**
   * Busca em Unsplash API
   */
  private async searchUnsplash(query: string): Promise<string | null> {
    const apiKey = process.env.UNSPLASH_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query,
          per_page: 1,
          order_by: 'relevance',
        },
        headers: {
          'Authorization': `Client-ID ${apiKey}`,
        },
        timeout: 5000,
      });

      if (response.data.results?.length > 0) {
        return response.data.results[0].urls.regular;
      }
    } catch (error) {
      this.logger.debug(`Unsplash search falhou para: ${query}`);
    }

    return null;
  }

  /**
   * Busca em Pexels API
   */
  private async searchPexels(query: string): Promise<string | null> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await axios.get('https://api.pexels.com/v1/search', {
        params: {
          query,
          per_page: 1,
        },
        headers: {
          'Authorization': apiKey,
        },
        timeout: 5000,
      });

      if (response.data.photos?.length > 0) {
        return response.data.photos[0].src.medium;
      }
    } catch (error) {
      this.logger.debug(`Pexels search falhou para: ${query}`);
    }

    return null;
  }

  /**
   * Fallback: Google Images (sem API, usa estratégia de URL)
   * Nota: Isto é um fallback experimental
   */
  private async searchGoogle(query: string): Promise<string | null> {
    try {
      // Construir URL de busca no Google Images
      const encodedQuery = encodeURIComponent(query);
      const googleImageUrl = `https://www.google.com/search?hl=pt-BR&tbm=isch&q=${encodedQuery}`;

      // Tentar fazer request simples (pode ser bloqueado)
      const response = await axios.get(googleImageUrl, {
        timeout: 5000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      // Parse básico (não confiável)
      const imageMatch = response.data.match(
        /imgurl=([^&]*)/,
      );
      if (imageMatch && imageMatch[1]) {
        return decodeURIComponent(imageMatch[1]);
      }
    } catch (error) {
      this.logger.debug(`Google Images search falhou para: ${query}`);
    }

    return null;
  }

  /**
   * Valida se a URL de imagem é acessível
   */
  async isImageUrlValid(imageUrl: string): Promise<boolean> {
    try {
      // Validar URL format
      new URL(imageUrl);

      // Fazer HEAD request para verificar se imagem existe
      const response = await axios.head(imageUrl, {
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      this.logger.debug(`URL inválida: ${imageUrl}`);
      return false;
    }
  }

  /**
   * Limpar cache de memória (útil para testes ou reset)
   */
  clearCache(): void {
    this.imageCache.clear();
    this.logger.log('Cache de imagens limpo');
  }

  /**
   * Obter estatísticas do cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.imageCache.size,
      keys: Array.from(this.imageCache.keys()),
    };
  }
}
