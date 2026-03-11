import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receita } from '../entities/receita.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { ReceitaExecutada } from '../entities/receita-executada.entity';
import { Preferencia } from '../../usuarios/entities/preferencia.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';

interface ReceitaSugestao {
  receita: Receita;
  score: number;
  matchedIngredients: number;
  totalIngredients: number;
  matchPercentage: number;
  reason: string[];
}

@Injectable()
export class MOIEngineService {
  constructor(
    @InjectRepository(Receita)
    private receitaRepository: Repository<Receita>,
    @InjectRepository(ReceitaIngrediente)
    private ingredienteRepository: Repository<ReceitaIngrediente>,
    @InjectRepository(ReceitaExecutada)
    private receitaExecutadaRepository: Repository<ReceitaExecutada>,
    @InjectRepository(Preferencia)
    private preferenciaRepository: Repository<Preferencia>,
    @InjectRepository(Inventario)
    private inventarioRepository: Repository<Inventario>,
  ) {}

  /**
   * Motor MOI - Análise completa do usuário e recomendação de receitas
   *
   * Fatores considerados:
   * 1. Inventário disponível (ingredientes que o usuário tem)
   * 2. Preferências alimentares (vegetariano, vegano, etc)
   * 3. Restrições dietéticas e alergias
   * 4. Histórico de execução (receitas que ele já fez e avaliou bem)
   * 5. Tempo de preparo (respeitar preferência por receitas rápidas)
   * 6. Nível de dificuldade (se prefere receitas fáceis)
   * 7. Popularidade global (receitas bem avaliadas por outros)
   */
  async sugerirReceitas(usuarioId: string, limite: number = 15): Promise<Receita[]> {
    // 1. Carregar dados do usuário
    const preferencias = await this.preferenciaRepository.findOne({
      where: { usuario_id: usuarioId },
    });

    const inventarioUsuario = await this.inventarioRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['produto'],
    });

    const receitasExecutadas = await this.receitaExecutadaRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['receita'],
    });

    // 2. Mapear produtos disponíveis no inventário
    const produtosDisponiveis = new Set(
      inventarioUsuario
        .filter(item => item.quantidade_disponivel > 0)
        .map(item => item.produto_id),
    );

    // 3. Mapear receitas que o usuário já fez
    const receitasJaFeitas = new Set(
      receitasExecutadas.map(exe => exe.receita_id),
    );

    // 4. Mapear receitas bem avaliadas (rating >= 4)
    const receitasBemAvaliadas = new Map(
      receitasExecutadas
        .filter(exe => exe.avaliacao && exe.avaliacao >= 4)
        .map(exe => [exe.receita_id, exe.avaliacao]),
    );

    // 5. Buscar todas as receitas com ingredientes
    const todasReceitas = await this.receitaRepository.find({
      relations: ['ingredientes', 'ingredientes.produto'],
      order: {
        avaliacao_media: 'DESC',
        vezes_executada: 'DESC',
      },
    });

    // 6. Calcular score para cada receita
    const receitasComScore: ReceitaSugestao[] = todasReceitas
      .map(receita => this.calcularScoreReceita(
        receita,
        produtosDisponiveis,
        preferencias,
        receitasJaFeitas,
        receitasBemAvaliadas,
      ))
      .filter(r => r.score > 0) // Apenas receitas com score positivo
      .sort((a, b) => b.score - a.score); // Ordenar por score desc

    // 7. Retornar receitas ordenadas
    return receitasComScore
      .slice(0, limite)
      .map(r => r.receita);
  }

  /**
   * Calcula o score de uma receita para um usuário específico
   */
  private calcularScoreReceita(
    receita: Receita,
    produtosDisponiveis: Set<string>,
    preferencias: Preferencia | null,
    receitasJaFeitas: Set<string>,
    receitasBemAvaliadas: Map<string, number>,
  ): ReceitaSugestao {
    let score = 0;
    const reasons: string[] = [];

    // Calcular cobertura de ingredientes
    const { matchedIngredients, totalIngredients, matchPercentage } =
      this.calcularCoberturaProdutos(receita, produtosDisponiveis);

    // PESO 1: Cobertura de ingredientes (maior peso)
    if (matchPercentage > 0) {
      score += matchPercentage * 40; // 0-40 pontos
      if (matchPercentage === 1) {
        reasons.push('Todos os ingredientes disponíveis');
      } else {
        reasons.push(
          `${matchedIngredients}/${totalIngredients} ingredientes disponíveis`,
        );
      }
    }

    // PESO 2: Preferências do usuário
    if (preferencias) {
      const scorePreferencias = this.calcularScorePreferencias(
        receita,
        preferencias,
      );
      score += scorePreferencias; // 0-25 pontos
      if (scorePreferencias > 0) {
        reasons.push('Compatível com suas preferências');
      }
    }

    // PESO 3: Histórico positivo (se ele gostou de receitas similares)
    if (receitasBemAvaliadas.has(receita.id)) {
      score += 20; // 20 pontos por receita bem avaliada
      reasons.push('Você já fez e gostou de receitas similares');
    }

    // PESO 4: Popularidade global (receitas bem avaliadas por outros)
    const scorePopularidade = receita.avaliacao_media * 10; // 0-50 pontos
    score += scorePopularidade;
    if (receita.avaliacao_media > 4) {
      reasons.push('Muito bem avaliada por outros usuários');
    }

    // PESO 5: Frequência de execução (receitas populares)
    if (receita.vezes_executada > 10) {
      score += 5; // 5 pontos bônus
      reasons.push('Receita popular na comunidade');
    }

    // PENALIDADE: Receitas que já foi feita muitas vezes
    if (receitasJaFeitas.has(receita.id)) {
      score *= 0.7; // Reduz score em 30%
    }

    // PENALIDADE: Receitas muito longas se tem preferência por rápidas
    if (
      preferencias?.tempo_maximo_preparo &&
      receita.tempo_preparo &&
      receita.tempo_preparo > preferencias.tempo_maximo_preparo
    ) {
      score *= 0.5; // Reduz score em 50%
    }

    // PENALIDADE: Receitas difíceis se prefere fáceis
    if (
      preferencias?.apenas_receitas_faceis &&
      receita.dificuldade !== 'facil'
    ) {
      score *= 0.6; // Reduz score em 40%
    }

    return {
      receita,
      score,
      matchedIngredients,
      totalIngredients,
      matchPercentage,
      reason: reasons.length > 0 ? reasons : ['Receita recomendada'],
    };
  }

  /**
   * Calcula quantos ingredientes da receita o usuário tem no inventário
   */
  private calcularCoberturaProdutos(
    receita: Receita,
    produtosDisponiveis: Set<string>,
  ): {
    matchedIngredients: number;
    totalIngredients: number;
    matchPercentage: number;
  } {
    if (!receita.ingredientes || receita.ingredientes.length === 0) {
      return {
        matchedIngredients: 0,
        totalIngredients: 0,
        matchPercentage: 0,
      };
    }

    const totalIngredients = receita.ingredientes.length;
    const matchedIngredients = receita.ingredientes.filter(ing =>
      produtosDisponiveis.has(ing.produto_id),
    ).length;

    return {
      matchedIngredients,
      totalIngredients,
      matchPercentage: matchedIngredients / totalIngredients,
    };
  }

  /**
   * Calcula score baseado nas preferências do usuário
   */
  private calcularScorePreferencias(
    receita: Receita,
    preferencias: Preferencia,
  ): number {
    let score = 0;

    // Verificar match de tags de dieta
    if (
      preferencias.tags_dieta &&
      preferencias.tags_dieta.length > 0 &&
      receita.tags_dieta
    ) {
      const matchTags = preferencias.tags_dieta.filter(tag =>
        receita.tags_dieta.includes(tag),
      ).length;
      score += matchTags * 5; // 5 pontos por tag matching
    }

    // Verificar restrições (ingredientes a evitar)
    if (preferencias.ingredientes_evitar && receita.ingredientes) {
      const temIngredientesEvitados = receita.ingredientes.some(ing =>
        preferencias.ingredientes_evitar.includes(ing.produto_id),
      );
      if (!temIngredientesEvitados) {
        score += 10; // 10 pontos se não tem ingredientes evitados
      }
    }

    // Verificar alergias/restrições
    if (preferencias.restricoes && receita.tags_dieta) {
      const temRestricoes = preferencias.restricoes.every(restricao =>
        !receita.tags_dieta.includes(restricao),
      );
      if (temRestricoes) {
        score += 10; // 10 pontos se respeita todas as restrições
      }
    }

    return Math.min(score, 25); // Máximo 25 pontos
  }

  /**
   * Sugestões baseadas apenas no inventário (o que pode fazer com o que tem)
   */
  async sugestoesPorInventario(
    usuarioId: string,
    limite: number = 10,
  ): Promise<Receita[]> {
    const inventario = await this.inventarioRepository.find({
      where: { usuario_id: usuarioId, quantidade_disponivel: { gt: 0 } } as any,
      relations: ['produto'],
    });

    if (inventario.length === 0) {
      // Se não tem nada no inventário, retorna receitas populares
      return this.receitaRepository.find({
        relations: ['ingredientes', 'ingredientes.produto'],
        order: { avaliacao_media: 'DESC' },
        take: limite,
      });
    }

    const produtosDisponiveis = new Set(
      inventario.map(item => item.produto_id),
    );

    const receitas = await this.receitaRepository.find({
      relations: ['ingredientes', 'ingredientes.produto'],
      order: { avaliacao_media: 'DESC' },
    });

    // Filtrar receitas que podem ser feitas com produtos disponíveis
    return receitas
      .filter(receita => {
        if (!receita.ingredientes || receita.ingredientes.length === 0) {
          return true;
        }
        const percentualCobertura =
          receita.ingredientes.filter(ing =>
            produtosDisponiveis.has(ing.produto_id),
          ).length / receita.ingredientes.length;
        return percentualCobertura >= 0.7; // Pelo menos 70% de cobertura
      })
      .sort((a, b) => {
        // Calcular cobertura para ordenação
        const coberturaA =
          a.ingredientes?.filter(ing =>
            produtosDisponiveis.has(ing.produto_id),
          ).length / (a.ingredientes?.length || 1) || 0;
        const coberturaB =
          b.ingredientes?.filter(ing =>
            produtosDisponiveis.has(ing.produto_id),
          ).length / (b.ingredientes?.length || 1) || 0;

        if (coberturaA !== coberturaB) {
          return coberturaB - coberturaA; // Ordem decrescente de cobertura
        }
        return b.avaliacao_media - a.avaliacao_media; // Se empatar, por avaliação
      })
      .slice(0, limite);
  }

  /**
   * Sugestões baseadas em receitas similares às que o usuário gostou
   */
  async sugestoesSimilares(
    usuarioId: string,
    limite: number = 10,
  ): Promise<Receita[]> {
    // Encontrar receitas bem avaliadas pelo usuário
    const receitasGostadas = await this.receitaExecutadaRepository.find({
      where: { usuario_id: usuarioId, avaliacao: { gte: 4 } } as any,
      relations: ['receita', 'receita.tags_dieta', 'receita.ingredientes'],
      order: { avaliacao: 'DESC' },
      take: 5,
    });

    if (receitasGostadas.length === 0) {
      // Se não tem receitas bem avaliadas, retorna as populares
      return this.receitaRepository.find({
        order: { avaliacao_media: 'DESC' },
        take: limite,
      });
    }

    // Coletar tags e ingredientes das receitas que gostou
    const tagsGostadas = new Set<string>();
    const ingredientesGostados = new Set<string>();

    receitasGostadas.forEach(exe => {
      if (exe.receita.tags_dieta) {
        exe.receita.tags_dieta.forEach(tag => tagsGostadas.add(tag));
      }
      if (exe.receita.ingredientes) {
        exe.receita.ingredientes.forEach(ing =>
          ingredientesGostados.add(ing.produto_id),
        );
      }
    });

    // Buscar receitas similares
    const todasReceitas = await this.receitaRepository.find({
      relations: ['ingredientes', 'tags_dieta'],
    });

    const receitasSimilares = todasReceitas
      .map(receita => {
        let scoreSimularidade = 0;

        // Match de tags
        if (receita.tags_dieta) {
          const tagsMatch = receita.tags_dieta.filter(tag =>
            tagsGostadas.has(tag),
          ).length;
          scoreSimularidade += tagsMatch * 5;
        }

        // Match de ingredientes
        if (receita.ingredientes) {
          const ingredientesMatch = receita.ingredientes.filter(ing =>
            ingredientesGostados.has(ing.produto_id),
          ).length;
          scoreSimularidade += ingredientesMatch * 2;
        }

        // Popularidade
        scoreSimularidade += receita.avaliacao_media * 10;

        return { receita, score: scoreSimularidade };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite)
      .map(r => r.receita);

    return receitasSimilares;
  }
}
