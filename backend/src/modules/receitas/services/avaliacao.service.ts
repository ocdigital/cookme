import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Receita } from '../entities/receita.entity';
import { ReceitaExecutada } from '../entities/receita-executada.entity';
import { AprendizadoService } from './aprendizado.service';

export interface AvaliacaoDto {
  nota: number;       // 1-5
  comentario?: string;
}

export interface ComentarioPublico {
  id: string;
  nota: number;
  comentario: string | null;
  autor_nome: string;
  autor_avatar: string | null;
  criado_em: Date;
}

@Injectable()
export class AvaliacaoService {
  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
    @InjectRepository(ReceitaExecutada)
    private readonly executadaRepo: Repository<ReceitaExecutada>,
    private readonly dataSource: DataSource,
    private readonly aprendizadoService: AprendizadoService,
  ) {}

  async avaliar(receitaId: string, usuarioId: string, dto: AvaliacaoDto) {
    if (dto.nota < 1 || dto.nota > 5) {
      throw new BadRequestException('Nota deve ser entre 1 e 5');
    }

    const receita = await this.receitaRepo.findOne({ where: { id: receitaId } });
    if (!receita) throw new NotFoundException('Receita não encontrada');

    // Busca a execução mais recente do usuário para essa receita
    const execucao = await this.executadaRepo.findOne({
      where: { receita_id: receitaId, usuario_id: usuarioId },
      order: { criado_em: 'DESC' },
    });

    if (execucao) {
      // Atualiza a avaliação existente
      await this.executadaRepo.update(execucao.id, {
        avaliacao: dto.nota,
        comentario: dto.comentario ?? execucao.comentario,
      });
    } else {
      // Cria registro de execução com avaliação (usuário avaliou sem ter marcado que fez)
      const novo = this.executadaRepo.create();
      novo.receita_id = receitaId;
      novo.usuario_id = usuarioId;
      novo.data_execucao = new Date();
      novo.avaliacao = dto.nota;
      if (dto.comentario) novo.comentario = dto.comentario;
      await this.executadaRepo.save(novo);
    }

    await this.recalcularMedia(receitaId);

    // Atualiza preferências aprendidas em background (não bloqueia resposta)
    this.aprendizadoService.derivarPreferencias(usuarioId).catch(() => {});

    const atualizada = await this.receitaRepo.findOne({ where: { id: receitaId } });
    return { sucesso: true, avaliacao_media: atualizada?.avaliacao_media };
  }

  async listarComentarios(receitaId: string): Promise<ComentarioPublico[]> {
    return this.dataSource.query(`
      SELECT
        e.id,
        e.avaliacao  AS nota,
        e.comentario,
        u.nome       AS autor_nome,
        u.avatar_url AS autor_avatar,
        e.criado_em
      FROM receitas_executadas e
      JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.receita_id = $1
        AND e.avaliacao IS NOT NULL
      ORDER BY e.criado_em DESC
      LIMIT 50
    `, [receitaId]);
  }

  async minhaAvaliacao(receitaId: string, usuarioId: string) {
    const execucao = await this.executadaRepo.findOne({
      where: { receita_id: receitaId, usuario_id: usuarioId },
      order: { criado_em: 'DESC' },
    });
    return {
      nota: execucao?.avaliacao ?? null,
      comentario: execucao?.comentario ?? null,
    };
  }

  private async recalcularMedia(receitaId: string) {
    const result = await this.dataSource.query(`
      SELECT
        ROUND(AVG(avaliacao)::numeric, 1) AS media,
        COUNT(*)                          AS total
      FROM receitas_executadas
      WHERE receita_id = $1 AND avaliacao IS NOT NULL
    `, [receitaId]);

    const media = Math.round((parseFloat(result[0]?.media) || 0) * 10) / 10;
    await this.receitaRepo.update(receitaId, { avaliacao_media: media });
  }
}
