import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receita } from '../entities/receita.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { ReceitaBancoService } from './receita-banco.service';
import { TudoGostosoScraperService } from './tudogostoso-scraper.service';
import { ReceiteriaCrawlerService } from './receiteria-scraper.service';
import { RecipeGeneratorService } from './recipe-generator.service';
import { IngredientNormalizerService } from './ingredient-normalizer.service';

const MIN_RECEITAS_POR_INGREDIENTE = 10;
const MAX_INGREDIENTES_POR_CICLO = 15;
const RECEITAS_POR_SITE = 5;
// Ingredientes base para bootstrap quando banco vazio (sem produtos cadastrados ainda)
const INGREDIENTES_BASE = [
  'frango', 'carne', 'arroz', 'feijao', 'ovo', 'batata', 'macarrao',
  'peixe', 'camarao', 'cebola', 'alho', 'tomate', 'queijo', 'leite',
  'mandioca', 'bisteca', 'linguica', 'abobrinha', 'cenoura', 'brocolis',
  'carne moida', 'frango assado', 'arroz integral', 'feijao preto',
  'bife', 'sopa', 'strogonoff', 'torta salgada', 'moqueca', 'risoto',
  'lasanha', 'quiche', 'farofa', 'caldo', 'refogado de legumes',
];

@Injectable()
export class RecipeCrawlerService {
  private readonly logger = new Logger('RecipeCrawlerService');
  private isRunning = false;

  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
    @InjectRepository(Produto)
    private readonly produtoRepo: Repository<Produto>,
    private readonly receitaBanco: ReceitaBancoService,
    private readonly tudoGostoso: TudoGostosoScraperService,
    private readonly receiteria: ReceiteriaCrawlerService,
    private readonly recipeGenerator: RecipeGeneratorService,
    private readonly normalizer: IngredientNormalizerService,
  ) {}

  /**
   * Crawl proativo: diariamente às 02:00, identifica ingredientes com poucas receitas
   * e busca mais em TudoGostoso + Receiteria.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async crawlProativo(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Crawler já em execução, pulando ciclo');
      return;
    }

    this.isRunning = true;
    this.logger.log('🤖 Iniciando crawl proativo de receitas...');

    try {
      const ingredientesBaixo = await this.identificarIngredientesComPoucasReceitas();
      if (ingredientesBaixo.length === 0) {
        this.logger.log('✅ Todos os ingredientes têm receitas suficientes');
        return;
      }

      this.logger.log(`📋 ${ingredientesBaixo.length} ingrediente(s) precisam de mais receitas: ${ingredientesBaixo.slice(0, 5).join(', ')}...`);

      let totalSalvas = 0;
      for (const ingrediente of ingredientesBaixo.slice(0, MAX_INGREDIENTES_POR_CICLO)) {
        const salvas = await this.crawlearIngrediente(ingrediente);
        totalSalvas += salvas;
        // Pausa entre ingredientes para não sobrecarregar os sites
        await this.sleep(2000);
      }

      this.logger.log(`✅ Crawl concluído: ${totalSalvas} receitas novas salvas`);
    } catch (err: any) {
      this.logger.error(`❌ Erro no crawl proativo: ${err.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Crawl manual — pode ser triggado via API admin.
   * Aceita lista específica de ingredientes ou usa detecção automática.
   */
  async crawlearManual(ingredientes?: string[]): Promise<{ ingredientes: string[]; totalSalvas: number }> {
    if (this.isRunning) {
      return { ingredientes: [], totalSalvas: 0 };
    }

    this.isRunning = true;
    let alvos: string[];

    try {
      if (ingredientes?.length) {
        alvos = ingredientes;
      } else {
        alvos = await this.identificarIngredientesComPoucasReceitas();
      }

      let totalSalvas = 0;
      for (const ing of alvos.slice(0, MAX_INGREDIENTES_POR_CICLO)) {
        totalSalvas += await this.crawlearIngrediente(ing);
        await this.sleep(1500);
      }

      return { ingredientes: alvos.slice(0, MAX_INGREDIENTES_POR_CICLO), totalSalvas };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Identifica produtos marcados como ingrediente que têm poucas receitas no banco.
   * Se nenhum produto cadastrado ainda, retorna lista base para bootstrap.
   */
  private async identificarIngredientesComPoucasReceitas(): Promise<string[]> {
    const produtos = await this.produtoRepo.find({
      where: { ingrediente_receita: true },
      select: ['nome', 'nome_display'] as any,
      order: { nome: 'ASC' } as any,
    });

    // Sem produtos cadastrados — checa se precisa de mais receitas e usa lista base
    if (produtos.length === 0) {
      const totalReceitas = await this.receitaRepo.count();
      if (totalReceitas < 300) {
        this.logger.log(`🌱 Bootstrap: ${totalReceitas} receitas, sem produtos — crawleando lista base`);
        return [...INGREDIENTES_BASE];
      }
      // Banco tem receitas suficientes para usuário começar, aguarda produtos serem cadastrados
      return [];
    }

    const receitas = await this.receitaRepo
      .createQueryBuilder('r')
      .where('r.ingredientes_chave IS NOT NULL')
      .andWhere("r.status_moderacao = 'ok'")
      .select(['r.ingredientes_chave', 'r.nome'])
      .getMany();

    const contagemPorIngrediente = new Map<string, number>();
    for (const receita of receitas) {
      for (const chave of receita.ingredientes_chave || []) {
        contagemPorIngrediente.set(chave, (contagemPorIngrediente.get(chave) || 0) + 1);
      }
    }

    const ingredientesComPoucas: string[] = [];
    for (const produto of produtos) {
      const nome = (produto as any).nome_display || produto.nome;
      const norm = this.normalizer.normalizar(nome);
      const chave = norm?.nomeCanônico ?? nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

      const quantidade = contagemPorIngrediente.get(chave) || 0;
      if (quantidade < MIN_RECEITAS_POR_INGREDIENTE) {
        ingredientesComPoucas.push(nome);
      }
    }

    return ingredientesComPoucas;
  }

  /**
   * Crawlea um ingrediente específico em todos os sites configurados.
   */
  private async crawlearIngrediente(ingrediente: string): Promise<number> {
    const termos = this.normalizer.termosParaBusca(ingrediente);
    const termoPrincipal = termos[0];

    this.logger.log(`🔍 Crawleando "${ingrediente}" (termo: "${termoPrincipal}")`);

    let totalSalvas = 0;

    // TudoGostoso
    try {
      const receitas = await this.tudoGostoso.buscarReceitasPorKeyword(termoPrincipal, RECEITAS_POR_SITE);
      for (const r of receitas) {
        try {
          const enriquecida = await this.recipeGenerator.enriquecerReceita(r);
          if (!enriquecida) continue;
          await this.receitaBanco.salvarReceitaGerada(enriquecida);
          totalSalvas++;
        } catch {
          // Duplicata ou erro — ignora
        }
      }
      this.logger.log(`TudoGostoso: ${receitas.length} receitas para "${termoPrincipal}"`);
    } catch (err: any) {
      this.logger.warn(`TudoGostoso falhou para "${termoPrincipal}": ${err.message}`);
    }

    await this.sleep(1000);

    // Receiteria — usa um dos termos expandidos para diversidade
    const termoAlternativo = termos[1] || termoPrincipal;
    try {
      const receitas = await this.receiteria.buscarPorKeyword(termoAlternativo, RECEITAS_POR_SITE);
      for (const r of receitas) {
        try {
          const enriquecida = await this.recipeGenerator.enriquecerReceita(r);
          if (!enriquecida) continue;
          await this.receitaBanco.salvarReceitaGerada(enriquecida);
          totalSalvas++;
        } catch {
          // Duplicata ou erro — ignora
        }
      }
      this.logger.log(`Receiteria: ${receitas.length} receitas para "${termoAlternativo}"`);
    } catch (err: any) {
      this.logger.warn(`Receiteria falhou para "${termoAlternativo}": ${err.message}`);
    }

    return totalSalvas;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
