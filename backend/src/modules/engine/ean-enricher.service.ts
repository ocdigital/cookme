import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Enriquecimento por EAN — aprendizado autônomo da Engine.
 *
 * Quando um item tem EAN (todo cupom NFC-e traz) mas ele não está na KB, este
 * serviço consulta bases PÚBLICAS de produto pelo código de barras. O EAN é a
 * verdade absoluta: identifica um produto único, com nome oficial cadastrado.
 * Se uma base CONFIÁVEL responde, o resultado auto-aprende na KB — o item nunca
 * mais precisa de palpite, para nenhum cliente.
 *
 * Fonte de verdade em cascata:
 *   1. Open Food Facts (grátis, sem chave) — boa cobertura de populares BR
 *   2. Cosmos/Bluesoft (base BR completa, PAGA) — se COSMOS_API_KEY configurada
 *   Sem hit em base confiável → retorna null (NÃO auto-grava; segue o fluxo normal).
 */
export interface EanResultado {
  produto_canonico: string;
  nome_completo: string;
  marca: string | null;
  fonte: 'openfoodfacts' | 'cosmos';
}

@Injectable()
export class EanEnricherService {
  private readonly logger = new Logger(EanEnricherService.name);
  private readonly cosmosKey: string | null;
  private readonly habilitadoEnv: boolean;

  constructor(private readonly config: ConfigService) {
    this.cosmosKey = this.config.get<string>('COSMOS_API_KEY') || null;
    this.habilitadoEnv = this.config.get<string>('ENGINE_EAN_ENRICH') !== 'false';
  }

  get habilitado(): boolean {
    return this.habilitadoEnv;
  }

  /** EAN válido = 8, 12, 13 ou 14 dígitos numéricos. */
  private eanValido(ean?: string): boolean {
    return !!ean && /^\d{8}$|^\d{12,14}$/.test(ean.trim());
  }

  async consultar(ean?: string): Promise<EanResultado | null> {
    if (!this.habilitado || !this.eanValido(ean)) return null;
    const codigo = ean!.trim();

    const off = await this.consultarOpenFoodFacts(codigo);
    if (off) return off;

    if (this.cosmosKey) {
      const cosmos = await this.consultarCosmos(codigo);
      if (cosmos) return cosmos;
    }
    return null;
  }

  /** Reduz o nome oficial a um produto canônico simples (sem marca/peso). */
  canonizarNome(nomeCompleto: string, marca: string | null): string {
    let s = nomeCompleto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (marca) s = s.split(',')[0]; // OFF usa "Produto, Sabor" às vezes
    // remove marca do texto
    if (marca) {
      for (const m of marca.toLowerCase().split(',')) {
        s = s.replace(new RegExp('\\b' + m.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), ' ');
      }
    }
    return s
      .replace(/\d+[.,]?\d*\s*(kg|g|gr|mg|ml|lt|litros?|un|und|unid|pct|cx|caixa|pc)\b/gi, ' ')
      .replace(/\b\d+[.,]?\d*\s*l\b/gi, ' ')
      .replace(/\b\d+\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ').slice(0, 5).join(' ');
  }

  private async consultarOpenFoodFacts(ean: string): Promise<EanResultado | null> {
    try {
      const axios = (await import('axios')).default;
      const url = `https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=product_name,product_name_pt,brands,generic_name_pt`;
      const res = await axios.get(url, { timeout: 8000, validateStatus: (s) => s < 500 });
      if (res.data?.status !== 1) return null;
      const p = res.data.product || {};
      const nome = p.generic_name_pt || p.product_name_pt || p.product_name;
      if (!nome || String(nome).trim().length < 2) return null;
      const marca = p.brands ? String(p.brands).split(',')[0].trim() : null;
      const canonico = this.canonizarNome(String(nome), marca);
      if (!canonico || canonico.length < 2) return null;
      this.logger.log(`EAN ${ean} → "${canonico}" (Open Food Facts)`);
      return { produto_canonico: canonico, nome_completo: String(nome), marca, fonte: 'openfoodfacts' };
    } catch (e: any) {
      this.logger.warn(`Open Food Facts falhou p/ EAN ${ean}: ${e.message}`);
      return null;
    }
  }

  private async consultarCosmos(ean: string): Promise<EanResultado | null> {
    try {
      const axios = (await import('axios')).default;
      const res = await axios.get(`https://api.cosmos.bluesoft.com.br/gtins/${ean}.json`, {
        timeout: 8000,
        headers: { 'X-Cosmos-Token': this.cosmosKey!, 'Content-Type': 'application/json' },
        validateStatus: (s) => s < 500,
      });
      if (res.status !== 200 || !res.data?.description) return null;
      const nome = String(res.data.description);
      const marca = res.data.brand?.name ? String(res.data.brand.name) : null;
      const canonico = this.canonizarNome(nome, marca);
      if (!canonico || canonico.length < 2) return null;
      this.logger.log(`EAN ${ean} → "${canonico}" (Cosmos)`);
      return { produto_canonico: canonico, nome_completo: nome, marca, fonte: 'cosmos' };
    } catch (e: any) {
      this.logger.warn(`Cosmos falhou p/ EAN ${ean}: ${e.message}`);
      return null;
    }
  }
}
