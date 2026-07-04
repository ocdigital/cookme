import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { PushNotificationService } from '../notificacoes/services/push-notification.service';
import { Inventario } from './entities/inventario.entity';

const DIAS_SEM_RECOMPRA = 60;

@Injectable()
export class InventarioExpiracaoJob {
  private readonly logger = new Logger('InventarioExpiracaoJob');

  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepo: Repository<Inventario>,
    private readonly push: PushNotificationService,
  ) {}

  /**
   * Executa diariamente às 9h.
   * Marca como esgotado ingredientes que estão no inventário há mais de 60 dias
   * sem uma nova compra (criado_em antigo e esgotado = false).
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async marcarExpirados(): Promise<void> {
    const limite = new Date();
    limite.setDate(limite.getDate() - DIAS_SEM_RECOMPRA);

    const candidatos = await this.inventarioRepo.find({
      where: {
        esgotado: false,
        criado_em: LessThan(limite),
      },
      relations: ['produto'],
    });

    if (candidatos.length === 0) {
      this.logger.log('Expiração: nenhum ingrediente antigo encontrado.');
      return;
    }

    const agora = new Date();
    await this.inventarioRepo
      .createQueryBuilder()
      .update(Inventario)
      .set({ esgotado: true, esgotado_em: agora })
      .whereInIds(candidatos.map((c) => c.id))
      .execute();

    this.logger.log(
      `Expiração: ${candidatos.length} ingrediente(s) marcado(s) como esgotado(s) (sem recompra há +${DIAS_SEM_RECOMPRA} dias): ${candidatos.map((c) => c.produto?.nome || c.produto_id).join(', ')}`,
    );
  }

  /**
   * Endpoint manual para testar o job sem esperar o cron.
   */
  async executarManual(): Promise<{ marcados: number; nomes: string[] }> {
    const limite = new Date();
    limite.setDate(limite.getDate() - DIAS_SEM_RECOMPRA);

    const candidatos = await this.inventarioRepo.find({
      where: { esgotado: false, criado_em: LessThan(limite) },
      relations: ['produto'],
    });

    if (candidatos.length === 0) return { marcados: 0, nomes: [] };

    const agora = new Date();
    await this.inventarioRepo
      .createQueryBuilder()
      .update(Inventario)
      .set({ esgotado: true, esgotado_em: agora })
      .whereInIds(candidatos.map((c) => c.id))
      .execute();

    return {
      marcados: candidatos.length,
      nomes: candidatos.map((c) => c.produto?.nome || c.produto_id),
    };
  }

  /**
   * Push diário "vence em breve" (10h): itens com validade em ≤3 dias,
   * 1 push agregado por usuário, cada item avisado no máximo 1 vez
   * (validade_avisada_em). Deep link para a tela Vencendo.
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async avisarVencimentos(): Promise<{ usuarios_avisados: number; itens_avisados: number }> {
    const limite = new Date();
    limite.setDate(limite.getDate() + 3);

    const vencendo = await this.inventarioRepo.find({
      where: {
        esgotado: false,
        validade_avisada_em: IsNull(),
        data_validade: LessThan(limite),
      },
      relations: ['produto'],
    });

    // Só itens ainda não vencidos há muito tempo (ignora lixo antigo > 2 dias vencido)
    const doisDiasAtras = new Date();
    doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);
    const relevantes = vencendo.filter(
      (i) => i.data_validade && new Date(i.data_validade) >= doisDiasAtras,
    );

    if (relevantes.length === 0) {
      return { usuarios_avisados: 0, itens_avisados: 0 };
    }

    // Agrupa por usuário — 1 push por usuário/dia
    const porUsuario = new Map<string, Inventario[]>();
    for (const item of relevantes) {
      const lista = porUsuario.get(item.usuario_id) ?? [];
      lista.push(item);
      porUsuario.set(item.usuario_id, lista);
    }

    let avisados = 0;
    for (const [usuarioId, itens] of porUsuario) {
      const nomes = itens
        .map((i) => ((i.produto as any)?.nome_display || i.produto?.nome || 'ingrediente').toLowerCase())
        .slice(0, 3);
      const corpo =
        itens.length === 1
          ? `${nomes[0]} vence em breve. Veja receitas para usar hoje!`
          : `${nomes.join(', ')}${itens.length > 3 ? ' e mais' : ''} vencem em breve. Veja receitas para usar hoje!`;

      try {
        await this.push.enviarParaUsuario(
          usuarioId,
          '⏳ Aproveite antes de vencer',
          corpo,
          { tipo: 'validade_proxima', rota: '/(app)/vencendo' },
        );
        await this.inventarioRepo.update(
          itens.map((i) => i.id),
          { validade_avisada_em: new Date() },
        );
        avisados++;
      } catch (e: any) {
        this.logger.warn(`Falha no push de vencimento para ${usuarioId}: ${e.message}`);
      }
    }

    this.logger.log(
      `Push de vencimento: ${avisados} usuário(s), ${relevantes.length} item(ns).`,
    );
    return { usuarios_avisados: avisados, itens_avisados: relevantes.length };
  }
}
