import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, shadows, borderRadius } from '../theme/colors';
import { inventarioService, produtosService } from '../services/api';
import { preloadProductImages } from '../services/productImageCache';
import { getProductIcon } from '../utils/productIcons';

export default function InventoryScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'add'
  const [modalVisible, setModalVisible] = useState(false);
  const [addMethod, setAddMethod] = useState(null); // 'qrcode', 'barcode', 'manual'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // Pre-carregar imagens em background (não bloqueia UI)
        preloadProductImages(data).catch((err) => {
          console.debug('Erro ao pre-carregar imagens:', err);
        });
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

  const renderProduct = ({ item }) => {
    // Estrutura da resposta: item.produto contém os dados do produto
    const produto = item.produto || {};

    const today = new Date().toISOString().split('T')[0];
    const daysUntilExpiry = Math.ceil(
      (new Date(item.data_validade) - new Date(today)) / (1000 * 60 * 60 * 24)
    );

    let expiryStatus = 'ok';
    if (daysUntilExpiry < 0) expiryStatus = 'expired';
    else if (daysUntilExpiry < 3) expiryStatus = 'expiring';

    return (
      <View style={styles.productItem}>
        {/* Mostrar imagem do produto ou ícone baseado no nome */}
        {produto.imagem_url ? (
          <Image source={{ uri: produto.imagem_url }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 40 }}>{getProductIcon(produto.nome)}</Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{produto.nome || 'Produto desconhecido'}</Text>
          <Text style={styles.productCategory}>{produto.tipo || 'Geral'}</Text>
          <Text style={styles.productQuantity}>
            {item.quantidade_disponivel} {item.unidade}
          </Text>
        </View>

        <View style={styles.productRight}>
          <View
            style={[
              styles.expiryBadge,
              expiryStatus === 'expired' && styles.expiryExpired,
              expiryStatus === 'expiring' && styles.expiryExpiring,
            ]}
          >
            <Text
              style={[
                styles.expiryText,
                expiryStatus !== 'ok' && styles.expiryTextAlert,
              ]}
            >
              {expiryStatus === 'expired'
                ? '⚠️ Vencido'
                : expiryStatus === 'expiring'
                ? `⏰ ${daysUntilExpiry}d`
                : '✓ Ok'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleRemoveProduct(item.id)}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
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
              onPress={() => navigation.navigate('ReceiptPhoto')}
            >
              <Text style={styles.methodIcon}>📸</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Foto do Cupom Fiscal</Text>
                <Text style={styles.methodSubtitle}>
                  Fotografe o cupom e extraia os itens automaticamente
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

      {/* Modal para Entrada Manual */}
      <Modal visible={modalVisible && addMethod === 'manual'} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Produto</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nome do Produto *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Frango Peito"
                value={manualForm.nome}
                onChangeText={(text) => setManualForm({ ...manualForm, nome: text })}
              />

              <Text style={styles.inputLabel}>Categoria</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Carnes, Laticínios"
                value={manualForm.categoria}
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
                <Text style={styles.dateInfo}>
                  Formato: YYYY-MM-DD (Ex: 2025-12-31)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="2025-12-31"
                  value={manualForm.dataValidade}
                  onChangeText={(text) => setManualForm({ ...manualForm, dataValidade: text })}
                />
                <Text style={styles.dateNote}>
                  💡 Dica: Você também pode usar OCR para ler a data do pacote
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddProduct}
              >
                <Text style={styles.submitButtonText}>✓ Adicionar Produto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
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
  productRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  expiryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  expiryExpiring: {
    backgroundColor: '#FFF3E0',
  },
  expiryExpired: {
    backgroundColor: '#FFEBEE',
  },
  expiryText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  expiryTextAlert: {
    color: '#F57C00',
  },
  expiryTextAlert: {
    color: '#D32F2F',
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 12,
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
  dateInfo: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  dateNote: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
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
});
