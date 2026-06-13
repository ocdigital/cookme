import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Receita } from '../entities/receita.entity';
import { ReceitaExecutada } from '../entities/receita-executada.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { PreferenciaAprendida, TipoPreferencia } from '../../usuarios/entities/preferencia-aprendida.entity';

export interface ReceitaSugerida {
  titulo: string;
  url: string;
  ingredientes_match: string[]; // Quais dos seus ingredientes estão nela
  fonte: string; // "google_search" | "api_externa"
  data_sugestao: Date;
}

export interface ReceitaParaMimResult {
  id: string;
  nome: string;
  imagem_url: string | null;
  tempo_preparo: number | null;
  dificuldade: string;
  cobertura: number;
  score: number;
  disponivel: boolean;
}

export interface ReceitaDesafioResult {
  id: string;
  nome: string;
  imagem_url: string | null;
  tempo_preparo: number | null;
  dificuldade: string;
  cobertura: number;
  ingredientes_faltando: string[];
  total_ingredientes: number;
}

export interface SuggestionResult {
  total_ingredientes_disponiveis: number;
  receitas_sugeridas: ReceitaSugerida[];
  query_utilizada: string;
  resumo: {
    receitas_encontradas: number;
    ingredientes_usados: string[];
  };
}

@Injectable()
export class RecipeSuggestionService {
  private readonly logger = new Logger(RecipeSuggestionService.name);

  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Receita)
    private readonly receitaRepository: Repository<Receita>,
    @InjectRepository(ReceitaExecutada)
    private readonly executadaRepository: Repository<ReceitaExecutada>,
    @InjectRepository(PreferenciaAprendida)
    private readonly prefAprendidaRepository: Repository<PreferenciaAprendida>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Sugere receitas baseado nos ingredientes disponíveis no inventário
   *
   * Fluxo:
   * 1. Buscar todos os ingredientes do usuário (ingrediente_receita=true)
   * 2. Formatar query de busca
   * 3. Buscar receitas no Google
   * 4. Salvar sugestões no banco
   */
  async sugerirReceitas(usuarioId: string): Promise<SuggestionResult> {
    try {
      this.logger.log(`Sugerindo receitas para usuário ${usuarioId}`);

      // 1️⃣ BUSCAR INGREDIENTES DISPONÍVEIS
      const inventario = await this.inventarioRepository.find({
        where: { usuario_id: usuarioId },
        relations: ['produto'],
      });

      if (inventario.length === 0) {
        return {
          total_ingredientes_disponiveis: 0,
          receitas_sugeridas: [],
          query_utilizada: '',
          resumo: {
            receitas_encontradas: 0,
            ingredientes_usados: [],
          },
        };
      }

      // Filtrar só ingredientes de receita
      const ingredientesPrincipais = inventario
        .filter((inv) => inv.produto?.ingrediente_receita)
        .map((inv) => inv.produto?.nome)
        .filter((nome) => nome !== undefined) as string[];

      if (ingredientesPrincipais.length === 0) {
        return {
          total_ingredientes_disponiveis: 0,
          receitas_sugeridas: [],
          query_utilizada: '',
          resumo: {
            receitas_encontradas: 0,
            ingredientes_usados: [],
          },
        };
      }

      // 2️⃣ FORMATAR QUERY DE BUSCA
      // Priorizar ingredientes principais (primeiros 3-4)
      const query = this.formatarQuery(ingredientesPrincipais);

      this.logger.log(`Query de busca: "${query}"`);
      this.logger.log(`Ingredientes disponíveis: ${ingredientesPrincipais.join(', ')}`);

      // 3️⃣ BUSCAR RECEITAS
      // Aqui você pode integrar com Google Search API ou scraping
      const receitasSugeridas = await this.buscarReceitasGoogle(query);

      // 4️⃣ ENRIQUECER COM INGREDIENTES MATCHED
      const receitasEnriquecidas = receitasSugeridas.map((receita) => ({
        ...receita,
        ingredientes_match: this.encontrarIngredientsMatch(
          receita.titulo,
          ingredientesPrincipais,
        ),
      }));

      // Ordenar por número de ingredientes matched
      receitasEnriquecidas.sort(
        (a, b) => b.ingredientes_match.length - a.ingredientes_match.length,
      );

      return {
        total_ingredientes_disponiveis: ingredientesPrincipais.length,
        receitas_sugeridas: receitasEnriquecidas.slice(0, 10), // Top 10
        query_utilizada: query,
        resumo: {
          receitas_encontradas: receitasEnriquecidas.length,
          ingredientes_usados: ingredientesPrincipais,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao sugerir receitas:', error);
      throw error;
    }
  }

  /**
   * Formata query para busca no Google
   * Exemplo: "arroz, feijão, carne" → "receitas com arroz feijão e carne"
   */
  private formatarQuery(ingredientes: string[]): string {
    if (ingredientes.length === 0) return '';

    // Pegar os 3-4 ingredientes principais
    const principais = ingredientes.slice(0, 4);

    // Formatar: "receitas com arroz, feijão e carne"
    if (principais.length === 1) {
      return `receitas com ${principais[0]}`;
    }

    if (principais.length === 2) {
      return `receitas com ${principais[0]} e ${principais[1]}`;
    }

    const todos = principais.slice(0, -1).join(', ');
    const ultimo = principais[principais.length - 1];
    return `receitas com ${todos} e ${ultimo}`;
  }

  /**
   * Busca receitas no Google
   * STUB para integração futura com Google Search API ou scraping
   *
   * Implementações possíveis:
   * 1. Google Search API (requer key)
   * 2. SerpAPI (requer key)
   * 3. Web scraping com Puppeteer/Cheerio
   * 4. Banco de dados local de receitas
   */
  private async buscarReceitasGoogle(query: string): Promise<ReceitaSugerida[]> {
    this.logger.warn(
      `Busca no Google não implementada ainda. Query: "${query}"`,
    );

    // STUB: Retornar mock data por enquanto
    return [
      {
        titulo: 'Receitas com ' + query.replace('receitas com ', ''),
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        ingredientes_match: [],
        fonte: 'google_search',
        data_sugestao: new Date(),
      },
    ];
  }

  /**
   * Encontra quais ingredientes do usuário aparecem no título da receita
   */
  private encontrarIngredientsMatch(
    titulo: string,
    ingredientes: string[],
  ): string[] {
    const tituloLower = titulo.toLowerCase();
    return ingredientes.filter((ing) =>
      tituloLower.includes(ing.toLowerCase()),
    );
  }

  /**
   * Retorna receitas personalizadas com score baseado no perfil aprendido do usuário.
   *
   * Score:
   *  + cobertura de ingredientes disponíveis   (peso 0.5)
   *  + match com ingredientes favoritos         (peso 0.3)
   *  + ingredientes vencendo em breve           (bônus 0.1)
   *  - match com ingredientes de aversão        (penalidade -0.4)
   *  - feita nos últimos 7 dias                 (penalidade -0.6)
   *
   * Pool > 70% → top 10 → retorna 5 aleatórios.
   */
  async paraMim(usuarioId: string, modoAlimentar?: string): Promise<ReceitaParaMimResult[]> {
    // 1. Inventário atual
    const inventario = await this.inventarioRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['produto'],
    });
    const agora = new Date();
    const em7dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

    const idsDisponiveis = new Set(
      inventario
        .filter(i => i.produto?.ingrediente_receita)
        .map(i => i.produto_id),
    );
    const idsVencendo = new Set(
      inventario
        .filter(i => i.data_validade && new Date(i.data_validade) <= em7dias)
        .map(i => i.produto_id),
    );

    // 2. Preferências aprendidas
    const prefs = await this.prefAprendidaRepository.find({ where: { usuario_id: usuarioId } });
    const favoritos = new Set(
      prefs.filter(p => p.tipo === TipoPreferencia.INGREDIENTE_FAVORITO).map(p => p.valor),
    );
    const aversoes = new Set(
      prefs.filter(p => p.tipo === TipoPreferencia.INGREDIENTE_AVERSAO).map(p => p.valor),
    );

    // 3. Receitas feitas nos últimos 7 dias
    const sete = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentes = await this.executadaRepository
      .createQueryBuilder('e')
      .select('e.receita_id')
      .where('e.usuario_id = :uid', { uid: usuarioId })
      .andWhere('e.data_execucao >= :sete', { sete })
      .getMany();
    const idsRecentes = new Set(recentes.map(r => r.receita_id));

    // 4. Buscar todas as receitas com ingredientes
    const where: any = {};
    if (modoAlimentar && modoAlimentar !== 'normal') {
      where.tags_dieta = modoAlimentar;
    }

    const receitas = await this.receitaRepository.find({
      relations: ['ingredientes', 'ingredientes.produto'],
    });

    // 5. Calcular score
    const scored = receitas.map(receita => {
      const ingredientes = receita.ingredientes || [];
      const total = ingredientes.filter(i => !i.opcional).length || 1;

      let cobertos = 0;
      let temVencendo = false;
      let temFavorito = false;
      let temAversao = false;

      for (const ing of ingredientes) {
        const produtoId = ing.produto_id;
        const nome = ing.produto?.nome?.toLowerCase().trim() ?? '';

        if (idsDisponiveis.has(produtoId)) cobertos++;
        if (idsVencendo.has(produtoId)) temVencendo = true;
        if (favoritos.has(nome)) temFavorito = true;
        if (aversoes.has(nome)) temAversao = true;
      }

      const cobertura = cobertos / total;

      let score = cobertura * 0.5;
      if (temFavorito) score += 0.3;
      if (temVencendo) score += 0.1;
      if (temAversao) score -= 0.4;
      if (idsRecentes.has(receita.id)) score -= 0.6;

      return { receita, score, cobertura: Math.round(cobertura * 100) };
    });

    // 6. Pool > 70%, top 10, 5 aleatórios
    const pool = scored
      .filter(r => r.score > 0.7)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Shuffle e pega 5
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 5);

    return shuffled.map(({ receita, score, cobertura }) => ({
      id: receita.id,
      nome: receita.nome,
      imagem_url: receita.imagem_url,
      tempo_preparo: receita.tempo_preparo,
      dificuldade: receita.dificuldade,
      cobertura,
      score: Math.round(score * 100) / 100,
      disponivel: cobertura >= 70,
    }));
  }

  /**
   * Retorna "desafios": receitas que o usuário nunca fez, com 40-75% de cobertura.
   * Ordena por: mais próximas de 75% primeiro (falta pouco pra completar).
   */
  async desafios(usuarioId: string): Promise<ReceitaDesafioResult[]> {
    const inventario = await this.inventarioRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['produto'],
    });

    const idsDisponiveis = new Set(
      inventario
        .filter(i => i.produto?.ingrediente_receita)
        .map(i => i.produto_id),
    );
    const nomesDisponiveis = new Set(
      inventario
        .filter(i => i.produto?.ingrediente_receita)
        .map(i => i.produto?.nome?.toLowerCase().trim())
        .filter(Boolean) as string[],
    );

    // Receitas já feitas pelo usuário (qualquer data)
    const executadas = await this.executadaRepository
      .createQueryBuilder('e')
      .select('e.receita_id')
      .where('e.usuario_id = :uid', { uid: usuarioId })
      .getMany();
    const idsJaFeitas = new Set(executadas.map(e => e.receita_id));

    const receitas = await this.receitaRepository.find({
      relations: ['ingredientes', 'ingredientes.produto'],
    });

    const candidatos: ReceitaDesafioResult[] = [];

    for (const receita of receitas) {
      if (idsJaFeitas.has(receita.id)) continue;

      const ingredientes = (receita.ingredientes || []).filter(i => !i.opcional);
      const total = ingredientes.length;
      if (total === 0) continue;

      const faltando: string[] = [];
      let cobertos = 0;

      for (const ing of ingredientes) {
        const temPorId = idsDisponiveis.has(ing.produto_id);
        const temPorNome = ing.produto?.nome
          ? nomesDisponiveis.has(ing.produto.nome.toLowerCase().trim())
          : false;

        if (temPorId || temPorNome) {
          cobertos++;
        } else {
          faltando.push(ing.produto?.nome || ing.produto_id);
        }
      }

      const cobertura = cobertos / total;

      // Desafio: 40-75% cobertos (falta de 1 a ~60%)
      if (cobertura >= 0.4 && cobertura < 0.76) {
        candidatos.push({
          id: receita.id,
          nome: receita.nome,
          imagem_url: receita.imagem_url ?? null,
          tempo_preparo: receita.tempo_preparo ?? null,
          dificuldade: receita.dificuldade,
          cobertura: Math.round(cobertura * 100),
          ingredientes_faltando: faltando.slice(0, 5),
          total_ingredientes: total,
        });
      }
    }

    // Ordena por cobertura DESC (mais próximos de completar primeiro), pega top 6
    return candidatos
      .sort((a, b) => b.cobertura - a.cobertura)
      .slice(0, 6);
  }

  /**
   * Salva receita sugerida no banco
   * Conecta sugestão ao usuário
   */
  async salvarSugestao(
    usuarioId: string,
    receitaSugerida: ReceitaSugerida,
  ): Promise<void> {
    try {
      // TODO: Implementar save quando banco de sugestões estiver pronto
      this.logger.log(
        `Salvando sugestão para ${usuarioId}: "${receitaSugerida.titulo}"`,
      );
    } catch (error) {
      this.logger.error('Erro ao salvar sugestão:', error);
    }
  }
}
