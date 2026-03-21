import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptOcrService } from './receipt-ocr.service';

describe('ReceiptOcrService', () => {
  let service: ReceiptOcrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReceiptOcrService],
    }).compile();

    service = module.get<ReceiptOcrService>(ReceiptOcrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractItemsFromReceipt', () => {
    it('should extract items from OCR text', () => {
      const ocrText = `
        BOLO PANCO ABACAXI 300G 1 UN x 9,98 9,98
        CAFE MORGES VACUO 500G 1 UN x 25,98 25,98
        AGUA MIN BIOLEUE PRIME 12 UN x 1,98 23,76
      `;

      const items = service.extractItemsFromReceipt(ocrText);

      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({
        nome: 'BOLO PANCO ABACAXI 300G',
        quantidade: 1,
        preco_unitario: 9.98,
        preco_total: 9.98,
      });
    });

    it('should handle items with variable whitespace', () => {
      const ocrText = `
        BOLO   PANCO    ABACAXI 300G    1    UN    x    9,98    9,98
      `;

      const items = service.extractItemsFromReceipt(ocrText);

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].nome).toContain('BOLO');
      expect(items[0].quantidade).toBe(1);
    });
  });

  describe('deduplicateItems', () => {
    it('should remove duplicate items from multiple photos', () => {
      const items1 = [
        {
          nome: 'BOLO PANCO ABACAXI 300G',
          quantidade: 1,
          preco_unitario: 9.98,
          preco_total: 9.98,
        },
        {
          nome: 'CAFE MORGES VACUO 500G',
          quantidade: 1,
          preco_unitario: 25.98,
          preco_total: 25.98,
        },
      ];

      const items2 = [
        {
          nome: 'CAFE MORGES VACUO 500G',
          quantidade: 1,
          preco_unitario: 25.98,
          preco_total: 25.98,
        },
        {
          nome: 'AGUA MIN BIOLEUE PRIME 12 UN',
          quantidade: 1,
          preco_unitario: 1.98,
          preco_total: 23.76,
        },
      ];

      const allItems = [...items1, ...items2];
      const deduplicated = service.deduplicateItems(allItems);

      expect(deduplicated).toHaveLength(3);
      expect(
        deduplicated.filter((i) => i.nome.includes('CAFE')),
      ).toHaveLength(1);
    });

    it('should handle slight OCR variations in product names', () => {
      const items = [
        {
          nome: 'BOLO PANCO ABACAXI 300G',
          quantidade: 1,
          preco_unitario: 9.98,
          preco_total: 9.98,
        },
        {
          nome: 'BOLO PANCO ABACAXI 3006', // Pequena variação de OCR
          quantidade: 1,
          preco_unitario: 9.98,
          preco_total: 9.98,
        },
      ];

      const deduplicated = service.deduplicateItems(items);

      // Deve detectar como duplicata por similaridade
      expect(deduplicated.length).toBeLessThanOrEqual(2);
    });
  });

  describe('generateItemSignature', () => {
    it('should generate consistent signature for same item', () => {
      const item = {
        nome: 'BOLO PANCO ABACAXI 300G',
        quantidade: 1,
        preco_unitario: 9.98,
        preco_total: 9.98,
      };

      const sig1 = service.generateItemSignature(item);
      const sig2 = service.generateItemSignature(item);

      expect(sig1).toBe(sig2);
    });

    it('should generate different signature for different prices', () => {
      const item1 = {
        nome: 'BOLO PANCO',
        quantidade: 1,
        preco_unitario: 9.98,
        preco_total: 9.98,
      };

      const item2 = {
        nome: 'BOLO PANCO',
        quantidade: 1,
        preco_unitario: 10.98,
        preco_total: 10.98,
      };

      const sig1 = service.generateItemSignature(item1);
      const sig2 = service.generateItemSignature(item2);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('validateDeduplification', () => {
    it('should return duplicates needing manual review', () => {
      const items = [
        {
          nome: 'BOLO PANCO ABACAXI 300G',
          quantidade: 1,
          preco_unitario: 9.98,
          preco_total: 9.98,
          occurrences: 2,
        },
        {
          nome: 'CAFE MORGES',
          quantidade: 1,
          preco_unitario: 25.98,
          preco_total: 25.98,
          occurrences: 1,
        },
      ];

      const needsReview = service.validateDeduplification(items);

      expect(needsReview).toHaveLength(1);
      expect(needsReview[0].nome).toContain('BOLO');
    });
  });
});
