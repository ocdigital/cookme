import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeRecommendation, RecommendationType } from '../entities/recipe-recommendation.entity';
import { AffiliateLink } from '../entities/affiliate-link.entity';
import { Receita } from '../../receitas/entities/receita.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(RecipeRecommendation)
    private recommendationRepository: Repository<RecipeRecommendation>,
    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>,
    @InjectRepository(Receita)
    private receitaRepository: Repository<Receita>,
    @InjectRepository(Inventario)
    private inventarioRepository: Repository<Inventario>,
  ) {}

  /**
   * Busca recomendações de receitas com os alimentos que o usuário já tem
   */
  async obterRecomendacoesComMeusAlimentos(
    usuarioId: string,
    limiteIngredientesFaltantes: number = 2,
    ordenarPor: 'porcentagem_alimentos' | 'avaliacoes' = 'porcentagem_alimentos',
  ): Promise<RecipeRecommendation[]> {
    // Busca inventário do usuário
    const inventario = await this.inventarioRepository.find({
      where: { usuario_id: usuarioId },
    });

    const ingredientesUsuario = inventario.map((item) => item.nome?.toLowerCase() || '');

    // Busca todas as receitas
    const receitas = await this.receitaRepository.find({
      relations: ['ingredientes'],
    });

    const recomendacoes: RecipeRecommendation[] = [];

    for (const receita of receitas) {
      if (!receita.ingredientes || receita.ingredientes.length === 0) continue;

      const ingredientesReceita = receita.ingredientes.map((ing) =>
        ing.nome?.toLowerCase() || '',
      );

      // Conta quantos ingredientes o usuário tem
      const ingredientesFaltantes = ingredientesReceita.filter(
        (ing) => !ingredientesUsuario.includes(ing),
      );

      // Se faltam <= limiteIngredientesFaltantes, é uma boa recomendação
      if (ingredientesFaltantes.length <= limiteIngredientesFaltantes) {
        const percentualDisponivel =
          ((ingredientesReceita.length - ingredientesFaltantes.length) /
            ingredientesReceita.length) *
          100;

        const recomendacao = await this.recommendationRepository.save({
          usuario_id: usuarioId,
          receita_id: receita.id,
          ingredientes_faltantes: null,
          categoria_recomendacao: RecommendationType.WITH_YOUR_ITEMS,
          percentual_alimentos_disponiveis: Math.round(percentualDisponivel),
        } as RecipeRecommendation);

        recomendacoes.push(recomendacao);
      }
    }

    // Ordena resultado
    if (ordenarPor === 'avaliacoes') {
      recomendacoes.sort((a, b) => {
        const aRating = a.receita?.avaliacao_media || 0;
        const bRating = b.receita?.avaliacao_media || 0;
        return bRating - aRating;
      });
    } else {
      recomendacoes.sort(
        (a, b) => b.percentual_alimentos_disponiveis - a.percentual_alimentos_disponiveis,
      );
    }

    return recomendacoes.slice(0, 10); // Retorna top 10
  }

  /**
   * Busca recomendações para incentivar compra de ingredientes
   */
  async obterRecomendacoesIncentivCompra(
    usuarioId: string,
    precoMaximo: number = 50,
  ): Promise<any[]> {
    // Busca inventário do usuário
    const inventario = await this.inventarioRepository.find({
      where: { usuario_id: usuarioId },
    });

    const ingredientesUsuario = inventario.map((item) => item.nome?.toLowerCase() || '');

    // Busca todas as receitas
    const receitas = await this.receitaRepository.find({
      relations: ['ingredientes'],
    });

    const recomendacoes: any[] = [];

    for (const receita of receitas) {
      if (!receita.ingredientes || receita.ingredientes.length === 0) continue;

      const ingredientesReceita = receita.ingredientes;

      // Calcula ingredientes faltantes e preço estimado
      const ingredientesFaltantes = ingredientesReceita
        .filter((ing) => !ingredientesUsuario.includes(ing.nome?.toLowerCase() || ''))
        .map((ing) => ({
          nome: ing.nome,
          preco_estimado: this.estimarPrecoIngrediente(ing.nome),
        }));

      const precoTotal = ingredientesFaltantes.reduce(
        (acc, ing) => acc + ing.preco_estimado,
        0,
      );

      // Se o preço está dentro do limite e há ingredientes faltantes
      if (precoTotal > 0 && precoTotal <= precoMaximo && ingredientesFaltantes.length > 0) {
        // Busca links de afiliados para esta receita
        const linksCompra = await this.affiliateLinkRepository.find({
          where: {
            receita_id: receita.id,
            is_active: true,
          },
        });

        const recomendacao = {
          id: receita.id,
          receita: {
            id: receita.id,
            nome: receita.nome,
            imagem_url: receita.imagem_url,
            avaliacao_media: receita.avaliacao_media,
          },
          ingredientes_faltantes: ingredientesFaltantes,
          preco_total_ingredientes: precoTotal,
          links_para_comprar: linksCompra.map((link) => ({
            id: link.id,
            supermarket: link.supermarket_name,
            url: link.affiliate_url,
            comissao_app: `${link.comissao_percentual}%`,
          })),
        };

        recomendacoes.push(recomendacao);
      }
    }

    // Ordena por preço (crescente) e depois por avaliação
    recomendacoes.sort((a, b) => {
      if (a.preco_total_ingredientes !== b.preco_total_ingredientes) {
        return a.preco_total_ingredientes - b.preco_total_ingredientes;
      }
      return b.receita.avaliacao_media - a.receita.avaliacao_media;
    });

    return recomendacoes.slice(0, 10); // Retorna top 10
  }

  /**
   * Registra que uma recomendação foi clicada
   */
  async registrarCliqueRecomendacao(recomendacaoId: string): Promise<void> {
    await this.recommendationRepository.update(
      { id: recomendacaoId },
      {
        foi_clicada: true,
        data_clique: new Date(),
      },
    );
  }

  /**
   * Estima o preço de um ingrediente (função simplificada)
   * Em produção, seria integrado com API de preços real
   */
  private estimarPrecoIngrediente(nomeIngrediente: string): number {
    const precos: { [key: string]: number } = {
      frango: 18.5,
      carne: 25.0,
      peixe: 22.0,
      ovo: 1.5,
      leite: 5.0,
      queijo: 12.0,
      pão: 6.0,
      arroz: 4.5,
      feijão: 5.0,
      batata: 2.0,
      tomate: 3.0,
      cebola: 2.5,
      alho: 1.0,
      sal: 2.0,
      óleo: 8.0,
      manteiga: 8.0,
      açúcar: 3.5,
      farinha: 3.0,
      fermento: 4.0,
      chocolate: 6.0,
    };

    const ingrediente = nomeIngrediente.toLowerCase();

    for (const [chave, preco] of Object.entries(precos)) {
      if (ingrediente.includes(chave)) {
        return preco;
      }
    }

    // Preço padrão se não encontrado
    return 8.0;
  }

  /**
   * Obtém recomendações recentes para um usuário
   */
  async obterRecomendacoesRecentes(
    usuarioId: string,
    limite: number = 5,
  ): Promise<RecipeRecommendation[]> {
    return this.recommendationRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['receita'],
      order: { created_at: 'DESC' },
      take: limite,
    });
  }
}
