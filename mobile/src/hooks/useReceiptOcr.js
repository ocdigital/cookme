import { useState } from 'react';
import receiptOcrService from '../services/receiptOcrService';

/**
 * Hook para gerenciar fluxo completo de OCR de cupom
 * - Captura múltiplas fotos
 * - Faz OCR de cada uma
 * - Deduplica itens
 * - Gerencia validação híbrida
 */
export const useReceiptOcr = () => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);

  /**
   * Adiciona uma nova foto à lista
   */
  const addPhoto = (photoUri) => {
    if (photos.length >= 10) {
      setError('Máximo de 10 fotos permitidas');
      return false;
    }

    setPhotos([...photos, photoUri]);
    setError(null);
    return true;
  };

  /**
   * Remove uma foto da lista
   */
  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  /**
   * Limpa todas as fotos
   */
  const clearPhotos = () => {
    setPhotos([]);
    setResult(null);
    setReviewMode(false);
    setError(null);
  };

  /**
   * Processa as fotos capturadas
   */
  const processPhotos = async () => {
    if (photos.length === 0) {
      setError('Adicione pelo menos uma foto');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const processResult = await receiptOcrService.processMultiplePhotos(
        photos
      );

      setResult(processResult);

      // Se precisa review, ativar modo review
      if (processResult.status === 'review_required') {
        setReviewMode(true);
        console.log('⚠️ Review necessário:', processResult.duplicatesFlagged);
      } else {
        setReviewMode(false);
        console.log('✅ Processamento concluído sem duplicatas');
      }

      return processResult;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao processar cupom';
      setError(errorMessage);
      console.error('Erro no processamento:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Confirma itens após review manual
   */
  const confirmItems = async (itemsToConfirm = null, approvedDuplicates = []) => {
    if (!result) {
      setError('Nenhum resultado para confirmar');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const itemsToSend = itemsToConfirm || result.items;

      const confirmResult = await receiptOcrService.validateAndConfirm(
        itemsToSend,
        approvedDuplicates,
        result.receiptNumber
      );

      setResult(confirmResult);
      setReviewMode(false);

      return confirmResult;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao confirmar itens';
      setError(errorMessage);
      console.error('Erro na confirmação:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Retorna estado resumido
   */
  const getState = () => ({
    photos,
    isLoading,
    error,
    result,
    reviewMode,
    photoCount: photos.length,
    itemCount: result?.items?.length || 0,
    duplicateCount: result?.duplicatesFlagged?.length || 0,
    statistics: result?.statistics || null,
    receiptNumber: result?.receiptNumber,
    receiptDate: result?.receiptDate,
  });

  return {
    // Estado
    photos,
    isLoading,
    error,
    result,
    reviewMode,

    // Ações
    addPhoto,
    removePhoto,
    clearPhotos,
    processPhotos,
    confirmItems,

    // Informações
    getState,
    photoCount: photos.length,
    itemCount: result?.items?.length || 0,
    duplicateCount: result?.duplicatesFlagged?.length || 0,
  };
};

export default useReceiptOcr;
