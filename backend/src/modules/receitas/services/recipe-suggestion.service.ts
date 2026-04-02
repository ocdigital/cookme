import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Receita } from '../entities/receita.entity';
import { Produto } from '../../produtos/entities/produto.entity';

export interface ReceitaSugerida {
  titulo: string;
  url: string;
  ingredientes_match: string[]; // Quais dos seus ingredientes estão nela
  fonte: string; // "google_search" | "api_externa"
  data_sugestao: Date;
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
