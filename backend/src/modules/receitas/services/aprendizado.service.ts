import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PreferenciaAprendida, TipoPreferencia } from '../../usuarios/entities/preferencia-aprendida.entity';
import { ReceitaExecutada } from '../entities/receita-executada.entity';

@Injectable()
export class AprendizadoService {
  constructor(
    @InjectRepository(PreferenciaAprendida)
    private readonly prefRepo: Repository<PreferenciaAprendida>,
    @InjectRepository(ReceitaExecutada)
    private readonly executadaRepo: Repository<ReceitaExecutada>,
    private readonly dataSource: DataSource,
  ) {}

  async derivarPreferencias(usuarioId: string): Promise<void> {
    // Busca execuções com avaliação e ingredientes da receita
    const execucoes = await this.dataSource.query(`
      SELECT
        e.avaliacao,
        e.receita_id,
        COUNT(*) OVER (PARTITION BY e.receita_id) AS vezes_feita,
        r.tags_dieta,
        p.nome AS ingrediente_nome
      FROM receitas_executadas e
      JOIN receitas r ON r.id = e.receita_id
      LEFT JOIN receita_ingredientes ri ON ri.receita_id = r.id
      LEFT JOIN produtos p ON p.id = ri.produto_id
      WHERE e.usuario_id = $1
        AND e.avaliacao IS NOT NULL
        AND p.nome IS NOT NULL
    `, [usuarioId]);

    for (const row of execucoes) {
      const nota: number = row.avaliacao;
      const vezes: number = parseInt(row.vezes_feita, 10);
      const ingrediente: string = row.ingrediente_nome?.toLowerCase().trim();
      const tags: string[] = row.tags_dieta ? row.tags_dieta.split(',').map((t: string) => t.trim()) : [];

      if (!ingrediente) continue;

      if (nota >= 4) {
        const scoreDelta = 0.3 + (vezes > 1 ? 0.2 : 0);
        await this.upsertPreferencia(usuarioId, TipoPreferencia.INGREDIENTE_FAVORITO, ingrediente, scoreDelta);
        for (const tag of tags) {
          await this.upsertPreferencia(usuarioId, TipoPreferencia.CATEGORIA_FAVORITA, tag, 0.2);
        }
      } else if (nota <= 2) {
        await this.upsertPreferencia(usuarioId, TipoPreferencia.INGREDIENTE_AVERSAO, ingrediente, 0.5);
        for (const tag of tags) {
          await this.upsertPreferencia(usuarioId, TipoPreferencia.CATEGORIA_AVERSAO, tag, 0.3);
        }
      }
    }
  }

  async perfilAprendizado(usuarioId: string): Promise<PerfilAprendizadoDto> {
    const prefs = await this.prefRepo.find({ where: { usuario_id: usuarioId } });

    const favoritos = prefs.filter(p => p.tipo === TipoPreferencia.INGREDIENTE_FAVORITO);
    const aversoes = prefs.filter(p => p.tipo === TipoPreferencia.INGREDIENTE_AVERSAO ||
                                       p.tipo === TipoPreferencia.CATEGORIA_AVERSAO);
    const categorias = prefs.filter(p => p.tipo === TipoPreferencia.CATEGORIA_FAVORITA);

    const execucoes = await this.executadaRepo.count({ where: { usuario_id: usuarioId } });

    // Porcentagem de preenchimento de cada dimensão (cap 100%)
    return {
      ingredientes_favoritos: Math.min(100, favoritos.length * 10),
      gostos_e_aversoes: Math.min(100, aversoes.length * 15),
      ritmo_de_cozinha: Math.min(100, execucoes * 5),
      categorias_preferidas: Math.min(100, categorias.length * 12),
      total_avaliacoes: execucoes,
    };
  }

  private async upsertPreferencia(
    usuarioId: string,
    tipo: TipoPreferencia,
    valor: string,
    scoreDelta: number,
  ): Promise<void> {
    const existing = await this.prefRepo.findOne({
      where: { usuario_id: usuarioId, tipo, valor },
    });

    if (existing) {
      await this.prefRepo.update(existing.id, {
        score: Math.min(1, existing.score + scoreDelta),
        contagem: existing.contagem + 1,
      });
    } else {
      await this.prefRepo.save(
        this.prefRepo.create({
          usuario_id: usuarioId,
          tipo,
          valor,
          score: Math.min(1, scoreDelta),
          contagem: 1,
        }),
      );
    }
  }
}

export interface PerfilAprendizadoDto {
  ingredientes_favoritos: number;
  gostos_e_aversoes: number;
  ritmo_de_cozinha: number;
  categorias_preferidas: number;
  total_avaliacoes: number;
}
