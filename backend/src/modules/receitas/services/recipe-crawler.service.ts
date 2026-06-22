import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReceitaBancoService } from './receita-banco.service';
import { TudoGostosoScraperService } from './tudogostoso-scraper.service';
import { RecipeGeneratorService } from './recipe-generator.service';
import { IngredientNormalizerService } from './ingredient-normalizer.service';
import { CronLogService } from '../../admin/services/cron-log.service';

const MAX_RECEITAS_POR_CICLO = 20;
// Categorias TudoGostoso em rotação — crawler pega 2 por hora, independente de inventário
const CATEGORIAS_ROTACAO = [
  { url: 'https://www.tudogostoso.com.br/categorias/2-carnes', tag: undefined },
  { url: 'https://www.tudogostoso.com.br/categorias/3-aves', tag: undefined },
  { url: 'https://www.tudogostoso.com.br/categorias/4-peixes-e-frutos-do-mar', tag: undefined },
  { url: 'https://www.tudogostoso.com.br/categorias/8-massas', tag: undefined },
  { url: 'https://www.tudogostoso.com.br/categorias/10-sopas-e-caldos', tag: undefined },
  { url: 'https://www.tudogostoso.com.br/categorias/12-arroz-e-risoto', tag: undefined },
  { url: 'https://www.tudogostoso.com.br/categorias/14-saladas', tag: undefined },
  { url: 'https://www.tudogostoso.com.br/categorias/1340-fitness', tag: 'fitness' as const },
  { url: 'https://www.tudogostoso.com.br/categorias/1340-fitness', tag: 'fitness' as const },
];
// Keywords extras rotacionadas alternando com categorias
const KEYWORDS_ROTACAO = [
  { q: 'receita vegetariana', tag: 'vegetariano' as const },
  { q: 'receita vegana', tag: 'vegano' as const },
  { q: 'receita fitness low carb', tag: 'fitness' as const },
  { q: 'frango grelhado', tag: undefined },
  { q: 'carne assada', tag: undefined },
  { q: 'macarrão ao molho', tag: undefined },
  { q: 'peixe grelhado', tag: undefined },
  { q: 'strogonoff frango', tag: undefined },
  { q: 'sopa legumes', tag: undefined },
  { q: 'risoto frango', tag: undefined },
  { q: 'lasanha', tag: undefined },
  { q: 'torta salgada', tag: undefined },
];

@Injectable()
export class RecipeCrawlerService {
  private readonly logger = new Logger('RecipeCrawlerService');
  private isRunning = false;

  constructor(
    private readonly receitaBanco: ReceitaBancoService,
    private readonly tudoGostoso: TudoGostosoScraperService,
    private readonly recipeGenerator: RecipeGeneratorService,
    private readonly normalizer: IngredientNormalizerService,
    private readonly cronLog: CronLogService,
  ) {}

  // Ponteiro de rotação persistido em memória entre ciclos
  private rotacaoIdx = 0;

  /**
   * Crawl contínuo: toda hora pega 2 fontes em rotação (categorias + keywords)
   * e salva receitas novas no banco — independente de inventário de usuários.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async crawlProativo(): Promise<void> {
    if (this.isRunning) {
      await this.cronLog.registrar({ job: 'crawl-proativo', status: 'skip', detalhe: 'Já em execução' });
      this.logger.warn('Crawler já em execução, pulando ciclo');
      return;
    }

    this.isRunning = true;
    const inicio = Date.now();
    const FONTES_TOTAL = CATEGORIAS_ROTACAO.length + KEYWORDS_ROTACAO.length;
    const idx1 = this.rotacaoIdx % FONTES_TOTAL;
    const idx2 = (this.rotacaoIdx + 1) % FONTES_TOTAL;
    this.rotacaoIdx = (this.rotacaoIdx + 2) % FONTES_TOTAL;

    const fonteNome = (idx: number) => {
      if (idx < CATEGORIAS_ROTACAO.length) return CATEGORIAS_ROTACAO[idx].url.split('/').pop() ?? `cat-${idx}`;
      return KEYWORDS_ROTACAO[idx - CATEGORIAS_ROTACAO.length].q;
    };
    const detalhes: string[] = [];

    this.logger.log(`🤖 Crawl contínuo — fontes [${idx1}, ${idx2}] de ${FONTES_TOTAL}`);

    try {
      let totalSalvas = 0;
      for (const idx of [idx1, idx2]) {
        const nome = fonteNome(idx);
        const salvas = await this.crawlearFonteIdx(idx);
        totalSalvas += salvas;
        detalhes.push(`${nome}: ${salvas}`);
        await this.sleep(3000);
      }
      this.logger.log(`✅ Crawl concluído: ${totalSalvas} receitas novas salvas`);
      await this.cronLog.registrar({
        job: 'crawl-proativo',
        status: 'ok',
        receitas_salvas: totalSalvas,
        detalhe: detalhes.join(' | '),
        duracao_ms: Date.now() - inicio,
      });
    } catch (err: any) {
      this.logger.error(`❌ Erro no crawl: ${err.message}`);
      await this.cronLog.registrar({
        job: 'crawl-proativo',
        status: 'erro',
        detalhe: err.message,
        duracao_ms: Date.now() - inicio,
      });
    } finally {
      this.isRunning = false;
    }
  }

  private async crawlearFonteIdx(idx: number): Promise<number> {
    const nCat = CATEGORIAS_ROTACAO.length;
    if (idx < nCat) {
      const { url, tag } = CATEGORIAS_ROTACAO[idx];
      this.logger.log(`📂 Categoria: ${url.split('/').pop()}`);
      return this.crawlearCategoria(url, tag);
    } else {
      const { q, tag } = KEYWORDS_ROTACAO[idx - nCat];
      this.logger.log(`🔍 Keyword: "${q}"`);
      return this.crawlearKeyword(q, tag);
    }
  }

  private async crawlearCategoria(url: string, tag?: 'fitness' | 'vegetariano' | 'vegano'): Promise<number> {
    let totalSalvas = 0;
    try {
      const receitas = await this.tudoGostoso.buscarReceitasPorCategoria(url, MAX_RECEITAS_POR_CICLO);
      for (const r of receitas) {
        try {
          if (tag) r.tags_dieta = [tag];
          const enriquecida = await this.recipeGenerator.enriquecerReceita(r);
          if (!enriquecida) continue;
          await this.receitaBanco.salvarReceitaGerada(enriquecida);
          totalSalvas++;
        } catch { /* duplicata ou erro — ignora */ }
      }
    } catch (err: any) {
      this.logger.warn(`Categoria ${url} falhou: ${err.message}`);
    }
    return totalSalvas;
  }

  private async crawlearKeyword(q: string, tag?: 'fitness' | 'vegetariano' | 'vegano'): Promise<number> {
    let totalSalvas = 0;
    try {
      const receitas = await this.tudoGostoso.buscarReceitasPorKeyword(q, MAX_RECEITAS_POR_CICLO);
      for (const r of receitas) {
        try {
          if (tag) r.tags_dieta = [tag];
          const enriquecida = await this.recipeGenerator.enriquecerReceita(r);
          if (!enriquecida) continue;
          await this.receitaBanco.salvarReceitaGerada(enriquecida);
          totalSalvas++;
        } catch { /* duplicata ou erro — ignora */ }
      }
    } catch (err: any) {
      this.logger.warn(`Keyword "${q}" falhou: ${err.message}`);
    }
    return totalSalvas;
  }

  /**
   * Crawl manual — triggado via API (/receitas/buscar-novas).
   * Se passados ingredientes, busca por keywords deles. Senão, avança rotação.
   */
  async crawlearManual(ingredientes?: string[]): Promise<{ ingredientes: string[]; totalSalvas: number }> {
    if (this.isRunning) {
      return { ingredientes: [], totalSalvas: 0 };
    }

    this.isRunning = true;
    try {
      let totalSalvas = 0;
      const alvos: string[] = [];

      if (ingredientes?.length) {
        for (const ing of ingredientes.slice(0, 10)) {
          const termos = this.normalizer.termosParaBusca(ing);
          const q = termos[0] || ing;
          alvos.push(q);
          totalSalvas += await this.crawlearKeyword(q);
          await this.sleep(1500);
        }
      } else {
        // Sem ingredientes — avança rotação como crawl automático
        const FONTES_TOTAL = CATEGORIAS_ROTACAO.length + KEYWORDS_ROTACAO.length;
        for (let i = 0; i < 3; i++) {
          const idx = (this.rotacaoIdx + i) % FONTES_TOTAL;
          totalSalvas += await this.crawlearFonteIdx(idx);
          await this.sleep(2000);
        }
        this.rotacaoIdx = (this.rotacaoIdx + 3) % FONTES_TOTAL;
      }

      return { ingredientes: alvos, totalSalvas };
    } finally {
      this.isRunning = false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
