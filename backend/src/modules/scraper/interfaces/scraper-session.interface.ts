import { ChildProcess } from 'child_process';

export enum SessionStatus {
  INICIANDO = 'iniciando',
  CONSULTANDO_SAT = 'consultando_sat',
  AGUARDANDO_CAPTCHA = 'aguardando_captcha',
  PROCESSANDO_DADOS = 'processando_dados',
  SALVANDO_API = 'salvando_api',
  CONCLUIDO = 'concluido',
  ERRO = 'erro',
  TIMEOUT = 'timeout',
  CANCELADO = 'cancelado',
}

export interface ScraperSession {
  id: string;
  userId: string;
  qrcodeTexto: string;
  status: SessionStatus;
  progress: number; // 0-100

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;

  // Dados do processo Python
  processoPid?: number;
  processoHandle?: ChildProcess;

  // Dados para o mobile resolver CAPTCHA
  captchaUrl?: string;
  chaveAcesso?: string;

  // Resultados
  cupomDados?: any;
  compraId?: string;
  totalProdutos?: number;
  valorTotal?: number;
  erro?: string;
}

export interface ScraperSessionResponse {
  sessionId: string;
  status: SessionStatus;
  progress: number;
  createdAt: Date;
  captchaUrl?: string;
  chaveAcesso?: string;
  compraId?: string;
  totalProdutos?: number;
  valorTotal?: number;
  erro?: string;
}
