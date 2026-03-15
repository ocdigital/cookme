import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '../entities/produto.entity';
import axios from 'axios';

@Injectable()
export class ProductImageService {
  private readonly logger = new Logger(ProductImageService.name);
  private readonly imageCache = new Map<string, string | null>(); // Cache em memória

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
   * 1. Bing Images (melhor parsing)
   * 2. Google Images
   * 3. Unsplash/Pexels como fallback
   */
  async searchImageUrl(productName: string): Promise<string | null> {
    // Verificar se está em cache de memória
    if (this.imageCache.has(productName)) {
      return this.imageCache.get(productName) || null;
    }

    try {
      // Tentar Bing Images primeiro (mais confiável para parsing)
      const bingUrl = await this.searchBingImages(productName);
      if (bingUrl) {
        this.imageCache.set(productName, bingUrl);
        return bingUrl;
      }

      // Tentar Google Images
      const googleUrl = await this.searchGoogleImages(productName);
      if (googleUrl) {
        this.imageCache.set(productName, googleUrl);
        return googleUrl;
      }

      // Fallback: Unsplash/Pexels (stock photos)
      const unsplashUrl = await this.searchUnsplash(productName);
      if (unsplashUrl) {
        this.imageCache.set(productName, unsplashUrl);
        return unsplashUrl;
      }

      const pexelsUrl = await this.searchPexels(productName);
      if (pexelsUrl) {
        this.imageCache.set(productName, pexelsUrl);
        return pexelsUrl;
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
   * Busca em Google Images
   * Estratégia: Extrair URLs de imagem do HTML
   */
  private async searchGoogleImages(query: string): Promise<string | null> {
    try {
      const encodedQuery = encodeURIComponent(query);

      // Construir URL do Google Images
      const url = `https://www.google.com/search?hl=pt-BR&tbm=isch&q=${encodedQuery}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
        timeout: 8000,
      });

      // Tentar encontrar URLs em diferentes formatos
      // Padrão 1: URLs em objetos de imagem (img src ou data-src)
      const directImageRegex = /https:\/\/[^\s"<>]*\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s"<>]*)?/gi;
      const matches = response.data.match(directImageRegex);

      if (matches && matches.length > 0) {
        // Filtrar imagens válidas (remover placeholders e logos do Google)
        for (const imageUrl of matches) {
          // Evitar imagens de placeholder/logo
          if (
            !imageUrl.includes('gstatic.com') &&
            !imageUrl.includes('google.com/images') &&
            !imageUrl.includes('encrypted') &&
            !imageUrl.includes('lh3.googleusercontent.com/a/default') &&
            imageUrl.length > 60
          ) {
            // Validação adicional: URL deve ter domínio real
            try {
              new URL(imageUrl);
              return imageUrl;
            } catch (e) {
              // URL inválida, continua
            }
          }
        }
      }

    } catch (error) {
      this.logger.debug(`Google Images search falhou para: ${query}`);
    }

    return null;
  }

  /**
   * Busca em Bing Images
   * Bing fornece estrutura JSON mais confiável que Google
   */
  private async searchBingImages(query: string): Promise<string | null> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.bing.com/images/search?q=${encodedQuery}&form=HDRSC2`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 8000,
      });

      // Bing retorna dados em formato "murl" na estrutura JavaScript
      // Tentar diferentes padrões de extração
      const patterns = [
        /"murl":"(https:\/\/[^"]+)"/g,  // Padrão principal
        /"imgurl":"(https:\/\/[^"]+)"/g, // Padrão alternativo
        /\"image":\s*"(https:\/\/[^"]+)\"/g, // Outro padrão
      ];

      for (const pattern of patterns) {
        const match = pattern.exec(response.data);
        if (match && match[1]) {
          return match[1];
        }
      }

    } catch (error) {
      this.logger.debug(`Bing Images search falhou para: ${query}`);
    }

    return null;
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
