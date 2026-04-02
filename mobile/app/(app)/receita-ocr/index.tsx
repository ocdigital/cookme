import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = 100;
const MAX_PHOTOS = 10;

type Step = 'choose' | 'camera' | 'gallery' | 'processing' | 'review' | 'success';

interface OcrResult {
  items: Array<{ name: string; quantity: number; price: number }>;
  duplicates: string[];
  total: number;
}

export default function ReceiptOcrScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('choose');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    try {
      if (!cameraRef.current) return;

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        setPhotos([...photos, photo.uri]);
        Alert.alert('✓ Foto Capturada', `${photos.length + 1}/${MAX_PHOTOS} fotos`, [
          {
            text: 'Capturar Mais',
            onPress: () => {},
          },
          {
            text: 'Processar',
            onPress: () => {
              setCurrentStep('processing');
              processPhotos([...photos, photo.uri]);
            },
          },
        ]);
      }
    } catch (err) {
      Alert.alert('Erro', 'Falha ao capturar foto');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri);
        const allPhotos = [...photos, ...newPhotos].slice(0, MAX_PHOTOS);
        setPhotos(allPhotos);

        Alert.alert(
          '✓ Imagens Selecionadas',
          `Total: ${allPhotos.length}/${MAX_PHOTOS} fotos`,
          [
            {
              text: 'Adicionar Mais',
              onPress: () => {},
            },
            {
              text: 'Processar',
              onPress: () => {
                setCurrentStep('processing');
                processPhotos(allPhotos);
              },
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Erro', 'Falha ao selecionar imagens');
    }
  };

  const processPhotos = async (photosToProcess: string[]) => {
    if (photosToProcess.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma foto');
      setCurrentStep('choose');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Extrair texto das imagens usando backend
      const ocrTexts = await Promise.all(
        photosToProcess.map(async (photoUri) => {
          try {
            console.log('Processando OCR para:', photoUri);

            // Ler imagem como base64
            const base64 = await FileSystem.readAsStringAsync(photoUri, {
              encoding: 'base64',
            });

            // Enviar pro backend processar
            const ocrResponse = await api.post('/receitas/ocr/extract-from-image', {
              image: base64,
              mimeType: 'image/jpeg',
            });

            const text = ocrResponse.data.ocrText || '';
            console.log('Texto extraído:', text.substring(0, 100));
            return text;
          } catch (ocrErr) {
            console.error('Erro ao processar OCR:', ocrErr);
            return ''; // Retornar vazio em caso de erro
          }
        })
      );

      // Filtrar textos vazios (que falharam)
      const validOcrTexts = ocrTexts.filter((text) => text.length > 0);

      if (validOcrTexts.length === 0) {
        setError('Não consegui ler nenhuma imagem. Tente tirar fotos mais claras.');
        setCurrentStep('choose');
        setIsLoading(false);
        return;
      }

      // Enviar para API do backend
      const response = await api.post('/receitas/ocr/process', {
        photos: validOcrTexts.map((text, idx) => ({
          ocrText: text,
          photoNumber: idx + 1,
          totalPhotos: validOcrTexts.length,
        })),
        ignoreWarnings: false,
      });

      // Converter resposta do backend para formato da UI
      const result: OcrResult = {
        items: response.data.items.map((item: any) => ({
          name: item.nome,
          quantity: item.quantidade,
          price: item.preco_total,
        })),
        duplicates: response.data.duplicatesFlagged?.map((d: any) => d.nome) || [],
        total: response.data.items.reduce((sum: number, item: any) => sum + item.preco_total, 0),
      };

      setOcrResult(result);
      setCurrentStep('review');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar cupom');
      setCurrentStep('choose');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    // Enviar para validação com os produtos extraídos
    if (ocrResult) {
      const produtosJson = JSON.stringify(
        ocrResult.items.map(item => ({
          nome: item.name,
          categoria: 'Alimento',
          confianca_classificacao: 85,
          motivo: 'Extraído do cupom fiscal',
          ingrediente_receita: true,
        }))
      );
      router.push({
        pathname: '/(app)/validacao',
        params: { produtos_json: produtosJson }
      });
    }
  };

  const handleDone = () => {
    setPhotos([]);
    setOcrResult(null);
    setCurrentStep('choose');
    router.back();
  };

  // Permissão não foi concedida
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <MaterialCommunityIcons name="camera-off" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Câmera não autorizada</Text>
          <Text style={styles.errorText}>Permita o acesso à câmera nas configurações</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Solicitando permissão
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Solicitando permissão...</Text>
      </View>
    );
  }

  // ===== PASSO 1: ESCOLHER MÉTODO =====
  if (currentStep === 'choose') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digitalizar Cupom</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.centeredContent}>
          <MaterialCommunityIcons name="receipt" size={80} color="#FF6B6B" />
          <Text style={styles.mainTitle}>Capturar Cupom Fiscal</Text>
          <Text style={styles.subtitle}>Até {MAX_PHOTOS} fotos para melhor resultado</Text>

          <TouchableOpacity
            style={styles.largeButton}
            onPress={() => setCurrentStep('camera')}
          >
            <MaterialCommunityIcons name="camera" size={32} color="#fff" />
            <Text style={styles.largeButtonText}>Usar Câmera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.largeButton, styles.secondaryButton]}
            onPress={pickFromGallery}
          >
            <MaterialCommunityIcons name="image-multiple" size={32} color="#FF6B6B" />
            <Text style={styles.secondaryButtonText}>Galeria</Text>
          </TouchableOpacity>

          {/* Test Mode */}
          <TouchableOpacity
            style={[styles.largeButton, styles.testButton]}
            onPress={() => {
              setCurrentStep('processing');
              processPhotos(['test']);
            }}
          >
            <MaterialCommunityIcons name="beaker" size={32} color="#999" />
            <Text style={styles.testButtonText}>🧪 Teste com 3 Cupons</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== PASSO 2: CÂMERA =====
  if (currentStep === 'camera') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentStep('choose')}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Câmera</Text>
          <Text style={styles.photoCounter}>{photos.length}/{MAX_PHOTOS}</Text>
        </View>

        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.receiptFrame} />
            <Text style={styles.frameHint}>Alinhe o cupom aqui</Text>
          </View>
        </CameraView>

        <View style={styles.photoPreview}>
          <FlatList
            data={photos}
            horizontal
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.photoThumbnail}>
                <Image source={{ uri: item }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.photoList}
          />
        </View>

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => setCurrentStep('choose')}
          >
            <Text style={styles.cameraButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cameraButton, styles.captureButton]}
            onPress={takePhoto}
          >
            <MaterialCommunityIcons name="camera-iris" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cameraButton,
              photos.length === 0 && styles.disabledButton,
            ]}
            disabled={photos.length === 0}
            onPress={() => {
              setCurrentStep('processing');
              processPhotos(photos);
            }}
          >
            <Text style={styles.cameraButtonText}>Processar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== PASSO 3: PROCESSANDO =====
  if (currentStep === 'processing') {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.processingText}>Processando cupom...</Text>
        <Text style={styles.processingSubtext}>Aguarde alguns segundos</Text>
      </View>
    );
  }

  // ===== PASSO 4: REVIEW =====
  if (currentStep === 'review' && ocrResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentStep('choose')}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revisar Itens</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.reviewContent}>
          <View style={styles.reviewStats}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{ocrResult.items.length}</Text>
              <Text style={styles.statLabel}>Itens</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{ocrResult.duplicates.length}</Text>
              <Text style={styles.statLabel}>Duplicatas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>R$ {ocrResult.total.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {ocrResult.duplicates.length > 0 && (
            <View style={styles.duplicateSection}>
              <Text style={styles.sectionTitle}>⚠️ Duplicatas Detectadas</Text>
              {ocrResult.duplicates.map((dup, i) => (
                <Text key={i} style={styles.duplicateItem}>
                  {dup}
                </Text>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>📋 Itens Extraídos</Text>
          {ocrResult.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setCurrentStep('choose')}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== PASSO 5: SUCESSO =====
  if (currentStep === 'success') {
    return (
      <SafeAreaView style={[styles.container, styles.centeredContent]}>
        <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
        <Text style={styles.successTitle}>Cupom Digitalizado!</Text>
        <Text style={styles.successText}>
          {ocrResult?.items.length} itens extraídos com sucesso
        </Text>

        <View style={styles.successStats}>
          <Text style={styles.statsText}>
            Total: R$ {ocrResult?.total.toFixed(2)}
          </Text>
          <Text style={styles.statsText}>
            Duplicatas removidas: {ocrResult?.duplicates.length}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.successButton}
          onPress={handleDone}
        >
          <Text style={styles.successButtonText}>Concluído</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  photoCounter: {
    fontSize: 12,
    color: '#999',
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
    textAlign: 'center',
  },
  largeButton: {
    width: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  largeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptFrame: {
    width: width - 40,
    height: 200,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 8,
  },
  frameHint: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 16,
  },
  photoPreview: {
    height: 140,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
  },
  photoList: {
    paddingHorizontal: 12,
  },
  photoThumbnail: {
    marginRight: 8,
  },
  photoImage: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  cameraButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  captureButton: {
    flex: 1.2,
    backgroundColor: '#FF6B6B',
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  disabledButton: {
    opacity: 0.5,
  },
  reviewContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  duplicateSection: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  duplicateItem: {
    fontSize: 12,
    color: '#666',
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  itemQty: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  successButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 24,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  successText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  successStats: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsText: {
    fontSize: 13,
    color: '#333',
    marginVertical: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 16,
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
});
