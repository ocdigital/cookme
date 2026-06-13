import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { Inventario } from './entities/inventario.entity';

const DIAS_SEM_RECOMPRA = 60;

@Injectable()
export class InventarioExpiracaoJob {
  private readonly logger = new Logger('InventarioExpiracaoJob');

  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepo: Repository<Inventario>,
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
}
