/**
 * Fallback OCR Service
 * Usa texto mockado para testes quando Tesseract não está disponível
 * (útil para desenvolvimento/testes sem compilar native modules)
 */

import api from './api';

const MOCK_RECEIPTS = {
  small: `BOLO PANCO ABACAXI 300G 1 UN x 9,98 9,98
CAFE MORGES VACUO 500G 1 UN x 25,98 25,98
AGUA MIN BIOLEUE PRIME 12 UN x 1,98 23,76`,

  medium: `BOLO PANCO ABACAXI 300G 1 UN x 9,98 9,98
CAFE MORGES VACUO 500G 1 UN x 25,98 25,98
AGUA MIN BIOLEUE PRIME 12 UN x 1,98 23,76
BISCOITO INTEGRAL 200G 2 UN x 4,99 9,98
LEITE INTEGRAL 1L 3 UN x 5,50 16,50
PAGO FRANGO PEITO 800G 1 UN x 18,59 18,59
ARROZ GRAO CAMPO 5KG 1 UN x 10,98 10,98
FEIJAO BROTO LEGAL CARIO 2 UN x 8,99 17,98`,

  large: `BOLO PANCO ABACAXI 300G 1 UN x 9,98 9,98
CAFE MORGES VACUO 500G 1 UN x 25,98 25,98
AGUA MIN BIOLEUE PRIME 12 UN x 1,98 23,76
BISCOITO INTEGRAL 200G 2 UN x 4,99 9,98
LEITE INTEGRAL 1L 3 UN x 5,50 16,50
PAGO FRANGO PEITO 800G 1 UN x 18,59 18,59
ARROZ GRAO CAMPO 5KG 1 UN x 10,98 10,98
FEIJAO BROTO LEGAL CARIO 2 UN x 8,99 17,98
TOMATE SALADA KG 0,768 KG x 10,98 8,43
CEBOLA NACIONAL KG 0,870 KG x 4,69 4,08
AMENDOIM YOKI BCO 500G 1 UN x 20,49 20,49
FAROFA MANDIOCA YOKI 400G 1 UN x 5,98 5,98
FARINHA TRIGO VENTURELLI 1 UN x 4,98 4,98
MAc D BENTA OVOS PARAFUSO 1 UN x 3,39 3,39
CANJICA YOKI BRANCA 400G 1 UN x 9,09 9,09
FEIJAO BROTO LEGAL CARIO 2 UN x 8,99 17,98
ARROZ GRAO CAMPO 5KG 1 UN x 10,98 10,98
BISABUGINHA PANCO PREM 3 2 UN x 7,79 15,58
SALG FANDANGOS PRESUNTO 1 UN x 20,98 20,98
SALG CHEETOS ONDA RED 2 UN x 20,90 20,90`,
};

export const receiptOcrServiceFallback = {
  /**
   * Simula extração de OCR (para testes)
   * Retorna texto mockado baseado no tamanho
   */
  async extractOcrFromImageMock(photoNumber, totalPhotos) {
    console.log(`[MOCK OCR] Foto ${photoNumber}/${totalPhotos}: Simulando extração...`);

    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Escolher entre os receipts mockados
    let text;
    if (totalPhotos === 1) {
      text = MOCK_RECEIPTS.large;
    } else if (totalPhotos === 2) {
      text = photoNumber === 1 ? MOCK_RECEIPTS.large : MOCK_RECEIPTS.medium;
    } else {
      // 3+ fotos
      const size = photoNumber === 1 ? 'large' : photoNumber === 2 ? 'medium' : 'small';
      text = MOCK_RECEIPTS[size];
    }

    console.log(`[MOCK OCR] ✅ Foto ${photoNumber}: ${text.split('\n').length} linhas extraídas`);
    return text;
  },

  /**
   * Processa múltiplas fotos usando OCR mockado
   * Útil para testes sem compilar módulos nativos
   */
  async processMultiplePhotosMock(photoCount = 3) {
    try {
      console.log(`[MOCK] 🔄 Processando ${photoCount} foto(s)...`);

      // Simular OCR em cada foto
      const ocrPromises = Array.from({ length: photoCount }, async (_, index) => {
        const ocrText = await this.extractOcrFromImageMock(index + 1, photoCount);
        return {
          ocrText,
          photoNumber: index + 1,
          totalPhotos: photoCount,
        };
      });

      const ocrResults = await Promise.all(ocrPromises);
      console.log(`[MOCK] ✅ OCR completo para ${ocrResults.length} foto(s)`);

      // Enviar para backend
      console.log('[MOCK API] 📤 Enviando para deduplicação...');
      const response = await api.post('/receitas/ocr/process', {
        photos: ocrResults,
        ignoreWarnings: false,
      });

      console.log('[MOCK API] ✅ Resposta recebida:', {
        status: response.data.status,
        items: response.data.items?.length,
        duplicates: response.data.duplicatesFlagged?.length,
      });

      return response.data;
    } catch (error) {
      console.error('[MOCK] ❌ Erro:', error.message);
      throw error;
    }
  },
};

export default receiptOcrServiceFallback;
