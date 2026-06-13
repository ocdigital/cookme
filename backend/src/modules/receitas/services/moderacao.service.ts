import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Receita } from '../entities/receita.entity';
import { NotificacaoUsuarioService } from '@modules/notificacoes/services/notificacao-usuario.service';

@Injectable()
export class ModeracaoService {
  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
    private readonly notifUsuario: NotificacaoUsuarioService,
    private readonly dataSource: DataSource,
  ) {}

  // ── Usuário sugere nova foto ──────────────────────────────────────────────────

  async sugerirFoto(receitaId: string, autorId: string, fotoUrl: string) {
    const receita = await this.receitaRepo.findOne({ where: { id: receitaId } });
    if (!receita) throw new NotFoundException('Receita não encontrada');
    if (receita.foto_pendente_url) {
      throw new BadRequestException('Já existe uma foto aguardando moderação para esta receita');
    }

    await this.receitaRepo.update(receitaId, {
      foto_pendente_url: fotoUrl,
      foto_pendente_autor_id: autorId,
      foto_pendente_motivo_rejeicao: null,
    });

    await this.notifUsuario.enviar({
      usuario_id: autorId,
      tipo: 'foto_pendente',
      titulo: '📸 Foto enviada para análise',
      mensagem: `Sua foto para "${receita.nome}" está em análise. Você receberá uma notificação quando for revisada.`,
      dados: { receita_id: receitaId, receita_nome: receita.nome, foto_url: fotoUrl },
    });

    return { sucesso: true, mensagem: 'Foto enviada para moderação' };
  }

  // ── Admin: fila de moderação ──────────────────────────────────────────────────

  async listarFilaModeracao() {
    return this.dataSource.query(`
      SELECT
        r.id,
        r.nome,
        r.imagem_url,
        r.foto_pendente_url,
        r.foto_pendente_autor_id,
        r.atualizado_em,
        u.nome  AS autor_nome,
        u.email AS autor_email,
        u.avatar_url AS autor_avatar
      FROM receitas r
      LEFT JOIN usuarios u ON u.id = r.foto_pendente_autor_id
      WHERE r.foto_pendente_url IS NOT NULL
      ORDER BY r.atualizado_em ASC
    `);
  }

  // ── Admin: aprovar foto ───────────────────────────────────────────────────────

  async aprovarFoto(receitaId: string) {
    const receita = await this.receitaRepo.findOne({ where: { id: receitaId } });
    if (!receita) throw new NotFoundException('Receita não encontrada');
    if (!receita.foto_pendente_url) throw new BadRequestException('Sem foto pendente');

    const fotoAntiga = receita.imagem_url;
    await this.receitaRepo.update(receitaId, {
      imagem_url: receita.foto_pendente_url,
      foto_pendente_url: null,
      foto_pendente_autor_id: null,
      foto_pendente_motivo_rejeicao: null,
    });

    if (receita.foto_pendente_autor_id) {
      await this.notifUsuario.enviar({
        usuario_id: receita.foto_pendente_autor_id,
        tipo: 'foto_aprovada',
        titulo: '✅ Foto aprovada!',
        mensagem: `Sua foto para "${receita.nome}" foi aprovada e já está visível para todos os usuários. Obrigado pela contribuição!`,
        dados: { receita_id: receitaId, receita_nome: receita.nome, foto_url: receita.foto_pendente_url },
      });
    }

    return { sucesso: true, foto_anterior: fotoAntiga, foto_nova: receita.foto_pendente_url };
  }

  // ── Admin: rejeitar foto ──────────────────────────────────────────────────────

  async rejeitarFoto(receitaId: string, motivo: string) {
    const receita = await this.receitaRepo.findOne({ where: { id: receitaId } });
    if (!receita) throw new NotFoundException('Receita não encontrada');
    if (!receita.foto_pendente_url) throw new BadRequestException('Sem foto pendente');

    const autorId = receita.foto_pendente_autor_id;
    await this.receitaRepo.update(receitaId, {
      foto_pendente_url: null,
      foto_pendente_autor_id: null,
      foto_pendente_motivo_rejeicao: motivo,
    });

    if (autorId) {
      await this.notifUsuario.enviar({
        usuario_id: autorId,
        tipo: 'foto_rejeitada',
        titulo: '❌ Foto não aprovada',
        mensagem: `Sua foto para "${receita.nome}" não foi aprovada. Motivo: ${motivo}`,
        dados: { receita_id: receitaId, receita_nome: receita.nome, motivo },
      });
    }

    return { sucesso: true, motivo };
  }
}
