import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useListas } from '@/hooks/useListas';

export default function ListDetailScreen() {
  const router = useRouter();
  const { id, titulo } = useLocalSearchParams<{ id: string; titulo: string }>();

  const {
    listaAtual,
    loading,
    erro,
    carregarLista,
    adicionarItem,
    atualizarItem,
    deletarItem,
    marcarComprado,
    limparComprados,
  } = useListas();

  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form fields
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemQuantidade, setNovoItemQuantidade] = useState('1');
  const [novoItemUnidade, setNovoItemUnidade] = useState('');
  const [novoItemPreco, setNovoItemPreco] = useState('');
  const [novoItemCategoria, setNovoItemCategoria] = useState('');
  const [novoItemLoja, setNovoItemLoja] = useState('');
  const [novoItemPrioridade, setNovoItemPrioridade] = useState<'alta' | 'media' | 'baixa'>('media');

  useFocusEffect(
    useCallback(() => {
      if (id) {
        carregarLista(id);
      }
    }, [id, carregarLista]),
  );

  const handleAdicionarItem = async () => {
    if (!novoItemNome.trim()) {
      Alert.alert('Erro', 'Nome do item é obrigatório');
      return;
    }

    try {
      await adicionarItem(
        novoItemNome,
        parseInt(novoItemQuantidade) || 1,
        novoItemUnidade || undefined,
        novoItemPreco ? parseFloat(novoItemPreco) : undefined,
        novoItemCategoria || undefined,
        novoItemLoja || undefined,
        novoItemPrioridade,
      );

      setNovoItemNome('');
      setNovoItemQuantidade('1');
      setNovoItemUnidade('');
      setNovoItemPreco('');
      setNovoItemCategoria('');
      setNovoItemLoja('');
      setNovoItemPrioridade('media');
      setModalVisible(false);
      setEditMode(false);
    } catch {
      Alert.alert('Erro', 'Falha ao adicionar item');
    }
  };

  const handleAtualizarItem = async () => {
    if (!selectedItem) return;

    try {
      await atualizarItem(selectedItem.id, {
        nome: novoItemNome || selectedItem.nome,
        quantidade: parseInt(novoItemQuantidade) || selectedItem.quantidade,
        unidade: novoItemUnidade || selectedItem.unidade,
        preco_unitario: novoItemPreco ? parseFloat(novoItemPreco) : selectedItem.preco_unitario,
        categoria: novoItemCategoria || selectedItem.categoria,
        loja: novoItemLoja || selectedItem.loja,
        prioridade: novoItemPrioridade,
      });

      setNovoItemNome('');
      setNovoItemQuantidade('1');
      setNovoItemUnidade('');
      setNovoItemPreco('');
      setNovoItemCategoria('');
      setNovoItemLoja('');
      setNovoItemPrioridade('media');
      setModalVisible(false);
      setEditMode(false);
      setSelectedItem(null);
    } catch {
      Alert.alert('Erro', 'Falha ao atualizar item');
    }
  };

  const handleDeletarItem = (itemId: string, itemNome: string) => {
    Alert.alert(
      'Deletar Item',
      `Deseja deletar "${itemNome}"?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Deletar',
          onPress: () => deletarItem(itemId),
          style: 'destructive',
        },
      ],
    );
  };

  const handleEditarItem = (item: any) => {
    setSelectedItem(item);
    setNovoItemNome(item.nome);
    setNovoItemQuantidade(item.quantidade.toString());
    setNovoItemUnidade(item.unidade || '');
    setNovoItemPreco(item.preco_unitario?.toString() || '');
    setNovoItemCategoria(item.categoria || '');
    setNovoItemLoja(item.loja || '');
    setNovoItemPrioridade(item.prioridade || 'media');
    setEditMode(true);
    setModalVisible(true);
  };

  const handleLimparComprados = () => {
    const compradosCount = listaAtual?.itens?.filter((i: any) => i.comprado).length || 0;
    if (compradosCount === 0) {
      Alert.alert('Info', 'Nenhum item marcado como comprado');
      return;
    }

    Alert.alert(
      'Limpar Comprados',
      `Deseja remover ${compradosCount} item${compradosCount !== 1 ? 'ns' : ''} comprado${compradosCount !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Remover',
          onPress: () => limparComprados(),
          style: 'destructive',
        },
      ],
    );
  };

  const fecharModal = () => {
    setModalVisible(false);
    setEditMode(false);
    setSelectedItem(null);
    setNovoItemNome('');
    setNovoItemQuantidade('1');
    setNovoItemUnidade('');
    setNovoItemPreco('');
    setNovoItemCategoria('');
    setNovoItemLoja('');
    setNovoItemPrioridade('media');
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return '#FF6B6B';
      case 'media':
        return '#FFA500';
      case 'baixa':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const renderItemItem = ({ item }: any) => {
    const priceDisplay = item.preco_unitario ? `${item.preco_unitario.toFixed(2)}` : '—';
    const totalPrice = item.preco_total ? `R$ ${item.preco_total.toFixed(2)}` : '—';

    return (
      <View style={styles.itemCard}>
        <TouchableOpacity
          style={styles.itemCheckbox}
          onPress={() => marcarComprado(item.id, !item.comprado)}
        >
          <View
            style={[
              styles.checkbox,
              item.comprado && styles.checkboxChecked,
            ]}
          >
            {item.comprado && (
              <MaterialCommunityIcons name="check" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleEditarItem(item)}
        >
          <View style={styles.itemHeader}>
            <Text
              style={[
                styles.itemNome,
                item.comprado && styles.itemNomeComprado,
              ]}
            >
              {item.nome}
            </Text>
            {item.prioridade && (
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPrioridadeColor(item.prioridade) },
                ]}
              >
                <Text style={styles.priorityText}>
                  {item.prioridade.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.itemDetails}>
            {item.quantidade && (
              <Text style={styles.itemDetail}>
                <MaterialCommunityIcons name="package-variant" size={12} color="#666" /> {item.quantidade}{item.unidade ? ` ${item.unidade}` : ''}
              </Text>
            )}
            {item.preco_unitario && (
              <Text style={styles.itemDetail}>
                <MaterialCommunityIcons name="cash" size={12} color="#666" /> R$ {priceDisplay}
              </Text>
            )}
            {item.categoria && (
              <Text style={styles.itemDetail}>
                <MaterialCommunityIcons name="tag" size={12} color="#666" /> {item.categoria}
              </Text>
            )}
            {item.loja && (
              <Text style={styles.itemDetail}>
                <MaterialCommunityIcons name="store" size={12} color="#666" /> {item.loja}
              </Text>
            )}
          </View>

          {item.preco_total && (
            <Text style={styles.itemTotal}>{totalPrice}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletarItem(item.id, item.nome)}
        >
          <MaterialCommunityIcons name="trash-can" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !listaAtual) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const itens = listaAtual?.itens || [];
  const itensPendentes = itens.filter((i: any) => !i.comprado);
  const itensComprados = itens.filter((i: any) => i.comprado);
  const percentual = itens.length > 0 ? Math.round((itensComprados.length / itens.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title} numberOfLines={1}>{titulo}</Text>
          <Text style={styles.subtitle}>{itens.length} itens</Text>
        </View>
        <TouchableOpacity onPress={handleLimparComprados}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Error */}
      {erro && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#FF6B6B" />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      )}

      {/* Stats Bar */}
      {itens.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{itensPendentes.length}</Text>
            <Text style={styles.statLabel}>Faltam</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{percentual}%</Text>
            <Text style={styles.statLabel}>Completo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              R$ {(listaAtual?.total_gasto || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {/* Progress Bar */}
      {itens.length > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentual}%`, backgroundColor: '#FF6B6B' },
              ]}
            />
          </View>
        </View>
      )}

      {/* Items List */}
      {itens.length > 0 ? (
        <FlatList
          data={itens}
          renderItem={renderItemItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cart-outline" size={64} color="#ddd" />
          <Text style={styles.emptyTitle}>Nenhum item</Text>
          <Text style={styles.emptyText}>Adicione itens para começar</Text>
        </View>
      )}

      {/* FAB - Adicionar Item */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditMode(false);
          setSelectedItem(null);
          setNovoItemNome('');
          setNovoItemQuantidade('1');
          setNovoItemUnidade('');
          setNovoItemPreco('');
          setNovoItemCategoria('');
          setNovoItemLoja('');
          setNovoItemPrioridade('media');
          setModalVisible(true);
        }}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal Adicionar/Editar Item */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Editar Item' : 'Novo Item'}
              </Text>
              <TouchableOpacity onPress={fecharModal}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              {/* Nome */}
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Arroz 5kg"
                placeholderTextColor="#ccc"
                value={novoItemNome}
                onChangeText={setNovoItemNome}
              />

              {/* Quantidade */}
              <Text style={styles.label}>Quantidade</Text>
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.inputSmall]}
                  placeholder="1"
                  placeholderTextColor="#ccc"
                  value={novoItemQuantidade}
                  onChangeText={setNovoItemQuantidade}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.inputSmall]}
                  placeholder="kg, un, L..."
                  placeholderTextColor="#ccc"
                  value={novoItemUnidade}
                  onChangeText={setNovoItemUnidade}
                />
              </View>

              {/* Preço */}
              <Text style={styles.label}>Preço Unitário</Text>
              <TextInput
                style={styles.input}
                placeholder="R$ 0.00"
                placeholderTextColor="#ccc"
                value={novoItemPreco}
                onChangeText={setNovoItemPreco}
                keyboardType="decimal-pad"
              />

              {/* Categoria */}
              <Text style={styles.label}>Categoria</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Alimentos, Bebidas..."
                placeholderTextColor="#ccc"
                value={novoItemCategoria}
                onChangeText={setNovoItemCategoria}
              />

              {/* Loja */}
              <Text style={styles.label}>Loja</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Carrefour, Pão de Açúcar..."
                placeholderTextColor="#ccc"
                value={novoItemLoja}
                onChangeText={setNovoItemLoja}
              />

              {/* Prioridade */}
              <Text style={styles.label}>Prioridade</Text>
              <View style={styles.priorityContainer}>
                {(['baixa', 'media', 'alta'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      novoItemPrioridade === p && styles.priorityButtonActive,
                      { borderColor: getPrioridadeColor(p) },
                    ]}
                    onPress={() => setNovoItemPrioridade(p)}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        novoItemPrioridade === p && styles.priorityButtonTextActive,
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Spacer */}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={fecharModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={editMode ? handleAtualizarItem : handleAdicionarItem}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>
                    {editMode ? 'Atualizar' : 'Adicionar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: '#FFE0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'flex-start',
  },
  itemCheckbox: {
    padding: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B6B',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  itemNome: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemNomeComprado: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  itemDetails: {
    marginBottom: 6,
    gap: 4,
  },
  itemDetail: {
    fontSize: 11,
    color: '#666',
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  formContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  inputSmall: {
    flex: 1,
    marginBottom: 0,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  priorityButtonActive: {
    backgroundColor: '#FFE0E0',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  priorityButtonTextActive: {
    color: '#FF6B6B',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
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
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
