import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { retryWithBackoff, isTransientError } from '../../common/utils/retry.util';
import { ItemEntrada, ItemCanonizado } from './engine-client.types';

/**
 * Cliente HTTP da food-canonizer-api (PLANO_EXTRACAO_ENGINE.md Fase 5). O
 * CookMe consome a Engine como cliente nº 1, sem privilégio — mesma API key
 * B2B, mesmo contrato que qualquer outro cliente.
 *
 * §6.4 do plano: NÃO existe fallback para o motor local. Se a Engine estiver
 * indisponível, o item volta com confiança 0 e estágio "pendente" — honesto,
 * em vez de mentir que resolveu. Canonização é enriquecimento, não bloqueio:
 * quem chama decide se espera ou segue sem o nome canônico.
 */
@Injectable()
export class EngineClientService {
  private readonly logger = new Logger(EngineClientService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: this.config.get<string>('ENGINE_API_URL', 'http://localhost:3000'),
      timeout: 3000,
      headers: {
        'x-api-key': this.config.get<string>('ENGINE_API_KEY', ''),
      },
    });
  }

  private itemPendente(descricao: string): ItemCanonizado {
    return {
      descricao_original: descricao,
      produto_canonico: descricao.toLowerCase().trim(),
      marca: null,
      eh_alimento: null,
      ean: null,
      preco: null,
      quantidade: null,
      confianca: 0,
      estagio: 'pendente',
      nucleo: null,
      especificador: null,
    };
  }

  async canonizar(item: ItemEntrada): Promise<ItemCanonizado> {
    const [resultado] = await this.canonizarLote([item]);
    return resultado;
  }

  async canonizarLote(itens: ItemEntrada[]): Promise<ItemCanonizado[]> {
    if (itens.length === 0) return [];
    try {
      const { data } = await retryWithBackoff(
        () => this.http.post('/engine/canonizar', { itens }),
        { maxAttempts: 2, initialDelayMs: 300, shouldRetry: isTransientError },
      );
      return data.itens;
    } catch (err) {
      this.logger.warn(
        `Engine indisponível, itens ficam pendentes: ${(err as Error).message}`,
      );
      return itens.map((i) => this.itemPendente(i.descricao));
    }
  }

  async corrigir(
    descricao: string,
    produtoCanonico: string,
    ean?: string,
  ): Promise<void> {
    await this.http
      .post('/engine/corrigir', { descricao, produto_canonico: produtoCanonico, ean })
      .catch((err) =>
        this.logger.warn(`Falha ao registrar correção na Engine: ${err.message}`),
      );
  }
}
