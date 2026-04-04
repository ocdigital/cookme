import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ItemReceipt {
  nome: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
}

export interface DedupItem extends ItemReceipt {
  occurrences?: number;
  signatures?: string[];
}

export interface ProcessedReceipt {
  items: ItemReceipt[];
  rawText: string;
  photoNumber?: number;
  receiptNumber?: string | null;
  date?: string | null;
}

export interface DeduplicationResult {
  uniqueItems: ItemReceipt[];
  duplicatesFlagged: DedupItem[];
  statistics: {
    totalItemsProcessed: number;
    duplicatesRemoved: number;
    itemsNeedingReview: number;
  };
}

@Injectable()
export class ReceiptOcrService {
  private readonly logger = new Logger(ReceiptOcrService.name);

  /**
   * Extrai itens de texto OCR de cupom fiscal
   * Padrão esperado: PRODUTO QTD UN x PRECO_UNI PRECO_TOTAL
   */
  extractItemsFromReceipt(ocrText: string): ItemReceipt[] {
    const lines = ocrText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const items: ItemReceipt[] = [];

    for (const line of lines) {
      const item = this.parseItemLine(line);
      if (item) {
        items.push(item);
      }
    }

    this.logger.debug(`Extraídos ${items.length} itens do cupom`);
    return items;
  }

  /**
   * Parse de linha individual do cupom
   * Regex para: NOME QTD UN x PRECO_UNI PRECO_TOTAL
   */
  private parseItemLine(line: string): ItemReceipt | null {
    // Remove código de barras do início se houver
    let cleanLine = line.replace(/^\d{10,}\s+/, '');

    // Padrão: "PRODUTO_NAME QUANTIDADE UNIDADE x PREÇO_UNITÁRIO PREÇO_TOTAL"
    // Exemplos:
    // "CEBOLA NACIONAL 0.670 KG x 11.98 11.98"
    // "OVOS CAIPIRA NATUREZA 1 UN x 11.98 11.98"
    // "LEITE ITALAC 1L 1 UN x 4.98 4.98"
    // Nota: O produto pode ter "1KG" no nome, mas a linha sempre termina com "QUANT UNIT x PREÇO PREÇO"

    const regex =
      /^(.+?)\s+([\d.,]+)\s+(KG|UN|L|ML|G)\s+x\s+([\d,]+)\s+([\d,]+)\s*$/i;

    const match = cleanLine.match(regex);

    if (match) {
      const nome = match[1].trim();
      const quantidade = parseFloat(match[2].replace(',', '.'));
      const unidade = match[3].toUpperCase();
      const preco_unitario = this.parsePrice(match[4]);
      const preco_total = this.parsePrice(match[5]);

      if (
        nome.length > 0 &&
        quantidade > 0 &&
        preco_unitario > 0 &&
        preco_total > 0
      ) {
        return {
          nome,
          quantidade: Math.round(quantidade), // Arredondar para inteiro
          preco_unitario,
          preco_total,
        };
      }
    }

    return null;
  }

  /**
   * Converte preço com vírgula (1,98) para número (1.98)
   */
  private parsePrice(priceStr: string): number {
    return parseFloat(priceStr.replace(',', '.'));
  }

  /**
   * Gera assinatura única para um item
   * Usa nome + preço para identificar duplicatas
   */
  generateItemSignature(item: ItemReceipt): string {
    // Normalizar nome: remover espaços extras, converter para maiúscula
    const normalizedNome = item.nome
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();

    // Assinatura: NOME + PRECO_TOTAL (preço é mais confiável)
    const signatureBase = `${normalizedNome}|${item.preco_total.toFixed(2)}`;

    return crypto
      .createHash('md5')
      .update(signatureBase)
      .digest('hex');
  }

  /**
   * Calcula similaridade entre duas strings (0-1)
   * Usa Levenshtein distance normalizado
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toUpperCase().replace(/\s+/g, '');
    const s2 = str2.toUpperCase().replace(/\s+/g, '');

    if (s1 === s2) return 1;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcula Levenshtein distance entre duas strings
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];

    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }

    return costs[s2.length];
  }

  /**
   * Deduplica itens de múltiplas fotos
   * Remove itens duplicados usando assinatura + similaridade
   */
  deduplicateItems(items: ItemReceipt[]): ItemReceipt[] {
    const seen = new Map<string, ItemReceipt>();
    const similarityThreshold = 0.85; // 85% similar = duplicata

    for (const item of items) {
      const signature = this.generateItemSignature(item);

      // Se assinatura exata existe, é duplicata certa
      if (seen.has(signature)) {
        this.logger.debug(
          `Duplicata removida (assinatura exata): ${item.nome}`,
        );
        continue;
      }

      // Verificar similaridade com itens existentes
      let isDuplicate = false;
      for (const [, existingItem] of seen) {
        const similarity = this.calculateSimilarity(
          item.nome,
          existingItem.nome,
        );

        // Se nome é muito similar E preço é idêntico, é duplicata
        if (
          similarity >= similarityThreshold &&
          Math.abs(item.preco_total - existingItem.preco_total) < 0.01
        ) {
          this.logger.debug(
            `Duplicata removida (similaridade ${(similarity * 100).toFixed(0)}%): ${item.nome}`,
          );
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seen.set(signature, item);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Processa múltiplas fotos de cupom
   * Extrai itens de cada foto e deduplica
   */
  processMultipleReceipts(receipts: ProcessedReceipt[]): DeduplicationResult {
    let allItems: ItemReceipt[] = [];
    const itemMap = new Map<string, ItemReceipt & { occurrences: number }>();

    // Primeira passagem: coletar todos os itens
    for (const receipt of receipts) {
      allItems = allItems.concat(receipt.items);
    }

    // Segunda passagem: contar ocorrências
    for (const item of allItems) {
      const signature = this.generateItemSignature(item);

      if (itemMap.has(signature)) {
        const existing = itemMap.get(signature)!;
        existing.occurrences += 1;
      } else {
        itemMap.set(signature, {
          ...item,
          occurrences: 1,
        });
      }
    }

    // Terceira passagem: aplicar deduplicação e validação
    const uniqueItems: ItemReceipt[] = [];
    const duplicatesFlagged: DedupItem[] = [];

    for (const [, item] of itemMap) {
      if (item.occurrences > 1) {
        duplicatesFlagged.push({
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          preco_total: item.preco_total,
          occurrences: item.occurrences,
        });
      } else {
        uniqueItems.push({
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          preco_total: item.preco_total,
        });
      }
    }

    return {
      uniqueItems,
      duplicatesFlagged,
      statistics: {
        totalItemsProcessed: allItems.length,
        duplicatesRemoved: allItems.length - uniqueItems.length,
        itemsNeedingReview: duplicatesFlagged.length,
      },
    };
  }

  /**
   * Validação híbrida: retorna itens que precisam de review manual
   */
  validateDeduplification(items: DedupItem[]): DedupItem[] {
    return items.filter((item) => {
      // Itens que aparecem 2+ vezes precisam de review
      return (item.occurrences ?? 0) >= 2;
    });
  }

  /**
   * Extrai número do cupom do texto OCR
   * Procura por padrão comum: "N.XXXXX Série:XXX"
   */
  extractReceiptNumber(ocrText: string): string | null {
    const regex = /N\.(\d+)\s+S(?:ér)?ie[:\s]+(\d+)/i;
    const match = ocrText.match(regex);

    if (match) {
      return `${match[1]}_${match[2]}`;
    }

    return null;
  }

  /**
   * Extrai data do cupom
   */
  extractReceiptDate(ocrText: string): string | null {
    // Padrão DD/MM/YYYY HH:MM
    const regex = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/;
    const match = ocrText.match(regex);

    if (match) {
      return match[0];
    }

    return null;
  }
}
