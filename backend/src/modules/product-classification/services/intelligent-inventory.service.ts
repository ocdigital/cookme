import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProductKnowledgeBase,
  FoodCategory,
} from '../entities/product-knowledge-base.entity';
import { ProductClassificationService } from './product-classification.service';

@Injectable()
export class IntelligentInventoryService {
  private readonly logger = new Logger(IntelligentInventoryService.name);

  constructor(
    private productClassificationService: ProductClassificationService,
    @InjectRepository(ProductKnowledgeBase)
    private productKnowledgeRepository: Repository<ProductKnowledgeBase>,
  ) {}

  /**
   * Adiciona um produto ao inventário com validação inteligente
   * Retorna o produto classificado ou o modal de validação para produtos incertos
   */
  async adicionarComValidacao(
    productName: string,
    usuarioId: string,
    metadata?: {
      quantity?: number;
      unit?: string;
      expiryDate?: Date;
      barcode?: string;
    },
  ): Promise<{
    sucesso: boolean;
    produto: string;
    categoria: FoodCategory;
    confianca: number;
    requerValidacaoUsuario: boolean;
    mensagem: string;
  }> {
    if (!productName || productName.trim().length === 0) {
      throw new BadRequestException('Nome do produto não pode estar vazio');
    }

    if (!usuarioId) {
      throw new BadRequestException('ID do usuário é obrigatório');
    }

    try {
      // Classifica o produto
      const classificacao =
        await this.productClassificationService.classificarProduto(
          productName,
          usuarioId,
        );

      const confiancaBaixa = classificacao.confidence < 0.75;
      const ehIndefindo =
        classificacao.categoria === FoodCategory.INDEFINIDO;

      // Se é alimento com alta confiança, adiciona direto
      if (
        classificacao.categoria === FoodCategory.ALIMENTO &&
        !confiancaBaixa
      ) {
        return {
          sucesso: true,
          produto: productName,
          categoria: FoodCategory.ALIMENTO,
          confianca: classificacao.confidence,
          requerValidacaoUsuario: false,
          mensagem: `Produto "${productName}" adicionado ao inventário como alimento`,
        };
      }

      // Se é NÃO-alimento com alta confiança, rejeita
      if (
        classificacao.categoria === FoodCategory.NAO_ALIMENTO &&
        !confiancaBaixa
      ) {
        return {
          sucesso: false,
          produto: productName,
          categoria: FoodCategory.NAO_ALIMENTO,
          confianca: classificacao.confidence,
          requerValidacaoUsuario: false,
          mensagem: `Produto "${productName}" foi classificado como "${classificacao.categoria}" (${(classificacao.confidence * 100).toFixed(0)}% confiança). Este tipo de produto não pode ser adicionado ao inventário de alimentos.`,
        };
      }

      // Se confiança baixa ou indefinido, requer validação do usuário
      return {
        sucesso: false, // não adiciona até validação
        produto: productName,
        categoria: classificacao.categoria,
        confianca: classificacao.confidence,
        requerValidacaoUsuario: true,
        mensagem: `Não foi possível classificar "${productName}" automaticamente (confiança: ${(classificacao.confidence * 100).toFixed(0)}%). Por favor, confirme manualmente se é um alimento ou não.`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao adicionar produto ${productName} ao inventário:`,
        error,
      );

      return {
        sucesso: false,
        produto: productName,
        categoria: FoodCategory.INDEFINIDO,
        confianca: 0,
        requerValidacaoUsuario: true,
        mensagem: `Erro ao processar "${productName}". Por favor, confirme manualmente a categoria.`,
      };
    }
  }

  /**
   * Valida a classificação de um produto
   * Chamado quando o usuário confirma ou corrige a categoria
   */
  async validarClassificacao(
    productName: string,
    usuarioId: string,
    categoriaConfirmada: FoodCategory,
    comentario?: string,
  ): Promise<{
    sucesso: boolean;
    produto: string;
    categoria: FoodCategory;
    confiancaAtualizada: number;
    mensagem: string;
  }> {
    if (
      categoriaConfirmada !== FoodCategory.ALIMENTO &&
      categoriaConfirmada !== FoodCategory.NAO_ALIMENTO
    ) {
      throw new BadRequestException(
        'Categoria deve ser "alimento" ou "nao_alimento"',
      );
    }

    try {
      await this.productClassificationService.registrarValidacaoUsuario(
        productName,
        usuarioId,
        categoriaConfirmada,
        comentario,
      );

      // Obtém a classificação atualizada
      const historico =
        await this.productClassificationService.obterHistoricoValidacoes(
          productName,
        );

      const sucessoAdicao =
        historico.categoria_atual === FoodCategory.ALIMENTO;

      return {
        sucesso: sucessoAdicao,
        produto: productName,
        categoria: historico.categoria_atual,
        confiancaAtualizada: historico.confianca,
        mensagem: sucessoAdicao
          ? `Obrigado! Produto "${productName}" confirmado como alimento e adicionado ao seu inventário.`
          : `Produto "${productName}" foi marcado como não-alimento. Será mantido no histórico mas não aparecerá em recomendações.`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao validar classificação de ${productName}:`,
        error,
      );

      throw new BadRequestException(
        'Erro ao salvar validação: ' + error.message,
      );
    }
  }

  /**
   * Obtém estatísticas do sistema de classificação
   */
  async obterEstatisticasClassificacao(): Promise<{
    total_produtos_classificados: number;
    produtos_alimentos: number;
    produtos_nao_alimentos: number;
    produtos_indefinidos: number;
    confianca_media: number;
    taxa_cache_hit: number;
  }> {
    const stats =
      await this.productClassificationService.obterEstatisticas();

    const totalAlimentos = await this.productKnowledgeRepository.count({
      where: { categoria: FoodCategory.ALIMENTO },
    });

    const allProducts = await this.productKnowledgeRepository.find();
    const mediaConfianca =
      allProducts.length > 0
        ? allProducts.reduce((sum, p) => sum + p.confidence_score, 0) /
          allProducts.length
        : 0;

    return {
      total_produtos_classificados: stats.total_produtos_classificados,
      produtos_alimentos: stats.produtos_por_categoria.alimento,
      produtos_nao_alimentos: stats.produtos_por_categoria.nao_alimento,
      produtos_indefinidos: stats.produtos_por_categoria.indefinido,
      confianca_media: parseFloat(mediaConfianca.toFixed(4)),
      taxa_cache_hit: stats.cache_hit_rate,
    };
  }

  /**
   * Retorna apenas produtos alimentos para recomendações
   */
  async obterAlimentosDisponiveis(
    minConfidence: number = 0.5,
  ): Promise<ProductKnowledgeBase[]> {
    return await this.productKnowledgeRepository.find({
      where: {
        categoria: FoodCategory.ALIMENTO,
        is_active: true,
      },
      order: { confidence_score: 'DESC' },
    });
  }

  /**
   * Busca produto no conhecimento base
   */
  async buscarProduto(productName: string): Promise<ProductKnowledgeBase> {
    const normalized = productName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');

    const produto = await this.productKnowledgeRepository.findOne({
      where: { normalized_name: normalized },
      relations: ['validacoes'],
    });

    if (!produto) {
      throw new BadRequestException('Produto não encontrado na base de conhecimento');
    }

    return produto;
  }

  /**
   * Lista todos os produtos não-alimentos para exclusão manual (se necessário)
   */
  async obterProdutosNaoAlimentos(): Promise<ProductKnowledgeBase[]> {
    return await this.productKnowledgeRepository.find({
      where: {
        categoria: FoodCategory.NAO_ALIMENTO,
        is_active: true,
      },
      order: { total_adicoes: 'DESC' },
    });
  }
}
