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
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { comprasService } from '../services/api';

export default function ReceiptPhotoScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState(null);
  const cameraRef = useRef(null);

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
        base64: false,
      });

      setPhotoUri(photo.uri);
      processPhoto(photo.uri);
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
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        processPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao selecionar imagem');
      console.error(error);
    }
  };

  const processPhoto = async (uri) => {
    setIsProcessing(true);
    try {
      // Converter imagem para base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Enviar para backend para OCR usando axios com interceptor de token
      const result = await api.post('/compras/ocr-cupom', {
        image_base64: base64,
        image_type: 'receipt',
      });

      setExtractedItems(result.data);
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao processar cupom. Tente novamente.');
      console.error(error);
      setPhotoUri(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddPurchase = async () => {
    if (!extractedItems?.itens || extractedItems.itens.length === 0) {
      Alert.alert('Erro', 'Nenhum item para adicionar');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Iniciando salvamento de itens do cupom...');
      console.log('Itens:', JSON.stringify(extractedItems.itens));

      // Salvar todos os itens do cupom no inventário usando novo endpoint
      const response = await api.post('/compras/ocr-cupom/salvar-itens', {
        itens: extractedItems.itens,
        estabelecimento: extractedItems.estabelecimento,
      });

      console.log('Resposta do servidor:', JSON.stringify(response.data));
      const { salvos, total } = response.data;

      Alert.alert(
        'Sucesso',
        `${salvos} de ${total} item(ns) adicionado(s) ao inventário!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setPhotoUri(null);
              setExtractedItems(null);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao salvar itens:', error);
      console.error('Detalhes do erro:', error.response?.data);
      Alert.alert('Erro', `Não foi possível adicionar os itens. ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Solicitando permissão de câmera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>Permissão de câmera negada</Text>
      </View>
    );
  }

  // Tela de captura de foto
  if (!photoUri) {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.overlay}>
            {/* Guia de enquadramento */}
            <View style={styles.frameGuide}>
              <Text style={styles.frameGuideText}>
                Enquadre o cupom fiscal dentro da área
              </Text>
            </View>

            {/* Botões inferiores */}
            <View style={styles.bottomControls}>
              {/* Galeria */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={pickImage}
              >
                <MaterialCommunityIcons
                  name="image-search-outline"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>

              {/* Capturar foto */}
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePhoto}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>

              {/* Fechar */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialCommunityIcons
                  name="close"
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

  // Tela de processamento
  if (isProcessing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.processingText}>
          Processando cupom fiscal...
        </Text>
      </View>
    );
  }

  // Tela de revisão de itens extraídos
  return (
    <View style={styles.container}>
      <ScrollView style={styles.reviewContainer}>
        <Image
          source={{ uri: photoUri }}
          style={styles.previewImage}
        />

        <View style={styles.itemsContainer}>
          <Text style={styles.title}>Itens detectados</Text>

          {extractedItems?.itens && extractedItems.itens.length > 0 ? (
            <>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>
                  {extractedItems.estabelecimento?.nome || 'Loja'}
                </Text>
                <Text style={styles.storeDetails}>
                  {extractedItems.informacoes_fiscais?.data_hora || ''}
                </Text>
              </View>

              {extractedItems.itens.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.nome}
                    </Text>
                    <Text style={styles.itemPrice}>
                      R$ {parseFloat(item.valor).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetail}>
                      Qtd: {item.quantidade}
                    </Text>
                    <Text style={styles.itemDetail}>
                      {item.codigo_barras || 'Sem código'}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  R$ {parseFloat(extractedItems.totais?.total || 0).toFixed(2)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.errorText}>
              Nenhum item foi detectado. Tente novamente com uma foto mais clara.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => {
            setPhotoUri(null);
            setExtractedItems(null);
          }}
        >
          <Text style={styles.buttonText}>Tirar outra foto</Text>
        </TouchableOpacity>

        {extractedItems?.itens && extractedItems.itens.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleAddPurchase}
            disabled={isProcessing}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              {isProcessing ? 'Adicionando...' : 'Adicionar compra'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
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
  reviewContainer: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 300,
  },
  itemsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  storeInfo: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  storeDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  itemCard: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    color: '#333',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginLeft: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetail: {
    fontSize: 11,
    color: '#999',
  },
  totalCard: {
    padding: 12,
    marginTop: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#ff6b6b',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
