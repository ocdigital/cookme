import React, { useState } from 'react';
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
} from 'react-native';

// Mock de produtos no inventário
const mockInventoryProducts = [
  {
    id: '1',
    nome: 'Macarrão Integral',
    categoria: 'Grãos',
    quantidade: 2,
    unidade: 'pacotes',
    dataValidade: '2025-12-20',
    dataAdicionado: '2025-11-01',
    imagem: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=100&h=100&fit=crop',
  },
  {
    id: '2',
    nome: 'Frango Peito',
    categoria: 'Carnes',
    quantidade: 600,
    unidade: 'g',
    dataValidade: '2025-11-15',
    dataAdicionado: '2025-11-01',
    imagem: 'https://images.unsplash.com/photo-1633203777956-8f6530120795?w=100&h=100&fit=crop',
  },
  {
    id: '3',
    nome: 'Queijo Meia Cura',
    categoria: 'Laticínios',
    quantidade: 300,
    unidade: 'g',
    dataValidade: '2025-11-30',
    dataAdicionado: '2025-11-02',
    imagem: 'https://images.unsplash.com/photo-1589985643797-f7ef7c1f1d7d?w=100&h=100&fit=crop',
  },
];

export default function InventoryScreen({ navigation }) {
  const [products, setProducts] = useState(mockInventoryProducts);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'add'
  const [modalVisible, setModalVisible] = useState(false);
  const [addMethod, setAddMethod] = useState(null); // 'qrcode', 'barcode', 'manual'

  // Formulário de entrada manual
  const [manualForm, setManualForm] = useState({
    nome: '',
    categoria: '',
    quantidade: '',
    unidade: 'un',
    dataValidade: '',
  });

  const handleAddProduct = () => {
    if (!manualForm.nome || !manualForm.quantidade || !manualForm.dataValidade) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const newProduct = {
      id: Math.random().toString(),
      nome: manualForm.nome,
      categoria: manualForm.categoria || 'Geral',
      quantidade: parseInt(manualForm.quantidade),
      unidade: manualForm.unidade,
      dataValidade: manualForm.dataValidade,
      dataAdicionado: new Date().toISOString().split('T')[0],
      imagem: 'https://images.unsplash.com/photo-1609780591857-fbf67bb2412e?w=100&h=100&fit=crop',
    };

    setProducts([...products, newProduct]);
    setManualForm({ nome: '', categoria: '', quantidade: '', unidade: 'un', dataValidade: '' });
    setAddMethod(null);
    Alert.alert('Sucesso', 'Produto adicionado ao inventário!');
  };

  const handleRemoveProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const renderProduct = ({ item }) => {
    const today = new Date().toISOString().split('T')[0];
    const daysUntilExpiry = Math.ceil(
      (new Date(item.dataValidade) - new Date(today)) / (1000 * 60 * 60 * 24)
    );

    let expiryStatus = 'ok';
    if (daysUntilExpiry < 0) expiryStatus = 'expired';
    else if (daysUntilExpiry < 3) expiryStatus = 'expiring';

    return (
      <View style={styles.productItem}>
        <Image source={{ uri: item.imagem }} style={styles.productImage} />

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.nome}</Text>
          <Text style={styles.productCategory}>{item.categoria}</Text>
          <Text style={styles.productQuantity}>
            {item.quantidade} {item.unidade}
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
      {activeTab === 'products' ? (
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
              onPress={() => navigation.navigate('QRScanner')}
            >
              <Text style={styles.methodIcon}>📷</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Escanear Cupom Fiscal</Text>
                <Text style={styles.methodSubtitle}>
                  Adicione múltiplos produtos de uma vez
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#4CAF50',
  },
  productsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  productItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#333',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expiryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    color: '#4CAF50',
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
    borderRadius: 4,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  methodsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  methodButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#333',
  },
  methodSubtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  methodArrow: {
    fontSize: 20,
    color: '#4CAF50',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  unitButton: {
    flex: 1,
    minWidth: '18%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 8,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  unitButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateInfo: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
  },
  dateNote: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  barcodePreview: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 60,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#DDD',
  },
  barcodePreviewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  barcodePreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  barcodePreviewSubtext: {
    fontSize: 12,
    color: '#999',
  },
});
