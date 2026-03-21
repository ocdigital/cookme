import api from './api';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Serviço para processar OCR de cupom com múltiplas fotos
 * Suporta deduplicação automática + validação híbrida
 */
export const receiptOcrService = {
  /**
   * Converte imagem URI para base64
   */
  async imageToBase64(imageUri) {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // Expo/Mobile
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      }
    } catch (error) {
      console.error('Erro ao converter imagem para base64:', error);
      throw error;
    }
  },

  /**
   * Extrai OCR de uma imagem usando Tesseract
   * (Frontend - roda no dispositivo)
   */
  async extractOcrFromImage(imageUri) {
    try {
      // Usar react-native-tesseract-ocr para mobile/expo
      const TesseractOcr = require('react-native-tesseract-ocr').default;

      console.log(`[Tesseract] Processando: ${imageUri.substring(0, 50)}...`);

      // Tesseract em português brasileiro
      const ocrResult = await TesseractOcr.recognizeImage(imageUri, {
        language: 'por', // Português
      });

      if (!ocrResult || ocrResult.trim().length === 0) {
        throw new Error('Nenhum texto detectado na imagem');
      }

      console.log(`[Tesseract] Texto extraído (${ocrResult.length} caracteres)`);
      return ocrResult;
    } catch (error) {
      console.error('Erro ao extrair OCR:', error);
      throw new Error('Falha ao processar imagem. Tente uma foto mais clara.');
    }
  },

  /**
   * Processa múltiplas fotos de cupom
   * Faz OCR de cada uma e envia pro backend para deduplicação
   *
   * @param {Array} photoUris - Array de URIs de imagens
   * @returns {Promise} Resultado com itens deduplificados
   */
  async processMultiplePhotos(photoUris) {
    try {
      if (!photoUris || photoUris.length === 0) {
        throw new Error('Nenhuma foto fornecida');
      }

      if (photoUris.length > 10) {
        throw new Error('Máximo de 10 fotos permitidas por cupom');
      }

      console.log(`[OCR] Processando ${photoUris.length} foto(s)...`);

      // Passo 1: Fazer OCR de cada foto
      const ocrPromises = photoUris.map(async (uri, index) => {
        console.log(`[OCR] Foto ${index + 1}/${photoUris.length}: Extraindo texto...`);
        const ocrText = await this.extractOcrFromImage(uri);

        return {
          ocrText,
          photoNumber: index + 1,
          totalPhotos: photoUris.length,
        };
      });

      const ocrResults = await Promise.all(ocrPromises);
      console.log(`[OCR] Texto extraído de ${ocrResults.length} foto(s)`);

      // Passo 2: Enviar para backend para deduplicação
      console.log('[API] Enviando para deduplicação...');
      const response = await api.post('/receitas/ocr/process', {
        photos: ocrResults,
        ignoreWarnings: false, // Ativa validação híbrida
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao processar cupom:', error);
      throw error;
    }
  },

  /**
   * Confirma itens após review manual
   *
   * @param {Array} items - Itens confirmados
   * @param {Array} approvedDuplicates - Índices dos duplicados aprovados
   * @param {String} receiptNumber - Número do cupom (opcional)
   * @returns {Promise} Resultado confirmado
   */
  async validateAndConfirm(items, approvedDuplicates = [], receiptNumber = null) {
    try {
      const response = await api.post('/receitas/ocr/validate', {
        items,
        approvedDuplicates,
        receiptNumber,
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      throw error;
    }
  },
};

export default receiptOcrService;
