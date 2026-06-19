import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Receita } from '../entities/receita.entity';
import { RecipeGeneratorService } from '../services/recipe-generator.service';
import { RecipeValidationService } from '../services/recipe-validation.service';
import { IngredientNormalizerService } from '../services/ingredient-normalizer.service';

const MAX_VALIDACOES_POR_DIA = 20;

export interface CleanupReport {
  deduplicadas: number;
  chavesReprocessadas: number;
  imagensRecuperadas: number;
  validacoesEnfileiradas: number;
  protagonistasAusentes: number;
}

@Injectable()
export class RecipeCleanupJob {
  private readonly logger = new Logger('RecipeCleanupJob');

  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
    private readonly generatorService: RecipeGeneratorService,
    private readonly validationService: RecipeValidationService,
    private readonly normalizerService: IngredientNormalizerService,
  ) {}

  @Cron('0 4 * * *', { timeZone: 'America/Sao_Paulo' })
  async executar(): Promise<void> {
    this.logger.log('🧹 Iniciando RecipeCleanupJob...');
    const report = await this.executarManual();
    this.logger.log(
      `✅ Cleanup concluído: ${report.deduplicadas} duplicatas, ` +
      `${report.chavesReprocessadas} chaves reprocessadas, ` +
      `${report.imagensRecuperadas} imagens recuperadas, ` +
      `${report.validacoesEnfileiradas} validações Gemini, ` +
      `${report.protagonistasAusentes} receitas marcadas em_revisao`,
    );
  }

  async executarManual(): Promise<CleanupReport> {
    const report: CleanupReport = {
      deduplicadas: 0,
      chavesReprocessadas: 0,
      imagensRecuperadas: 0,
      validacoesEnfileiradas: 0,
      protagonistasAusentes: 0,
    };

    await this.deduplicar(report);
    await this.reprocessarChavesCorretas(report);
    await this.recuperarImagens(report);
    await this.validarScoresNulos(report);
    await this.detectarProtagonistasAusentes(report);

    return report;
  }

  // 1. Remove duplicatas por url_fonte (mantém mais recente)
  private async deduplicar(report: CleanupReport): Promise<void> {
    const duplicatas = await this.receitaRepo.query(`
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY url_fonte ORDER BY criado_em DESC NULLS LAST) AS rn
        FROM receitas
        WHERE url_fonte IS NOT NULL
      ) ranked
      WHERE rn > 1
    `);

    if (duplicatas.length === 0) return;

    await this.receitaRepo.query(
      `DELETE FROM receitas WHERE id = ANY($1)`,
      [duplicatas.map((d: any) => d.id)],
    );
    report.deduplicadas = duplicatas.length;
    this.logger.log(`🗑️ Removidas ${duplicatas.length} receitas duplicadas`);
  }

  // 2. Reprocessa ingredientes_chave corrompidos (com dígito, < 3 chars, conjunção)
  private async reprocessarChavesCorretas(report: CleanupReport): Promise<void> {
    const receitas = await this.receitaRepo.find({
      select: ['id', 'nome', 'ingredientes_chave'],
    });

    const corrompidas = receitas.filter((r) => {
      if (!r.ingredientes_chave?.length) return true;
      return r.ingredientes_chave.some(
        (c) => c.length < 3 || /\d/.test(c) || /^(?:e|ou|de|do|da)\s/i.test(c),
      );
    });

    for (const r of corrompidas) {
      try {
        const receitaCompleta = await this.receitaRepo.findOne({
          where: { id: r.id },
          select: ['id', 'ingredientes_chave'],
        });
        if (!receitaCompleta?.ingredientes_chave) continue;

        // Re-normaliza a partir das chaves existentes (que ainda contêm info útil)
        const novasChaves = this.normalizerService.extrairChaves(receitaCompleta.ingredientes_chave);
        if (novasChaves.length > 0) {
          await this.receitaRepo.update(r.id, { ingredientes_chave: novasChaves });
          report.chavesReprocessadas++;
        }
      } catch (err: any) {
        this.logger.warn(`Erro ao reprocessar chaves de "${r.nome}": ${err.message}`);
      }
    }

    if (report.chavesReprocessadas > 0) {
      this.logger.log(`🔑 ${report.chavesReprocessadas} receitas com chaves reprocessadas`);
    }
  }

  // 3. Busca imagem para receitas sem imagem (máx 10 por execução para não estourar quota Unsplash)
  private async recuperarImagens(report: CleanupReport): Promise<void> {
    const semImagem = await this.receitaRepo.find({
      where: { imagem_url: IsNull() },
      select: ['id', 'nome'],
      take: 10,
    });

    for (const r of semImagem) {
      try {
        const imagem = await this.generatorService.buscarImagemReceita(r.nome);
        if (imagem) {
          await this.receitaRepo.update(r.id, { imagem_url: imagem });
          report.imagensRecuperadas++;
        }
      } catch (err: any) {
        this.logger.warn(`Erro ao buscar imagem para "${r.nome}": ${err.message}`);
      }
    }

    if (report.imagensRecuperadas > 0) {
      this.logger.log(`🖼️ ${report.imagensRecuperadas} imagens recuperadas`);
    }
  }

  // 4. Valida receitas com validation_score NULL (máx MAX_VALIDACOES_POR_DIA)
  private async validarScoresNulos(report: CleanupReport): Promise<void> {
    const semScore = await this.receitaRepo.find({
      where: { validation_score: IsNull() },
      select: ['id', 'nome'],
      take: MAX_VALIDACOES_POR_DIA,
    });

    for (const r of semScore) {
      try {
        const receitaCompleta = await this.receitaRepo.findOne({
          where: { id: r.id },
        });
        if (!receitaCompleta) continue;

        const ingredientes = receitaCompleta.ingredientes_chave ?? [];
        const validacao = await this.validationService.validar({
          titulo: receitaCompleta.nome,
          ingredientes,
          modo_preparo: receitaCompleta.modo_preparo ?? '',
          tempo_preparo: String(receitaCompleta.tempo_preparo ?? 30),
          rendimento: String(receitaCompleta.rendimento_porcoes ?? 4),
        });

        const updates: Partial<Receita> = {
          validation_score: validacao.score,
          validation_issues: validacao.issues.join(' | ') || null,
        };
        if (validacao.status === 'descartar') {
          updates.status_moderacao = 'em_revisao';
        }

        await this.receitaRepo.update(r.id, updates);
        report.validacoesEnfileiradas++;
      } catch (err: any) {
        this.logger.warn(`Erro ao validar "${r.nome}": ${err.message}`);
      }
    }

    if (report.validacoesEnfileiradas > 0) {
      this.logger.log(`🤖 ${report.validacoesEnfileiradas} receitas validadas pelo Gemini`);
    }
  }

  // 5. Detecta receitas onde protagonista no título não está nos ingredientes_chave
  private async detectarProtagonistasAusentes(report: CleanupReport): Promise<void> {
    const PROTAGONISTAS_SIMPLES: Record<string, string[]> = {
      'frango': ['frango', 'peito de frango', 'coxa'],
      'carne': ['carne', 'patinho', 'alcatra', 'maminha', 'picanha'],
      'peixe': ['peixe', 'tilapia', 'atum', 'bacalhau', 'merluza'],
      'camarao': ['camarao'],
      'salmao': ['salmao'],
      'bacon': ['bacon'],
      'linguica': ['linguica', 'calabresa'],
      'feijao': ['feijao'],
      'brócolis': ['brocolis'],
      'espinafre': ['espinafre'],
      'lentilha': ['lentilha'],
    };

    const receitas = await this.receitaRepo.find({
      where: { status_moderacao: 'ok' },
      select: ['id', 'nome', 'ingredientes_chave'],
    });

    const idsParaMarcar: string[] = [];

    for (const r of receitas) {
      const tituloNorm = r.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const chaves = (r.ingredientes_chave ?? []).join(' ');

      for (const [palavra, sinonimos] of Object.entries(PROTAGONISTAS_SIMPLES)) {
        if (tituloNorm.includes(palavra)) {
          const temProtagonista = sinonimos.some((s) => chaves.includes(s));
          if (!temProtagonista) {
            idsParaMarcar.push(r.id);
            this.logger.debug(`⚠️ Protagonista ausente em "${r.nome}" (${palavra})`);
            break;
          }
        }
      }
    }

    if (idsParaMarcar.length > 0) {
      await this.receitaRepo.query(
        `UPDATE receitas SET status_moderacao = 'em_revisao' WHERE id = ANY($1)`,
        [idsParaMarcar],
      );
      report.protagonistasAusentes = idsParaMarcar.length;
      this.logger.log(`⚠️ ${idsParaMarcar.length} receitas marcadas como em_revisao (protagonista ausente)`);
    }
  }
}
