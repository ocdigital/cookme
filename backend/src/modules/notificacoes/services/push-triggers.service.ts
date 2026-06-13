import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushNotificationService } from './push-notification.service';
import { Usuario } from '@modules/usuarios/entities/usuario.entity';
import { PlanejamentoSemanal } from '@modules/planejamento/entities/planejamento-semanal.entity';

@Injectable()
export class PushTriggersService {
  private readonly logger = new Logger(PushTriggersService.name);

  constructor(
    private readonly push: PushNotificationService,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(PlanejamentoSemanal)
    private readonly planejamentoRepo: Repository<PlanejamentoSemanal>,
  ) {}

  /**
   * Trigger manual: ingrediente marcado como esgotado
   * Chamado pelo InventarioService quando esgotado = true
   */
  async ingredienteEsgotado(usuarioId: string, nomeIngrediente: string): Promise<void> {
    await this.push.enviarParaUsuario(
      usuarioId,
      '🛒 Ingrediente acabou',
      `${nomeIngrediente} acabou na sua despensa. Adicionar à lista de compras?`,
      { tipo: 'ingrediente_esgotado', ingrediente: nomeIngrediente, rota: '/(app)/(tabs)/listas' },
    );
  }

  /**
   * Trigger manual: OCR concluído com sucesso
   * Chamado após validação do cupom fiscal
   */
  async despensaAtualizada(usuarioId: string, quantidadeItens: number): Promise<void> {
    await this.push.enviarParaUsuario(
      usuarioId,
      '✅ Despensa atualizada',
      `${quantidadeItens} itens adicionados à sua despensa com sucesso!`,
      { tipo: 'despensa_atualizada', rota: '/(app)/(tabs)/despensa' },
    );
  }

  /**
   * Trigger manual: receita gerada pela IA
   */
  async receitasGeradas(usuarioId: string, quantidade: number): Promise<void> {
    await this.push.enviarParaUsuario(
      usuarioId,
      '👨‍🍳 Receitas prontas!',
      `A IA gerou ${quantidade} receita${quantidade > 1 ? 's' : ''} com o que você tem em casa.`,
      { tipo: 'receitas_geradas', rota: '/(app)/(tabs)/receitas' },
    );
  }

  /**
   * Cron: lembrete de almoço às 10h (seg-sex)
   */
  @Cron('0 10 * * 1-5', { timeZone: 'America/Sao_Paulo' })
  async lembreteAlmoco(): Promise<void> {
    this.logger.log('Cron: enviando lembretes de almoço');
    await this.enviarLembreteRefeicao('almoco', '🍽️ Hora do almoço!', 'O que vai cozinhar hoje?');
  }

  /**
   * Cron: lembrete de jantar às 17h (todos os dias)
   */
  @Cron('0 17 * * *', { timeZone: 'America/Sao_Paulo' })
  async lembreteJantar(): Promise<void> {
    this.logger.log('Cron: enviando lembretes de jantar');
    await this.enviarLembreteRefeicao('jantar', '🌙 E o jantar?', 'Já escolheu o que vai fazer hoje?');
  }

  private async enviarLembreteRefeicao(
    tipo: 'almoco' | 'jantar',
    titulo: string,
    corpoPadrao: string,
  ): Promise<void> {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const semana = this.getSemanaAtual();

    const planejamentos = await this.planejamentoRepo.find({
      where: { dia_semana: diaSemana, tipo_refeicao: tipo, numero_semana: semana },
      relations: ['receita'],
    });

    for (const item of planejamentos) {
      if (!item.usuario_id) continue;

      const corpo = item.receita
        ? `Você planejou: ${item.receita.nome}. Que tal começar agora?`
        : corpoPadrao;

      await this.push.enviarParaUsuario(
        item.usuario_id,
        titulo,
        corpo,
        { tipo: `lembrete_${tipo}`, receita_id: item.receita?.id, rota: '/(app)/(tabs)/semana' },
      );
    }
  }

  private getSemanaAtual(): number {
    const hoje = new Date();
    const dia = hoje.getDate();
    return Math.ceil(dia / 7);
  }
}
