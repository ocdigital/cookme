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
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useReceiptOcr from '../hooks/useReceiptOcr';

/**
 * Tela para capturar múltiplas fotos de cupom e processar com OCR
 * Suporta:
 * - Capturar múltiplas fotos (até 10)
 * - Processar com deduplicação automática
 * - Review manual de duplicatas
 * - Confirmar itens
 */
export default function ReceiptMultiPhotoScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [currentStep, setCurrentStep] = useState('capture'); // capture | processing | review | success
  const [captureMode, setCaptureMode] = useState('camera'); // camera | gallery
  const cameraRef = useRef(null);

  const ocr = useReceiptOcr();

  // Usar dados do hook para atualizar UI
  const { photos, isLoading, error, result, reviewMode } = ocr;

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

      if (ocr.addPhoto(photo.uri)) {
        Alert.alert(
          'Sucesso',
          `Foto ${ocr.photoCount} capturada`,
          [
            {
              text: 'Capturar mais',
              onPress: () => {
                // Continua no modo câmera
              },
            },
            {
              text: 'Processar',
              onPress: () => processCapture(),
            },
          ]
        );
      } else {
        Alert.alert('Aviso', ocr.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao tirar foto');
      console.error(error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultiple: true, // Permitir múltiplas seleções (se suportado)
      });

      if (!result.canceled) {
        for (const asset of result.assets) {
          ocr.addPhoto(asset.uri);
        }

        if (ocr.photoCount > 0) {
          Alert.alert(
            'Sucesso',
            `${ocr.photoCount} foto(s) selecionadas`,
            [
              {
                text: 'Adicionar mais',
                onPress: () => {
                  // Continua selecionando
                },
              },
              {
                text: 'Processar',
                onPress: () => processCapture(),
              },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao selecionar imagens');
      console.error(error);
    }
  };

  const processCapture = async () => {
    if (photos.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma foto');
      return;
    }

    setCurrentStep('processing');
    const result = await ocr.processPhotos();

    if (result) {
      if (result.status === 'review_required') {
        setCurrentStep('review');
      } else {
        setCurrentStep('success');
      }
    } else {
      Alert.alert('Erro', ocr.error || 'Erro ao processar cupom');
      setCurrentStep('capture');
    }
  };

  const handleConfirm = async () => {
    setCurrentStep('processing');
    const confirmed = await ocr.confirmItems();

    if (confirmed) {
      setCurrentStep('success');
    } else {
      Alert.alert('Erro', ocr.error || 'Erro ao confirmar itens');
      setCurrentStep('review');
    }
  };

  const handleAddRecipe = async () => {
    // Aqui você pode salvar os itens ou criar uma receita
    Alert.alert(
      'Sucesso',
      `${result.items.length} itens processados!`,
      [
        {
          text: 'OK',
          onPress: () => {
            ocr.clearPhotos();
            setCurrentStep('capture');
            // Navegar para próxima tela ou voltar
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text>Solicitando permissão de câmera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={48} color="#999" />
        <Text style={styles.errorMessage}>Permissão de câmera negada</Text>
      </View>
    );
  }

  // ============ PASSO 1: CAPTURAR FOTOS ============
  if (currentStep === 'capture' && !captureMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Capturar Cupom Fiscal</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.photoPreview}>
          {photos.length > 0 ? (
            <>
              <Text style={styles.photoCountText}>
                {photos.length} foto(s) capturada(s)
              </Text>
              <FlatList
                data={photos}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View style={styles.photoItem}>
                    <Image source={{ uri: item }} style={styles.photoThumb} />
                    <View style={styles.photoInfo}>
                      <Text style={styles.photoLabel}>Foto {index + 1}</Text>
                      <TouchableOpacity
                        onPress={() => ocr.removePhoto(index)}
                        style={styles.removeButton}
                      >
                        <MaterialCommunityIcons
                          name="trash-can"
                          size={20}
                          color="#ff6b6b"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                keyExtractor={(_, i) => i.toString()}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="receipt"
                size={64}
                color="#ddd"
              />
              <Text style={styles.emptyText}>
                Nenhuma foto capturada ainda
              </Text>
              <Text style={styles.emptySubtext}>
                Use a câmera ou galeria para adicionar fotos do cupom
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => setCaptureMode('camera')}
          >
            <MaterialCommunityIcons name="camera" size={24} color="#fff" />
            <Text style={styles.btnText}>Câmera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => setCaptureMode('gallery')}
          >
            <MaterialCommunityIcons name="image-multiple" size={24} color="#fff" />
            <Text style={styles.btnText}>Galeria</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <View style={styles.processActions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline]}
              onPress={() => ocr.clearPhotos()}
            >
              <Text style={styles.btnTextOutline}>Limpar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={processCapture}
            >
              <MaterialCommunityIcons
                name="check"
                size={24}
                color="#fff"
              />
              <Text style={styles.btnText}>Processar ({photos.length})</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ============ CÂMERA ============
  if (currentStep === 'capture' && captureMode === 'camera') {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.overlay}>
            <View style={styles.frameGuide}>
              <Text style={styles.frameGuideText}>
                Enquadre o cupom fiscal
              </Text>
              <Text style={styles.frameGuideSubtext}>
                ({photos.length}/10 fotos)
              </Text>
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setCaptureMode(null)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePhoto}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.iconButton,
                  photos.length === 0 && styles.disabled,
                ]}
                onPress={processCapture}
                disabled={photos.length === 0}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  // ============ GALERIA ============
  if (currentStep === 'capture' && captureMode === 'gallery') {
    setTimeout(() => {
      pickImage();
      setCaptureMode(null);
    }, 100);
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  // ============ PROCESSANDO ============
  if (currentStep === 'processing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.processingText}>
          Processando {photos.length} foto(s)...
        </Text>
        <Text style={styles.processingSubtext}>
          Extraindo itens e deduplificando
        </Text>
      </View>
    );
  }

  // ============ REVIEW ============
  if (currentStep === 'review' && result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentStep('capture')}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revisar Cupom</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.reviewContent}>
          {result.receiptNumber && (
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptNumber}>
                Cupom: {result.receiptNumber}
              </Text>
              {result.receiptDate && (
                <Text style={styles.receiptDate}>{result.receiptDate}</Text>
              )}
            </View>
          )}

          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{result.items.length}</Text>
              <Text style={styles.statLabel}>Itens únicos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {result.duplicatesFlagged?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Duplicatas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {result.statistics?.duplicatesRemoved || 0}
              </Text>
              <Text style={styles.statLabel}>Removidas</Text>
            </View>
          </View>

          {result.duplicatesFlagged && result.duplicatesFlagged.length > 0 && (
            <View style={styles.warningSection}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color="#ff9800"
              />
              <Text style={styles.warningText}>
                {result.duplicatesFlagged.length} item(ns) aparecem em múltiplas fotos
              </Text>
            </View>
          )}

          <Text style={styles.itemsTitle}>Itens detectados:</Text>

          {result.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.nome}
                </Text>
              </View>
              <View style={styles.itemFooter}>
                <Text style={styles.itemQty}>Qtd: {item.quantidade}</Text>
                <Text style={styles.itemPrice}>
                  R$ {item.preco_total.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}

          {result.duplicatesFlagged && result.duplicatesFlagged.length > 0 && (
            <View style={styles.duplicatesSection}>
              <Text style={styles.duplicatesTitle}>Duplicatas detectadas:</Text>
              {result.duplicatesFlagged.map((item, index) => (
                <View key={index} style={[styles.itemCard, styles.itemDuplicate]}>
                  <Text style={styles.itemName}>{item.nome}</Text>
                  <Text style={styles.duplicateInfo}>
                    Aparece {item.occurrences} vezes
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => setCurrentStep('capture')}
          >
            <Text style={styles.btnTextOutline}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            <Text style={styles.btnText}>
              {isLoading ? 'Confirmando...' : 'Confirmar'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============ SUCESSO ============
  if (currentStep === 'success' && result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <MaterialCommunityIcons
            name="check-circle"
            size={80}
            color="#4caf50"
          />
          <Text style={styles.successTitle}>Cupom Processado!</Text>
          <Text style={styles.successSubtitle}>
            {result.items.length} itens extraídos com sucesso
          </Text>

          {result.receiptNumber && (
            <View style={styles.successInfo}>
              <Text style={styles.infoLabel}>Cupom:</Text>
              <Text style={styles.infoValue}>{result.receiptNumber}</Text>
            </View>
          )}

          <View style={styles.successStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{result.items.length}</Text>
              <Text style={styles.statName}>Itens</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {result.statistics?.duplicatesRemoved || 0}
              </Text>
              <Text style={styles.statName}>Dedup.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, styles.btnLarge]}
            onPress={handleAddRecipe}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            <Text style={styles.btnText}>Usar itens</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback
  return (
    <View style={styles.container}>
      <Text>Estado desconhecido</Text>
    </View>
  );
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  photoPreview: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  photoCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  photoItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumb: {
    width: 80,
    height: 80,
  },
  photoInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  processActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: '#ff6b6b',
  },
  btnSecondary: {
    backgroundColor: '#ff6b6b',
    flex: 0.5,
  },
  btnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btnLarge: {
    marginTop: 20,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  btnTextOutline: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  frameGuide: {
    alignItems: 'center',
    paddingTop: 40,
  },
  frameGuideText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  frameGuideSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
    gap: 40,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  processingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  reviewContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  receiptHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  receiptNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  receiptDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#f57c00',
    fontWeight: '600',
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  itemDuplicate: {
    borderLeftColor: '#ff9800',
    backgroundColor: '#fff9f0',
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQty: {
    fontSize: 12,
    color: '#999',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  duplicateInfo: {
    fontSize: 12,
    color: '#f57c00',
    marginTop: 4,
  },
  duplicatesSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  duplicatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f57c00',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  successInfo: {
    marginTop: 24,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  successStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  statName: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  errorMessage: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
