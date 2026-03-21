import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, CameraView } from 'expo-camera';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import { colors, spacing, shadows, borderRadius } from '../theme/colors';
import { inventarioService } from '../services/api';
import storage from '../services/storage';

// Remover o pacote react-native-date-picker se necessário
// npm uninstall react-native-date-picker

export default function InventoryScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'add'
  const [modalVisible, setModalVisible] = useState(false);
  const [addMethod, setAddMethod] = useState(null); // 'qrcode', 'barcode', 'manual'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [showOCRCamera, setShowOCRCamera] = useState(false);
  const [ocrPhotoUri, setOCRPhotoUri] = useState(null);
  const [ocrProcessing, setOCRProcessing] = useState(false);
  const [ocrResult, setOCRResult] = useState(null);
  const cameraRef = useRef(null);

  // Formulário de entrada manual
  const [manualForm, setManualForm] = useState({
    nome: '',
    categoria: '',
    quantidade: '',
    unidade: 'un',
    dataValidade: '',
  });

  const loadInventario = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventarioService.getInventario();
      if (data && Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
      setError('Erro ao carregar inventário');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando a aba fica em foco
  useFocusEffect(
    useCallback(() => {
      loadInventario();
    }, [])
  );

  // Carregar produtos ao montar a tela
  useEffect(() => {
    loadInventario();
  }, []);

  // Função de refresh (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await inventarioService.getInventario();
      if (data && Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Erro ao atualizar inventário:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleAddProduct = async () => {
    if (!manualForm.nome || !manualForm.quantidade || !manualForm.dataValidade) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const produtoData = {
        nome: manualForm.nome,
        categoria: manualForm.categoria || 'Geral',
        quantidade: parseFloat(manualForm.quantidade),
        unidade: manualForm.unidade,
        dataValidade: manualForm.dataValidade,
      };

      const newProduct = await inventarioService.adicionarProduto(produtoData);
      setProducts([...products, newProduct]);
      setManualForm({ nome: '', categoria: '', quantidade: '', unidade: 'un', dataValidade: '' });
      setAddMethod(null);
      setModalVisible(false);
      Alert.alert('Sucesso', 'Produto adicionado ao inventário!');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      setError('Erro ao adicionar produto. Tente novamente.');
      Alert.alert('Erro', 'Não foi possível adicionar o produto');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await inventarioService.deletarProduto(id);
              setProducts(products.filter(p => p.id !== id));
              Alert.alert('Sucesso', 'Produto deletado com sucesso');
            } catch (error) {
              console.error('Erro ao deletar produto:', error);
              Alert.alert('Erro', 'Não foi possível deletar o produto');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProduct = (product) => {
    const item = product;
    const produto = item.produto || {};

    setManualForm({
      id: item.id,
      nome: produto.nome || '',
      categoria: produto.tipo || '',
      quantidade: String(item.quantidade_disponivel || ''),
      unidade: item.unidade || 'un',
      dataValidade: item.data_validade || '',
    });
    setAddMethod('edit');
    setModalVisible(true);
  };

  const handleUpdateProduct = async () => {
    if (!manualForm.nome || !manualForm.quantidade || !manualForm.dataValidade) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updateData = {
        quantidade_disponivel: parseFloat(manualForm.quantidade),
        unidade: manualForm.unidade,
        data_validade: manualForm.dataValidade,
      };

      await inventarioService.atualizarProduto(manualForm.id, updateData);

      // Atualizar lista local
      const updatedProducts = products.map(p =>
        p.id === manualForm.id
          ? { ...p, ...updateData }
          : p
      );
      setProducts(updatedProducts);

      setManualForm({ nome: '', categoria: '', quantidade: '', unidade: 'un', dataValidade: '' });
      setAddMethod(null);
      setModalVisible(false);
      Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      setError('Erro ao atualizar produto.');
      Alert.alert('Erro', 'Não foi possível atualizar o produto');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCamera = () => {
    setShowOCRCamera(true);
  };

  const handleTakeOCRPhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });

      // Salvar URI da foto
      setOCRPhotoUri(photo.uri);
      setShowOCRCamera(false);
      setOCRProcessing(true);

      // Tentar extrair data via OCR (usando backend)
      setTimeout(() => {
        extractDateFromPhoto(photo.uri);
      }, 500);
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      Alert.alert('Erro', 'Erro ao capturar foto. Tente novamente.');
      setShowOCRCamera(false);
    }
  };

  const extractDateFromPhoto = async (photoUri) => {
    try {
      setOCRProcessing(true);

      // Converter imagem para base64
      const base64Image = await FileSystem.readAsStringAsync(photoUri, {
        encoding: 'base64',
      });

      const token = await storage.getItem('access_token');
      const response = await fetch('http://192.168.86.9:3000/api/compras/ocr-validade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          image_base64: base64Image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `Erro ${response.status}`;
        throw new Error(`Falha na extração: ${errorMsg}`);
      }

      const data = await response.json();
      const extractedDate = data.data_validade || data.date || null;

      if (extractedDate) {
        // Data foi extraída com sucesso
        setOCRResult(extractedDate);
        setOCRProcessing(false);

        // Mostrar resultado e pedir confirmação
        Alert.alert(
          'Data Identificada',
          `Data extraída: ${extractedDate}\n\nDeseja usar esta data?`,
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                setOCRPhotoUri(null);
                setOCRResult(null);
              },
            },
            {
              text: 'Usar',
              onPress: () => {
                setManualForm({ ...manualForm, dataValidade: extractedDate });
                setOCRPhotoUri(null);
                setOCRResult(null);
                setShowOCRModal(false);
                Alert.alert('Sucesso', `Data ${extractedDate} capturada!`);
              },
            },
            {
              text: 'Editar',
              onPress: () => {
                showDateInputPrompt(extractedDate);
              },
            },
          ]
        );
      } else {
        throw new Error('Nenhuma data identificada na imagem');
      }
    } catch (error) {
      console.error('Erro ao extrair data:', error);
      setOCRProcessing(false);
      setOCRResult(null);

      // Fallback: pedir para digitar manualmente
      Alert.alert(
        'Extração não bem-sucedida',
        `${error.message}\n\nPor favor, digite a data manualmente.`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setOCRPhotoUri(null),
          },
          {
            text: 'Digitar',
            onPress: () => {
              showDateInputPrompt();
            },
          },
        ]
      );
    }
  };

  const showDateInputPrompt = (suggestedDate = '') => {
    Alert.prompt(
      'Data de Validade (OCR)',
      'Digite a data que você vê na foto (YYYY-MM-DD):\n\nEx: 2025-12-31',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setOCRPhotoUri(null),
        },
        {
          text: 'OK',
          onPress: (dateValue) => {
            if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
              setManualForm({ ...manualForm, dataValidade: dateValue });
              setOCRPhotoUri(null);
              setShowOCRModal(false);
              Alert.alert('Sucesso', `Data ${dateValue} capturada!`);
            } else {
              Alert.alert('Erro', 'Formato inválido. Use YYYY-MM-DD (ex: 2025-12-31)');
            }
          },
        },
      ],
      'plain-text',
      suggestedDate || manualForm.dataValidade || ''
    );
  };

  const renderProduct = ({ item }) => {
    const produto = item.produto || {};

    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{produto.nome || 'Produto desconhecido'}</Text>
          <Text style={styles.productCategory}>{produto.tipo || 'Geral'}</Text>
          <Text style={styles.productQuantity}>
            {item.quantidade_disponivel} {item.unidade}
          </Text>
        </View>

        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditProduct(item)}
          >
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleRemoveProduct(item.id)}
          >
            <Text style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Inventário</Text>
        <Text style={styles.headerSubtitle}>{products.length} produtos cadastrados</Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            📦 Produtos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'add' && styles.tabActive]}
          onPress={() => setActiveTab('add')}
        >
          <Text style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}>
            ➕ Adicionar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando inventário...</Text>
        </View>
      ) : activeTab === 'products' ? (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              title="Puxe para atualizar"
              titleColor={colors.text.muted}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
              <Text style={styles.emptySubtext}>
                Adicione produtos para começar a planejar suas receitas
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView style={styles.addContent} showsVerticalScrollIndicator={false}>
          {/* Métodos de Adição */}
          <View style={styles.methodsContainer}>
            <Text style={styles.sectionTitle}>Escolha como adicionar:</Text>

            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => navigation.navigate('ReceiptMultiPhoto')}
            >
              <Text style={styles.methodIcon}>📸</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Foto do Cupom Fiscal</Text>
                <Text style={styles.methodSubtitle}>
                  Fotografe o cupom e extraia os itens automaticamente (múltiplas fotos)
                </Text>
              </View>
              <Text style={styles.methodArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => navigation.navigate('QRScanner')}
            >
              <Text style={styles.methodIcon}>📷</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>QR Code do Cupom</Text>
                <Text style={styles.methodSubtitle}>
                  Escanear QR code SAT (método alternativo)
                </Text>
              </View>
              <Text style={styles.methodArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => {
                setAddMethod('barcode');
                setModalVisible(true);
              }}
            >
              <Text style={styles.methodIcon}>🔍</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Ler Código de Barras</Text>
                <Text style={styles.methodSubtitle}>
                  Aponte a câmera para o código do produto
                </Text>
              </View>
              <Text style={styles.methodArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => {
                setAddMethod('manual');
                setModalVisible(true);
              }}
            >
              <Text style={styles.methodIcon}>✍️</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Entrada Manual</Text>
                <Text style={styles.methodSubtitle}>
                  Preencha os dados do produto manualmente
                </Text>
              </View>
              <Text style={styles.methodArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Dica: Ao adicionar produtos, você poderá planejar receitas com base no que tem em casa!
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Modal para Entrada Manual e Edição */}
      <Modal visible={modalVisible && (addMethod === 'manual' || addMethod === 'edit')} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {addMethod === 'edit' ? 'Editar Produto' : 'Adicionar Produto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nome do Produto *</Text>
              <TextInput
                style={[styles.input, addMethod === 'edit' && { backgroundColor: '#F5F5F5' }]}
                placeholder="Ex: Frango Peito"
                value={manualForm.nome}
                editable={addMethod !== 'edit'}
                onChangeText={(text) => setManualForm({ ...manualForm, nome: text })}
              />

              <Text style={styles.inputLabel}>Categoria</Text>
              <TextInput
                style={[styles.input, addMethod === 'edit' && { backgroundColor: '#F5F5F5' }]}
                placeholder="Ex: Carnes, Laticínios"
                value={manualForm.categoria}
                editable={addMethod !== 'edit'}
                onChangeText={(text) => setManualForm({ ...manualForm, categoria: text })}
              />

              <View style={styles.rowInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantidade *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    keyboardType="numeric"
                    value={manualForm.quantidade}
                    onChangeText={(text) => setManualForm({ ...manualForm, quantidade: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Unidade</Text>
                  <View style={styles.unitSelector}>
                    {['un', 'g', 'kg', 'ml', 'L'].map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitButton,
                          manualForm.unidade === unit && styles.unitButtonActive,
                        ]}
                        onPress={() => setManualForm({ ...manualForm, unidade: unit })}
                      >
                        <Text
                          style={[
                            styles.unitButtonText,
                            manualForm.unidade === unit && styles.unitButtonTextActive,
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Data de Validade *</Text>
              <View style={styles.dateInputContainer}>
                <View style={styles.dateMethodsRow}>
                  <TouchableOpacity
                    style={styles.dateMethodButton}
                    onPress={() => {
                      const dateParts = manualForm.dataValidade.split('-');
                      const initialDate = dateParts.length === 3
                        ? new Date(dateParts[0], parseInt(dateParts[1]) - 1, dateParts[2])
                        : new Date();
                      setSelectedDate(initialDate);
                      setShowDatePicker(true);
                    }}
                  >
                    <Text style={styles.dateMethodIcon}>📅</Text>
                    <View style={styles.dateMethodContent}>
                      <Text style={styles.dateMethodTitle}>Calendário</Text>
                      <Text style={styles.dateMethodValue}>
                        {manualForm.dataValidade || 'Selecione a data'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dateMethodButton}
                    onPress={() => setShowOCRModal(true)}
                  >
                    <Text style={styles.dateMethodIcon}>📸</Text>
                    <View style={styles.dateMethodContent}>
                      <Text style={styles.dateMethodTitle}>OCR</Text>
                      <Text style={styles.dateMethodValue}>Tirar foto</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (event.type === 'set' && date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setManualForm({ ...manualForm, dataValidade: `${year}-${month}-${day}` });
                      setShowDatePicker(false);
                    } else if (event.type === 'dismissed') {
                      setShowDatePicker(false);
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={addMethod === 'edit' ? handleUpdateProduct : handleAddProduct}
              >
                <Text style={styles.submitButtonText}>
                  {addMethod === 'edit' ? '✓ Atualizar Produto' : '✓ Adicionar Produto'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setManualForm({ nome: '', categoria: '', quantidade: '', unidade: 'un', dataValidade: '' });
                  setAddMethod(null);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para OCR de Data de Validade */}
      <Modal visible={showOCRModal && !showOCRCamera} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Capturar Data de Validade</Text>
              <TouchableOpacity onPress={() => setShowOCRModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.ocrPreview}>
                <Text style={styles.ocrPreviewIcon}>📸</Text>
                <Text style={styles.ocrPreviewText}>
                  Tire uma foto da data de validade
                </Text>
                <Text style={styles.ocrPreviewSubtext}>
                  Aponte a câmera para a data impressa no pacote
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleOpenCamera}
              >
                <Text style={styles.submitButtonText}>📷 Abrir Câmera</Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  Tire uma foto clara da data para melhor extração.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowOCRModal(false)}
              >
                <Text style={styles.cancelButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Câmera OCR */}
      <Modal visible={showOCRCamera && !ocrPhotoUri} transparent={true}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />

          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => {
                setShowOCRCamera(false);
                setOCRPhotoUri(null);
              }}
            >
              <Text style={styles.cameraButtonText}>✕ Fechar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cameraButton, styles.cameraCaptureButton]}
              onPress={handleTakeOCRPhoto}
            >
              <Text style={styles.cameraButtonText}>📷 Capturar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para Preview da Foto OCR */}
      <Modal visible={!!ocrPhotoUri} transparent={true}>
        <View style={styles.photoPreviewOverlay}>
          <View style={styles.photoPreviewContainer}>
            <View style={styles.photoPreviewHeader}>
              <Text style={styles.photoPreviewTitle}>
                {ocrProcessing ? 'Analisando...' : 'Foto Capturada'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setOCRPhotoUri(null);
                  setOCRResult(null);
                  setShowOCRCamera(true);
                }}
                disabled={ocrProcessing}
              >
                <Text style={styles.photoPreviewClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {ocrProcessing && (
              <View style={styles.ocrLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.ocrLoadingText}>Extraindo data da imagem...</Text>
              </View>
            )}

            {!ocrProcessing && (
              <>
                <Image
                  source={{ uri: ocrPhotoUri || '' }}
                  style={styles.photoPreview}
                  resizeMode="contain"
                />

                {ocrResult && (
                  <View style={styles.ocrResultContainer}>
                    <Text style={styles.ocrResultLabel}>Data Identificada:</Text>
                    <Text style={styles.ocrResultDate}>{ocrResult}</Text>
                  </View>
                )}
              </>
            )}

            {!ocrProcessing && (
              <View style={styles.photoPreviewFooter}>
                <TouchableOpacity
                  style={styles.photoActionButton}
                  onPress={() => {
                    setOCRPhotoUri(null);
                    setOCRResult(null);
                    setShowOCRCamera(true);
                  }}
                >
                  <Text style={styles.photoActionButtonText}>📷 Tirar Novamente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.photoActionButton, styles.photoActionButtonConfirm]}
                  onPress={() => {
                    if (ocrResult) {
                      Alert.alert(
                        'Confirmar Data',
                        `Usar data ${ocrResult}?`,
                        [
                          {
                            text: 'Cancelar',
                            style: 'cancel',
                          },
                          {
                            text: 'Usar',
                            onPress: () => {
                              setManualForm({ ...manualForm, dataValidade: ocrResult });
                              setOCRPhotoUri(null);
                              setOCRResult(null);
                              setShowOCRModal(false);
                              Alert.alert('Sucesso', `Data ${ocrResult} capturada!`);
                            },
                          },
                        ]
                      );
                    } else {
                      showDateInputPrompt();
                    }
                  }}
                >
                  <Text style={styles.photoActionButtonText}>
                    {ocrResult ? '✓ Usar Data' : '✎ Digitar Data'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para Código de Barras (Mockado por enquanto) */}
      <Modal visible={modalVisible && addMethod === 'barcode'} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ler Código de Barras</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.barcodePreview}>
                <Text style={styles.barcodePreviewIcon}>📷</Text>
                <Text style={styles.barcodePreviewText}>
                  Câmera seria ativada aqui
                </Text>
                <Text style={styles.barcodePreviewSubtext}>
                  Aponte para o código de barras do produto
                </Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  Esta funcionalidade será integrada em breve com bibliotecas de leitura de código de barras.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.xs,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EF5350',
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
    flex: 1,
  },
  errorClose: {
    fontSize: 18,
    color: '#C62828',
    marginLeft: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.muted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  productsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  productItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  productCategory: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  productQuantity: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  productActions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  editButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '300',
  },
  deleteButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 20,
    color: '#999',
    fontWeight: '300',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  methodsContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  methodButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  methodIcon: {
    fontSize: 28,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  methodSubtitle: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  methodArrow: {
    fontSize: 20,
    color: colors.primary,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalClose: {
    fontSize: 24,
    color: colors.text.muted,
  },
  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.soft,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 13,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  unitButton: {
    flex: 1,
    minWidth: '18%',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  unitButtonTextActive: {
    color: colors.white,
  },
  dateInputContainer: {
    marginBottom: spacing.lg,
  },
  dateMethodsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateMethodButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateMethodIcon: {
    fontSize: 24,
  },
  dateMethodContent: {
    flex: 1,
  },
  dateMethodTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dateMethodValue: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  barcodePreview: {
    backgroundColor: colors.background.soft,
    borderRadius: borderRadius.md,
    paddingVertical: 60,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.light,
  },
  barcodePreviewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  barcodePreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  barcodePreviewSubtext: {
    fontSize: 12,
    color: colors.text.muted,
  },
  ocrPreview: {
    backgroundColor: colors.background.soft,
    borderRadius: borderRadius.md,
    paddingVertical: 60,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.light,
  },
  ocrPreviewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  ocrPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  ocrPreviewSubtext: {
    fontSize: 12,
    color: colors.text.muted,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: spacing.md,
  },
  cameraButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minWidth: 120,
  },
  cameraCaptureButton: {
    backgroundColor: '#FF6B35',
  },
  cameraButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  photoPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    maxHeight: '90%',
    width: '90%',
  },
  photoPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  photoPreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  photoPreviewClose: {
    fontSize: 24,
    color: colors.text.muted,
  },
  photoPreview: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F5',
  },
  photoPreviewFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  photoActionButton: {
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  photoActionButtonConfirm: {
    backgroundColor: colors.primary,
  },
  photoActionButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  ocrLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  ocrLoadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500',
  },
  ocrResultContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  ocrResultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  ocrResultDate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
});
