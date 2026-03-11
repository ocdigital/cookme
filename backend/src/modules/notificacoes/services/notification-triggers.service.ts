import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { NotificacoesService } from '../notificacoes.service';
import { Notificacao, NotificacaoTipo } from '../entities/notificacao.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Preferencia } from '../../usuarios/entities/preferencia.entity';
import { Receita } from '../../receitas/entities/receita.entity';
import { Compra } from '../../compras/entities/compra.entity';

@Injectable()
export class NotificationTriggersService {
  private readonly logger = new Logger('NotificationTriggersService');

  constructor(
    @InjectRepository(Inventario)
    private inventarioRepository: Repository<Inventario>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Preferencia)
    private preferenciaRepository: Repository<Preferencia>,
    @InjectRepository(Receita)
    private receitaRepository: Repository<Receita>,
    @InjectRepository(Compra)
    private compraRepository: Repository<Compra>,
    private notificacoesService: NotificacoesService,
  ) {}

  /**
   * Verifica itens vencendo no inventário (a cada 6 horas)
   * Notifica usuários quando produtos estão perto de vencer
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async verificarItensVencendo(): Promise<void> {
    try {
      this.logger.log('🔔 Iniciando verificação de itens vencendo...');

      // Produtos vencendo nos próximos 7 dias
      const hoje = new Date();
      const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
      const em3Dias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Items vencendo em 3 dias (URGENTE)
      const itemsUrgentes = await this.inventarioRepository.find({
        where: {
          data_validade: LessThan(em3Dias),
          quantidade_disponivel: MoreThan(0),
        },
        relations: ['usuario', 'produto'],
      });

      for (const item of itemsUrgentes) {
        const diasRestantes = this.calcularDiasRestantes(item.data_validade);

        await this.notificacoesService.create(item.usuario_id, {
          tipo: NotificacaoTipo.ERROR,
          titulo: `⚠️ ${item.produto.nome} vence em ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'}!`,
          mensagem: `Use logo! Este produto vence em ${item.data_validade.toLocaleDateString('pt-BR')}. Você tem ${item.quantidade_disponivel} ${item.unidade} disponível.`,
          icone: '⏰',
        });
      }

      // Items vencendo em 7 dias (AVISO)
      const itemsAviso = await this.inventarioRepository.find({
        where: {
          data_validade: LessThan(em7Dias),
          quantidade_disponivel: MoreThan(0),
        },
        relations: ['usuario', 'produto'],
      });

      for (const item of itemsAviso) {
        // Evitar notificação duplicada se já foi urgente
        if (item.data_validade < em3Dias) continue;

        const diasRestantes = this.calcularDiasRestantes(item.data_validade);

        await this.notificacoesService.create(item.usuario_id, {
          tipo: NotificacaoTipo.WARNING,
          titulo: `${item.produto.nome} vence em ${diasRestantes} dias`,
          mensagem: `Hora de usar este ingrediente! Vence em ${item.data_validade.toLocaleDateString('pt-BR')}.`,
          icone: '📅',
        });
      }

      this.logger.log(`✅ Verificação de vencimento concluída (${itemsUrgentes.length} urgentes, ${itemsAviso.length - itemsUrgentes.length} avisos)`);
    } catch (error) {
      this.logger.error('❌ Erro ao verificar itens vencendo:', error.message);
    }
  }

  /**
   * Notifica sobre receitas sugeridas (a cada 24 horas, às 9 da manhã)
   * Manda sugestões de receitas baseadas no inventário
   */
  @Cron('0 9 * * *') // 9:00 AM todos os dias
  async notificarSugestoesDiarias(): Promise<void> {
    try {
      this.logger.log('🍳 Enviando sugestões de receitas diárias...');

      const usuarios = await this.usuarioRepository.find();

      for (const usuario of usuarios) {
        // Verificar se usuário tem preferência de notificações
        const preferencia = await this.preferenciaRepository.findOne({
          where: { usuario_id: usuario.id },
        });

        // Buscar receitas que match com inventário
        const inventarioUsuario = await this.inventarioRepository.find({
          where: { usuario_id: usuario.id, quantidade_disponivel: MoreThan(0) },
          relations: ['produto'],
        });

        if (inventarioUsuario.length === 0) {
          continue; // Skip if no inventory
        }

        // Buscar receitas que usam produtos disponíveis
        const receitasMatchadas = await this.buscarReceitasComInventario(
          inventarioUsuario.map(i => i.produto_id),
        );

        if (receitasMatchadas.length > 0) {
          const receita = receitasMatchadas[0]; // Primeira sugestão

          await this.notificacoesService.create(usuario.id, {
            tipo: NotificacaoTipo.SUCCESS,
            titulo: `🎉 Que tal fazer ${receita.nome} hoje?`,
            mensagem: `Você tem os ingredientes! Esta receita leva ${receita.tempo_preparo} minutos e é ${receita.dificuldade}.`,
            icone: '👨‍🍳',
          });

          this.logger.log(`✅ Sugestão enviada para ${usuario.nome}`);
        }
      }

      this.logger.log('✅ Sugestões diárias concluídas');
    } catch (error) {
      this.logger.error('❌ Erro ao enviar sugestões diárias:', error.message);
    }
  }

  /**
   * Notifica quando há promoções/descontos (semanal)
   * Nota: Requer integração com sistema de preços
   */
  @Cron('0 10 * * 1') // Segunda-feira às 10:00 AM
  async notificarPromocoes(): Promise<void> {
    try {
      this.logger.log('🏷️ Buscando produtos em promoção...');

      // TODO: Integrar com sistema de preços/cupons
      // Por enquanto, notificar sobre ingredientes populares

      const usuarios = await this.usuarioRepository.find();

      for (const usuario of usuarios) {
        // Exemplo: Notificar sobre produtos em estação
        const produtosSazonais = await this.buscarProdutosSazonais();

        if (produtosSazonais.length > 0) {
          const produto = produtosSazonais[0];

          await this.notificacoesService.create(usuario.id, {
            tipo: NotificacaoTipo.INFO,
            titulo: `🛒 ${produto.nome} está em destaque!`,
            mensagem: `Aproveite a sazonalidade para usar ${produto.nome} em suas receitas. Preço reduzido em muitas lojas.`,
            icone: '💰',
          });
        }
      }

      this.logger.log('✅ Notificações de promoção concluídas');
    } catch (error) {
      this.logger.error('❌ Erro ao notificar promoções:', error.message);
    }
  }

  /**
   * Notifica sobre estoque baixo (diariamente)
   * Ingredientes que o usuário usa frequentemente
   */
  @Cron('0 8 * * *') // 8:00 AM todos os dias
  async notificarEstoqueBaixo(): Promise<void> {
    try {
      this.logger.log('📦 Verificando estoque baixo...');

      // Buscar itens com quantidade muito baixa
      const itensEstoqueBaixo = await this.inventarioRepository.find({
        where: {
          quantidade_disponivel: LessThan(1), // Menos de 1 unidade
        },
        relations: ['usuario', 'produto'],
      });

      for (const item of itensEstoqueBaixo) {
        // Verificar se o usuário usa este ingrediente frequentemente
        const usaFrequente = await this.verificarUsoFrequente(
          item.usuario_id,
          item.produto_id,
        );

        if (usaFrequente) {
          await this.notificacoesService.create(item.usuario_id, {
            tipo: NotificacaoTipo.WARNING,
            titulo: `📉 Estoque baixo: ${item.produto.nome}`,
            mensagem: `Você está acabando com ${item.produto.nome}. Considera comprar em breve para não ficar sem.`,
            icone: '⚠️',
          });
        }
      }

      this.logger.log('✅ Verificação de estoque baixo concluída');
    } catch (error) {
      this.logger.error('❌ Erro ao notificar estoque baixo:', error.message);
    }
  }

  /**
   * Notifica sobre novos receitas adicionadas (semanal)
   * Baseado em preferências do usuário
   */
  @Cron('0 14 * * 3') // Quarta-feira às 14:00 (tarde)
  async notificarNovasReceitas(): Promise<void> {
    try {
      this.logger.log('✨ Notificando sobre novas receitas...');

      const usuarios = await this.usuarioRepository.find();

      for (const usuario of usuarios) {
        const preferencia = await this.preferenciaRepository.findOne({
          where: { usuario_id: usuario.id },
        });

        if (!preferencia) continue;

        // Buscar receitas novas que match com preferências
        const umaSemanAtrás = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const novasReceitas = await this.receitaRepository
          .createQueryBuilder('receita')
          .where('receita.criado_em > :dataLimite', { dataLimite: umaSemanAtrás })
          .orderBy('receita.avaliacao_media', 'DESC')
          .limit(3)
          .getMany();

        if (novasReceitas.length > 0) {
          const receita = novasReceitas[0];

          await this.notificacoesService.create(usuario.id, {
            tipo: NotificacaoTipo.INFO,
            titulo: `🆕 Receita nova: ${receita.nome}`,
            mensagem: `Descobrimos uma receita nova que você pode gostar! ${receita.descricao || 'Confira!'}`,
            icone: '📖',
          });
        }
      }

      this.logger.log('✅ Notificação de novas receitas concluída');
    } catch (error) {
      this.logger.error('❌ Erro ao notificar novas receitas:', error.message);
    }
  }

  /**
   * Envia notificações de "Olá!" para usuários inativos (a cada 3 dias)
   * Incentiva re-engagement
   */
  @Cron('0 19 */3 * *') // A cada 3 dias às 19:00 (noite)
  async notificarUsuariosInativos(): Promise<void> {
    try {
      this.logger.log('👋 Notificando usuários inativos...');

      const usuarios = await this.usuarioRepository.find();
      const trezDiasAtrás = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      for (const usuario of usuarios) {
        // Verificar se é inativo (não fez receitas nos últimos 3 dias)
        const ultimaExecucao = usuario.receitas_executadas?.[0]?.criado_em;

        if (!ultimaExecucao || new Date(ultimaExecucao) < trezDiasAtrás) {
          const mensagensDiversas = [
            '👨‍🍳 Saudades de você! Que tal cozinhar algo novo hoje?',
            '🍽️ Há quanto tempo não usa a gente! Vem conferir as novas receitas.',
            '✨ A gente tem sugestões especiais esperando por você!',
            '🎉 Aproveita e experimenta receitas diferentes que adicionamos.',
          ];

          const mensagemAleatoria =
            mensagensDiversas[Math.floor(Math.random() * mensagensDiversas.length)];

          await this.notificacoesService.create(usuario.id, {
            tipo: NotificacaoTipo.INFO,
            titulo: `Oi ${usuario.nome.split(' ')[0]}! 👋`,
            mensagem: mensagemAleatoria,
            icone: '💌',
          });

          this.logger.log(`✅ Re-engagement enviado para ${usuario.nome}`);
        }
      }

      this.logger.log('✅ Notificações de re-engagement concluídas');
    } catch (error) {
      this.logger.error('❌ Erro ao notificar usuários inativos:', error.message);
    }
  }

  /**
   * Trigger manual para enviar notificação sobre produto específico
   */
  async notificarSobreProduto(
    usuarioId: string,
    produtoId: string,
    titulo: string,
    mensagem: string,
  ): Promise<Notificacao> {
    return this.notificacoesService.create(usuarioId, {
      tipo: NotificacaoTipo.INFO,
      titulo,
      mensagem,
      icone: '📢',
    });
  }

  /**
   * Trigger manual para notificação de evento
   */
  async notificarEvento(
    usuarioId: string,
    tipo: NotificacaoTipo,
    titulo: string,
    mensagem: string,
  ): Promise<Notificacao> {
    return this.notificacoesService.create(usuarioId, {
      tipo,
      titulo,
      mensagem,
      icone: this.getIconeParaTipo(tipo),
    });
  }

  /**
   * Helper: Busca receitas que usam ingredientes disponíveis
   */
  private async buscarReceitasComInventario(produtoIds: string[]): Promise<Receita[]> {
    if (produtoIds.length === 0) return [];

    return this.receitaRepository
      .createQueryBuilder('receita')
      .innerJoinAndSelect(
        'receita.ingredientes',
        'ingrediente',
        'ingrediente.produto_id IN (:...produtoIds)',
        { produtoIds },
      )
      .orderBy('receita.avaliacao_media', 'DESC')
      .limit(10)
      .getMany();
  }

  /**
   * Helper: Busca produtos sazonais (exemplo simplificado)
   */
  private async buscarProdutosSazonais() {
    const mes = new Date().getMonth();
    const sazonalPorMes = {
      0: ['maçã', 'laranja'], // Janeiro
      1: ['morango', 'banana'], // Fevereiro
      2: ['abacaxi', 'melancia'], // Março
      3: ['melão', 'pêssego'], // Abril
      4: ['cereja', 'morango'], // Maio
      5: ['melancia', 'melão'], // Junho
      6: ['tomate', 'abóbora'], // Julho
      7: ['tomate', 'beringela'], // Agosto
      8: ['uva', 'ameixa'], // Setembro
      9: ['caqui', 'abóbora'], // Outubro
      10: ['maçã', 'pera'], // Novembro
      11: ['melancia', 'morango'], // Dezembro
    };

    const nomesProdutos = sazonalPorMes[mes] || [];

    return this.receitaRepository
      .createQueryBuilder('receita')
      .where('receita.nome ILIKE ANY(:nomes)', { nomes: nomesProdutos })
      .limit(5)
      .getMany();
  }

  /**
   * Helper: Verifica se usuário usa ingrediente frequentemente
   */
  private async verificarUsoFrequente(
    usuarioId: string,
    produtoId: string,
  ): Promise<boolean> {
    // Contar quantas vezes este produto foi usado nas últimas 2 semanas
    const deuzDiasAtrás = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const usos = await this.inventarioRepository.count({
      where: {
        usuario_id: usuarioId,
        produto_id: produtoId,
        ultima_atualizacao: MoreThan(deuzDiasAtrás),
      },
    });

    return usos > 2; // Se foi usado mais de 2 vezes em 2 semanas
  }

  /**
   * Helper: Calcula dias restantes até vencimento
   */
  private calcularDiasRestantes(dataVencimento: Date): number {
    const hoje = new Date();
    const diferenca = dataVencimento.getTime() - hoje.getTime();
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  /**
   * Helper: Retorna ícone apropriado para tipo de notificação
   */
  private getIconeParaTipo(tipo: NotificacaoTipo): string {
    const icones = {
      [NotificacaoTipo.INFO]: 'ℹ️',
      [NotificacaoTipo.SUCCESS]: '✅',
      [NotificacaoTipo.WARNING]: '⚠️',
      [NotificacaoTipo.ERROR]: '❌',
    };
    return icones[tipo] || '📢';
  }
}
