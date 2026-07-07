import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Serviço de e-mail transacional (Resend).
 * Sem RESEND_API_KEY o serviço loga e não envia (dev/test não quebram).
 *
 * Nota: sem domínio verificado no Resend, o remetente precisa ser
 * onboarding@resend.dev e só entrega para o e-mail do dono da conta.
 * Após verificar cookme.com.br, definir MAIL_FROM=CookMe <nao-responda@cookme.com.br>.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('RESEND_API_KEY');
    if (key) this.resend = new Resend(key);
    this.from = this.config.get<string>('MAIL_FROM') || 'CookMe <onboarding@resend.dev>';
  }

  get habilitado(): boolean {
    return this.resend !== null;
  }

  async enviar(para: string, assunto: string, html: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY ausente — e-mail para ${para} NÃO enviado ("${assunto}")`);
      return false;
    }
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: para,
        subject: assunto,
        html,
      });
      if (error) {
        this.logger.error(`Resend recusou e-mail para ${para}: ${error.message}`);
        return false;
      }
      return true;
    } catch (e: any) {
      this.logger.error(`Falha ao enviar e-mail para ${para}: ${e.message}`);
      return false;
    }
  }

  async enviarCodigoRecuperacao(para: string, codigo: string): Promise<boolean> {
    const html = `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 420px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #2F9E44; margin-bottom: 4px;">CookMe</h2>
        <p style="font-size: 16px; color: #333;">Use o código abaixo para redefinir sua senha:</p>
        <div style="font-size: 36px; font-weight: 700; letter-spacing: 10px; text-align: center;
                    background: #F1F8F1; border-radius: 12px; padding: 20px 0; margin: 16px 0; color: #1B5E20;">
          ${codigo}
        </div>
        <p style="font-size: 13px; color: #666;">O código expira em <strong>15 minutos</strong> e só pode ser usado uma vez.</p>
        <p style="font-size: 13px; color: #999;">Se você não pediu a redefinição, ignore este e-mail — sua senha continua a mesma.</p>
      </div>`;
    return this.enviar(para, `${codigo} é seu código CookMe`, html);
  }
}
