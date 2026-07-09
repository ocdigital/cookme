import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ProductKnowledgeBase } from '../product-classification/entities/product-knowledge-base.entity';
import {
  EstagioCanonizacao,
  OcrAliasService,
} from '../product-classification/services/ocr-alias.service';
import { CONFIANCA_POR_ESTAGIO, EstagioResolucao } from './engine.types';

const MAPA_ESTAGIO: Record<EstagioCanonizacao, EstagioResolucao> = {
  ean: 'ean',
  correcao: 'correcao',
  abreviacao: 'dicionario',
  kb_exato: 'kb',
  fuzzy: 'fuzzy',
  regex: 'regex',
  normalizer: 'normalizer',
  fallback: 'fallback',
};

function forca(estagio?: string | null): number {
  const mapeado = estagio ? MAPA_ESTAGIO[estagio as EstagioCanonizacao] : undefined;
  return mapeado ? CONFIANCA_POR_ESTAGIO[mapeado] : 0;
}

/**
 * Re-canonização retroativa (PLANO_PRECISAO_ENGINE.md §11 A9): quando o
 * vocabulário evolui (ex: Camada 1 aprende "provolone"), itens já gravados
 * na KB com o palpite antigo ("queijo") ficam errados para sempre — e são
 * servidos de volta como kb_exato (alta confiança emprestada, ver A3).
 *
 * Reprocessa a KB com o vocabulário ATUAL e só atualiza quando o novo
 * resultado é de estágio igual ou mais forte que o antigo — nunca troca um
 * palpite bom por um pior. Nunca toca `corrigido_manual=true`: correção
 * humana é a verdade máxima e não se sobrepõe a heurística nenhuma.
 *
 * Mesmo padrão do `IngredientCleanerService` (módulo receitas): job batch,
 * idempotente, seguro para rodar em cron.
 */
@Injectable()
export class RecanonizacaoService {
  private readonly logger = new Logger(RecanonizacaoService.name);

  constructor(
    @InjectRepository(ProductKnowledgeBase)
    private readonly kbRepo: Repository<ProductKnowledgeBase>,
    private readonly ocrAlias: OcrAliasService,
  ) {}

  async reprocessar(limite = 200): Promise<{
    processadas: number;
    atualizadas: number;
    erros: number;
  }> {
    const linhas = await this.kbRepo.find({
      where: { corrigido_manual: Not(true) },
      order: { atualizado_em: 'ASC' },
      take: limite,
    });

    let processadas = 0;
    let atualizadas = 0;
    let erros = 0;

    for (const linha of linhas) {
      processadas++;
      try {
        const { canonical, estagio } = await this.ocrAlias.resolverComEstagio(
          linha.product_name,
        );

        const mudouCanonical = canonical && canonical !== linha.canonical_ingredient;
        const naoPiora = forca(estagio) >= forca(linha.origem_estagio);

        if (mudouCanonical && naoPiora) {
          await this.kbRepo.update(linha.id, {
            canonical_ingredient: canonical,
            origem_estagio: estagio,
          } as Partial<ProductKnowledgeBase>);
          this.logger.log(
            `Re-canonizado: "${linha.product_name}" [${linha.canonical_ingredient} (${linha.origem_estagio})] → [${canonical} (${estagio})]`,
          );
          atualizadas++;
        }
      } catch (err: any) {
        this.logger.error(`Erro reprocessando "${linha.product_name}": ${err?.message}`);
        erros++;
      }
    }

    return { processadas, atualizadas, erros };
  }
}
