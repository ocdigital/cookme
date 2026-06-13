import { Injectable, Logger } from '@nestjs/common';
import { NotificacaoService } from './notificacao.service';
import { v4 as uuid } from 'uuid';

/**
 * Serviço centralizador de triggers para notificações automáticas
 * Usado por outros módulos para emitir notificações em eventos
 */
@Injectable()
export class NotificacaoTriggersService {
  private logger = new Logger('NotificacaoTriggersService');

  constructor(private notificacaoService: NotificacaoService) {}

  /**
   * Trigger: Receita denunciada
   */
  async receitaDenunciada(
    receitaId: string,
    receitaNome: string,
    quantidadeDenuncias: number,
  ) {
    this.logger.log(`Trigger: Receita "${receitaNome}" denunciada`);

    const severidade =
      quantidadeDenuncias >= 5 ? 'critica' : quantidadeDenuncias >= 3 ? 'alta' : 'media';

    await this.notificacaoService.criar({
      tipo: 'moderacao',
      severidade,
      titulo: `${severidade === 'critica' ? '🔴 CRÍTICO: ' : ''}Receita Denunciada`,
      mensagem: `"${receitaNome}" foi denunciada ${quantidadeDenuncias}x. Requer revisão.`,
      dados: { receitaId, quantidadeDenuncias },
      acao_label: 'Revisar Receita',
      acao_rota: `/admin/receitas/${receitaId}`,
      acao_id: receitaId,
      usuario_admin_id: '00000000-0000-0000-0000-000000000000', // Admin geral recebe
    });
  }

  /**
   * Trigger: Novo usuário registrado
   */
  async novoUsuario(usuarioId: string, usuarioNome: string, email: string) {
    this.logger.log(`Trigger: Novo usuário registrado - ${usuarioNome}`);

    await this.notificacaoService.criar({
      tipo: 'usuarios',
      severidade: 'baixa',
      titulo: '👤 Novo Usuário',
      mensagem: `${usuarioNome} (${email}) se registrou.`,
      dados: { usuarioId, email },
      acao_label: 'Ver Perfil',
      acao_rota: `/admin/usuarios/${usuarioId}`,
      acao_id: usuarioId,
      usuario_admin_id: '00000000-0000-0000-0000-000000000000',
    });
  }

  /**
   * Trigger: Usuário inativo por 30+ dias
   */
  async usuarioInativo(usuarioId: string, usuarioNome: string, diasInativo: number) {
    this.logger.log(`Trigger: Usuário inativo - ${usuarioNome} (${diasInativo} dias)`);

    await this.notificacaoService.criar({
      tipo: 'usuarios',
      severidade: 'media',
      titulo: '⏱️ Usuário Inativo',
      mensagem: `${usuarioNome} está inativo há ${diasInativo} dias.`,
      dados: { usuarioId, diasInativo },
      acao_label: 'Ver Atividade',
      acao_rota: `/admin/usuarios/${usuarioId}`,
      acao_id: usuarioId,
      usuario_admin_id: '00000000-0000-0000-0000-000000000000',
    });
  }

  /**
   * Trigger: Produto incompleto criado
   */
  async produtoIncompleto(
    produtoId: string,
    produtoNome: string,
    camposFaltando: string[],
  ) {
    this.logger.log(`Trigger: Produto incompleto - ${produtoNome}`);

    await this.notificacaoService.criar({
      tipo: 'qualidade',
      severidade: 'media',
      titulo: '📦 Produto Incompleto',
      mensagem: `"${produtoNome}" precisa: ${camposFaltando.join(', ')}.`,
      dados: { produtoId, camposFaltando },
      acao_label: 'Completar',
      acao_rota: `/admin/produtos/${produtoId}/editar`,
      acao_id: produtoId,
      usuario_admin_id: '00000000-0000-0000-0000-000000000000',
    });
  }

  /**
   * Trigger: Erro crítico no sistema
   */
  async erroSistema(tituloErro: string, detalhesErro: string) {
    this.logger.error(`Trigger: Erro sistema - ${tituloErro}`);

    await this.notificacaoService.criar({
      tipo: 'sistema',
      severidade: 'critica',
      titulo: `🔴 Erro de Sistema: ${tituloErro}`,
      mensagem: detalhesErro,
      dados: { timestamp: new Date() },
      usuario_admin_id: '00000000-0000-0000-0000-000000000000',
    });
  }

  /**
   * Trigger: Limite de recursos atingido
   */
  async limiteRecursos(recurso: string, utilizado: number, limite: number) {
    this.logger.warn(`Trigger: Limite de recursos - ${recurso}`);

    const percentual = Math.round((utilizado / limite) * 100);

    await this.notificacaoService.criar({
      tipo: 'sistema',
      severidade: percentual >= 90 ? 'critica' : 'alta',
      titulo: `⚠️ Limite de ${recurso}`,
      mensagem: `${utilizado}/${limite} (${percentual}%) em uso.`,
      dados: { recurso, utilizado, limite, percentual },
      usuario_admin_id: '00000000-0000-0000-0000-000000000000',
    });
  }

  /**
   * Trigger: Processamento concluído
   */
  async processamentoConcluido(
    tipoProcessamento: string,
    resultado: string,
    tempoExecucao: number,
  ) {
    this.logger.log(`Trigger: Processamento concluído - ${tipoProcessamento}`);

    await this.notificacaoService.criar({
      tipo: 'sistema',
      severidade: 'baixa',
      titulo: `✅ ${tipoProcessamento} Concluído`,
      mensagem: `${resultado} em ${tempoExecucao}ms.`,
      dados: { tipo: tipoProcessamento, tempoExecucao },
      usuario_admin_id: '00000000-0000-0000-0000-000000000000',
    });
  }

  /**
   * Trigger: Limite de IA atingido (rate limit / quota)
   */
  async limiteIAAtingido(servico: string, motivo: string) {
    this.logger.warn(`Trigger: Limite IA - ${servico}: ${motivo}`);

    await this.notificacaoService.criar({
      tipo: 'sistema',
      severidade: 'alta',
      titulo: `⚠️ Limite de IA: ${servico}`,
      mensagem: `${servico} indisponível — ${motivo}. Sistema usando modo fallback.`,
      dados: { servico, motivo, timestamp: new Date() },
      usuario_admin_id: '00000000-0000-0000-0000-000000000000',
    });
  }

  /**
   * Trigger: Notificação customizada
   */
  async custom(
    tipo: 'moderacao' | 'qualidade' | 'usuarios' | 'sistema',
    severidade: 'critica' | 'alta' | 'media' | 'baixa',
    titulo: string,
    mensagem: string,
    dados?: Record<string, any>,
    acao?: { label: string; rota: string; id: string },
  ) {
    await this.notificacaoService.criar({
      tipo,
      severidade,
      titulo,
      mensagem,
      dados,
      acao_label: acao?.label,
      acao_rota: acao?.rota,
      acao_id: acao?.id,
      usuario_admin_id: '00000000-0000-0000-0000-000000000000',
    });
  }
}
