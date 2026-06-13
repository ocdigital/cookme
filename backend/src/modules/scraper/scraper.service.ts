import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { spawn, ChildProcess } from 'child_process';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import {
  ScraperSession,
  SessionStatus,
  ScraperSessionResponse,
} from './interfaces/scraper-session.interface';
import { Compra } from '../compras/entities/compra.entity';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly activeSessions = new Map<string, ScraperSession>();
  private readonly MAX_CONCURRENT_SESSIONS = 5;
  private readonly SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos
  private readonly PYTHON_SCRIPT_PATH: string;

  constructor(
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
    private readonly jwtService: JwtService,
  ) {
    // Caminho para o script Python (ajuste conforme sua estrutura)
    this.PYTHON_SCRIPT_PATH = path.resolve(
      __dirname,
      '../../../../lib/captcha_manual.py',
    );

    this.logger.log(`Python script path: ${this.PYTHON_SCRIPT_PATH}`);

    // Cleanup de sessões expiradas a cada minuto
    setInterval(() => this.cleanupExpiredSessions(), 60 * 1000);
  }

  /**
   * Inicia uma nova consulta de cupom fiscal
   */
  async iniciarConsulta(
    userId: string,
    qrcodeTexto: string,
  ): Promise<ScraperSessionResponse> {
    // Verificar limite de sessões simultâneas
    if (this.activeSessions.size >= this.MAX_CONCURRENT_SESSIONS) {
      throw new BadRequestException(
        'Limite de consultas simultâneas atingido. Tente novamente em alguns minutos.',
      );
    }

    const sessionId = uuid();
    const now = new Date();

    const session: ScraperSession = {
      id: sessionId,
      userId,
      qrcodeTexto,
      status: SessionStatus.INICIANDO,
      progress: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.SESSION_TIMEOUT_MS),
    };

    this.activeSessions.set(sessionId, session);
    this.logger.log(`Nova sessão criada: ${sessionId} para usuário ${userId}`);

    // Executar scraper em background (não bloqueia)
    this.executarScraperBackground(session).catch((error) => {
      this.logger.error(
        `Erro ao executar scraper para sessão ${sessionId}:`,
        error,
      );
      session.status = SessionStatus.ERRO;
      session.erro = error.message;
    });

    return this.sessionToResponse(session);
  }

  /**
   * Consulta o status de uma sessão
   */
  async getStatus(sessionId: string): Promise<ScraperSessionResponse> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('Sessão não encontrada ou expirada');
    }

    return this.sessionToResponse(session);
  }

  /**
   * Notifica que o CAPTCHA foi resolvido e o cupom foi detectado
   */
  async notificarCaptchaResolvido(
    sessionId: string,
    cupomHtml?: string,
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (session.status !== SessionStatus.AGUARDANDO_CAPTCHA) {
      throw new BadRequestException(
        `Sessão não está aguardando CAPTCHA. Status atual: ${session.status}`,
      );
    }

    this.logger.log(`CAPTCHA resolvido e cupom detectado para sessão ${sessionId}`);
    this.logger.log(`HTML recebido: ${cupomHtml ? 'Sim' : 'Não'}`);

    // O mobile já capturou o HTML do cupom
    // Enviar sinal + HTML para o Python processar
    if (session.processoHandle && !session.processoHandle.killed) {
      this.logger.log(`Notificando processo Python ${session.processoPid} para processar cupom`);

      // Enviar sinal de continuação
      session.processoHandle.stdin?.write('continue\n');

      // Enviar HTML do cupom se disponível
      if (cupomHtml) {
        this.logger.log(`Enviando HTML do cupom (${cupomHtml.length} caracteres) para processamento`);
        const htmlData = JSON.stringify({ html: cupomHtml });
        session.processoHandle.stdin?.write(htmlData + '\n');
      } else {
        // Enviar JSON vazio para indicar que não tem HTML
        session.processoHandle.stdin?.write(JSON.stringify({ html: '' }) + '\n');
      }

      // O Python vai processar o HTML, salvar na API e enviar mensagem "compra_criada"
    }

    // Marcar como processando
    session.status = SessionStatus.PROCESSANDO_DADOS;
    session.progress = 70;
    session.updatedAt = new Date();
  }

  /**
   * Cancela uma sessão
   */
  async cancelar(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    this.logger.log(`Cancelando sessão ${sessionId}`);

    // Matar processo Python
    if (session.processoHandle && !session.processoHandle.killed) {
      session.processoHandle.kill('SIGTERM');
    }

    session.status = SessionStatus.CANCELADO;
    session.updatedAt = new Date();

    // Remover após 30 segundos
    setTimeout(() => {
      this.activeSessions.delete(sessionId);
    }, 30000);
  }

  /**
   * Lista todas as sessões de um usuário
   */
  async listarSessoes(userId: string): Promise<ScraperSessionResponse[]> {
    const sessions = Array.from(this.activeSessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return sessions.map((s) => this.sessionToResponse(s));
  }

  /**
   * Limpa o histórico de consultas de um usuário
   */
  async limparHistoricoUsuario(userId: string): Promise<void> {
    // 1. Limpar sessões em memória
    const sessionIds = Array.from(this.activeSessions.keys()).filter(
      (sessionId) => {
        const session = this.activeSessions.get(sessionId);
        return session && session.userId === userId;
      },
    );

    for (const sessionId of sessionIds) {
      const session = this.activeSessions.get(sessionId);

      // Matar processo Python se estiver rodando
      if (session && session.processoHandle && !session.processoHandle.killed) {
        session.processoHandle.kill('SIGTERM');
      }

      // Remover sessão
      this.activeSessions.delete(sessionId);
    }

    this.logger.log(
      `Sessões em memória limpas para usuário ${userId}. ${sessionIds.length} sessões removidas.`,
    );

    // 2. Deletar Compras do banco de dados associadas ao usuário
    try {
      const result = await this.compraRepository.delete({
        usuario_id: userId,
      });

      this.logger.log(
        `Compras deletadas do banco para usuário ${userId}. ${result.affected || 0} compras removidas.`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao deletar compras para usuário ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Executa o scraper Python em background
   */
  private async executarScraperBackground(
    session: ScraperSession,
  ): Promise<void> {
    try {
      this.logger.log(`Iniciando scraper Python para sessão ${session.id}`);

      session.status = SessionStatus.CONSULTANDO_SAT;
      session.progress = 10;
      session.updatedAt = new Date();

      // Spawn processo Python usando o venv
      const pythonPath = path.resolve(
        __dirname,
        '../../../../lib/venv/bin/python',
      );

      const userToken = await this.jwtService.signAsync(
        { sub: session.userId },
        { expiresIn: '2h' },
      );

      const pythonProcess = spawn(pythonPath, [
        this.PYTHON_SCRIPT_PATH,
        '--session-id',
        session.id,
        '--qrcode',
        session.qrcodeTexto,
        '--mode',
        'api',
        '--token',
        userToken,
      ]);

      session.processoHandle = pythonProcess;
      session.processoPid = pythonProcess.pid;

      // Capturar stdout
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        this.handleScraperOutput(session, output);
      });

      // Capturar stderr
      pythonProcess.stderr.on('data', (data) => {
        this.logger.error(
          `Scraper stderr [${session.id}]: ${data.toString()}`,
        );
      });

      // Quando o processo termina
      pythonProcess.on('close', (code) => {
        this.logger.log(
          `Processo Python finalizado [${session.id}] com código ${code}`,
        );

        if (code === 0 && session.status !== SessionStatus.CONCLUIDO) {
          session.status = SessionStatus.CONCLUIDO;
          session.progress = 100;
        } else if (code !== 0 && session.status !== SessionStatus.ERRO) {
          session.status = SessionStatus.ERRO;
          session.erro = `Processo encerrado com código ${code}`;
        }

        session.updatedAt = new Date();
      });

      // Timeout
      setTimeout(() => {
        if (
          !pythonProcess.killed &&
          session.status !== SessionStatus.CONCLUIDO
        ) {
          this.logger.warn(`Timeout na sessão ${session.id}`);
          pythonProcess.kill('SIGTERM');
          session.status = SessionStatus.TIMEOUT;
          session.erro = 'Tempo limite excedido';
        }
      }, this.SESSION_TIMEOUT_MS);
    } catch (error) {
      this.logger.error(
        `Erro ao executar scraper para sessão ${session.id}:`,
        error,
      );
      session.status = SessionStatus.ERRO;
      session.erro = error.message;
      session.updatedAt = new Date();
    }
  }

  /**
   * Processa output do scraper Python
   */
  private handleScraperOutput(session: ScraperSession, output: string): void {
    this.logger.debug(`Scraper output [${session.id}]: ${output}`);

    try {
      // Tentar parsear como JSON (protocolo de comunicação)
      const lines = output.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const message = JSON.parse(line);

          switch (message.type) {
            case 'status':
              if (message.status) {
                session.status = message.status as SessionStatus;
              }
              if (message.progress !== undefined) {
                session.progress = message.progress;
              }
              session.updatedAt = new Date();
              break;

            case 'captcha_required':
              session.status = SessionStatus.AGUARDANDO_CAPTCHA;
              session.captchaUrl = message.url;
              session.chaveAcesso = message.chave_acesso;
              session.progress = 50;
              session.updatedAt = new Date();
              this.logger.log(`Sessão ${session.id} aguardando CAPTCHA`);
              break;

            case 'compra_criada':
              session.compraId = message.compra_id;
              session.totalProdutos = message.total_produtos;
              session.valorTotal = message.valor_total;
              session.status = SessionStatus.CONCLUIDO;
              session.progress = 100;
              session.updatedAt = new Date();
              this.logger.log(
                `Compra criada com sucesso para sessão ${session.id}`,
              );
              break;

            case 'erro':
              session.status = SessionStatus.ERRO;
              session.erro = message.mensagem;
              session.updatedAt = new Date();
              this.logger.error(`Erro na sessão ${session.id}: ${message.mensagem}`);
              break;
          }
        } catch (e) {
          // Não é JSON, apenas log
          continue;
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar output do scraper:', error);
    }
  }

  /**
   * Cleanup de sessões expiradas
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let removidas = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expiresAt < now) {
        // Matar processo se ainda estiver rodando
        if (session.processoHandle && !session.processoHandle.killed) {
          session.processoHandle.kill('SIGTERM');
        }

        this.activeSessions.delete(sessionId);
        removidas++;
      }
    }

    if (removidas > 0) {
      this.logger.log(`Removidas ${removidas} sessões expiradas`);
    }
  }

  /**
   * Converte sessão para response
   */
  private sessionToResponse(session: ScraperSession): ScraperSessionResponse {
    return {
      sessionId: session.id,
      status: session.status,
      progress: session.progress,
      createdAt: session.createdAt,
      captchaUrl: session.captchaUrl,
      chaveAcesso: session.chaveAcesso,
      compraId: session.compraId,
      totalProdutos: session.totalProdutos,
      valorTotal: session.valorTotal,
      erro: session.erro,
    };
  }
}
