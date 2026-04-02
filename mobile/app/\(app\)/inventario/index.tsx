import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useInventario } from '@/hooks/useInventario';

interface TabType {
  id: 'todos' | 'alimentos' | 'nao_alimentos';
  label: string;
  icon: string;
}

export default function InventarioScreen() {
  const router = useRouter();
  const {
    produtos,
    loading,
    erro,
    stats,
    refrescar,
    atualizarQuantidade,
    removerProduto,
  } = useInventario();

  const [activeTab, setActiveTab] = useState<'todos' | 'alimentos' | 'nao_alimentos'>('alimentos');
  const [refreshing, setRefreshing] = useState(false);
  const [editingProduto, setEditingProduto] = useState<string | null>(null);
  const [novaQuantidade, setNovaQuantidade] = useState('');

  const tabs: TabType[] = [
    { id: 'alimentos', label: 'Alimentos', icon: 'food' },
    { id: 'nao_alimentos', label: 'Outros', icon: 'package' },
    { id: 'todos', label: 'Todos', icon: 'list' },
  ];

  useFocusEffect(
    React.useCallback(() => {
      refrescar();
    }, [refrescar]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refrescar();
    setRefreshing(false);
  };

  const getProdutosParaExibir = () => {
    switch (activeTab) {
      case 'alimentos':
        return produtos.filter((p) => p.ingrediente_receita);
      case 'nao_alimentos':
        return produtos.filter((p) => !p.ingrediente_receita);
      case 'todos':
      default:
        return produtos;
    }
  };

  const handleEditar = (produtoId: string, quantidadeAtual: number) => {
    setEditingProduto(produtoId);
    setNovaQuantidade(quantidadeAtual.toString());
  };

  const handleSalvarQuantidade = async () => {
    if (!editingProduto || !novaQuantidade) return;

    try {
      const quantidade = parseFloat(novaQuantidade);
      if (isNaN(quantidade) || quantidade < 0) {
        Alert.alert('Erro', 'Quantidade deve ser um número válido');
        return;
      }

      await atualizarQuantidade(editingProduto, quantidade);
      setEditingProduto(null);
      setNovaQuantidade('');
    } catch (err) {
      Alert.alert('Erro', 'Falha ao atualizar quantidade');
    }
  };

  const handleRemover = (produtoId: string, nomeProduto: string) => {
    Alert.alert(
      'Remover Produto',
      `Deseja remover "${nomeProduto}" do inventário?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerProduto(produtoId);
            } catch (err) {
              Alert.alert('Erro', 'Falha ao remover produto');
            }
          },
        },
      ],
    );
  };

  const produtosExibir = getProdutosParaExibir();

  const renderProdutoItem = ({ item }: { item: any }) => {
    const isEditing = editingProduto === item.id;
    const confiancaCor =
      item.confianca_classificacao >= 85
        ? '#4CAF50'
        : item.confianca_classificacao >= 70
          ? '#FFA500'
          : '#FF6B6B';

    return (
      <View style={styles.produtoCard}>
        <View style={styles.produtoHeader}>
          <View style={styles.produtoInfo}>
            <Text style={styles.produtoNome} numberOfLines={2}>
              {item.nome}
            </Text>
            <View style={styles.categoriaBadgeContainer}>
              <View style={styles.categoriaBadge}>
                <Text style={styles.categoriaBadgeText}>{item.categoria}</Text>
              </View>
              {item.ingrediente_receita && (
                <View style={styles.alimentoBadge}>
                  <MaterialCommunityIcons
                    name="leaf"
                    size={12}
                    color="#fff"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.alimentoText}>Ingrediente</Text>
                </View>
              )}
            </View>
          </View>

          {item.imagem_url && (
            <View style={styles.imagemContainer}>
              <MaterialCommunityIcons
                name="image"
                size={32}
                color="#ddd"
              />
            </View>
          )}
        </View>

        <View style={styles.produtoDetails}>
          <View style={styles.quantidadeSection}>
            <Text style={styles.label}>Quantidade</Text>
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.input}
                  value={novaQuantidade}
                  onChangeText={setNovaQuantidade}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <TouchableOpacity
                  style={styles.btnSalvar}
                  onPress={handleSalvarQuantidade}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnCancelar}
                  onPress={() => setEditingProduto(null)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.quantidadeDisplay}>
                <Text style={styles.quantidadeValue}>
                  {item.quantidade_disponivel}
                </Text>
                <Text style={styles.unidade}>{item.unidade}</Text>
                <TouchableOpacity
                  onPress={() =>
                    handleEditar(item.id, item.quantidade_disponivel)
                  }
                  style={styles.btnEdit}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={16}
                    color="#FF6B6B"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.confiancaSection}>
            <Text style={styles.label}>Confiança</Text>
            <View style={styles.confiancaBar}>
              <View
                style={[
                  styles.confiancaFill,
                  {
                    width: `${item.confianca_classificacao}%`,
                    backgroundColor: confiancaCor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.confiancaText, { color: confiancaCor }]}>
              {item.confianca_classificacao}%
            </Text>
          </View>
        </View>

        <View style={styles.dataRemover}>
          <Text style={styles.dataAdicao}>
            Adicionado em{' '}
            {new Date(item.data_adicao).toLocaleDateString('pt-BR')}
          </Text>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => handleRemover(item.id, item.nome)}
              style={styles.btnRemover}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={18}
                color="#FF6B6B"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && produtos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventário</Text>
          <Text style={styles.headerSubtitle}>
            {stats.total_produtos} produto{stats.total_produtos !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/receita-ocr')}
          style={styles.btnAdicionar}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <MaterialCommunityIcons
            name="basket"
            size={24}
            color="#FF6B6B"
          />
          <Text style={styles.statValue}>{stats.total_produtos}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons
            name="leaf"
            size={24}
            color="#4CAF50"
          />
          <Text style={styles.statValue}>{stats.alimentos}</Text>
          <Text style={styles.statLabel}>Alimentos</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons
            name="package"
            size={24}
            color="#2196F3"
          />
          <Text style={styles.statValue}>{stats.nao_alimentos}</Text>
          <Text style={styles.statLabel}>Outros</Text>
        </View>
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#FF6B6B' : '#999'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error */}
      {erro && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={18}
            color="#FF6B6B"
          />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      )}

      {/* Product List */}
      {produtosExibir.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="inbox-multiple-outline"
            size={64}
            color="#ddd"
          />
          <Text style={styles.emptyText}>
            Nenhum produto {activeTab === 'alimentos' ? 'alimentício' : activeTab === 'nao_alimentos' ? 'cadastrado' : 'no'} inventário
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'alimentos'
              ? 'Capture um cupom com OCR para começar'
              : 'Suas compras aparecerão aqui'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={produtosExibir}
          renderItem={renderProdutoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* FAB Receitas */}
      <TouchableOpacity
        style={[styles.fabOcr, styles.fabReceitas]}
        onPress={() => router.push('/(app)/sugestoes')}
      >
        <MaterialCommunityIcons name="chef-hat" size={28} color="#fff" />
      </TouchableOpacity>

      {/* FAB OCR */}
      <TouchableOpacity
        style={styles.fabOcr}
        onPress={() => router.push('/(app)/receita-ocr')}
      >
        <MaterialCommunityIcons name="receipt" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  btnAdicionar: {
    backgroundColor: '#FF6B6B',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsScroll: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  statCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
    gap: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6B6B',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  tabLabelActive: {
    color: '#FF6B6B',
  },
  errorBanner: {
    backgroundColor: '#FFE0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 120,
  },
  produtoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  produtoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  produtoInfo: {
    flex: 1,
    marginRight: 12,
  },
  produtoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  categoriaBadgeContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoriaBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoriaBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  alimentoBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alimentoText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  imagemContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  produtoDetails: {
    gap: 12,
    marginBottom: 12,
  },
  quantidadeSection: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quantidadeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantidadeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  unidade: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  btnEdit: {
    marginLeft: 'auto',
    padding: 6,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  btnSalvar: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confiancaSection: {
    gap: 6,
  },
  confiancaBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confiancaFill: {
    height: '100%',
    borderRadius: 3,
  },
  confiancaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dataRemover: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dataAdicao: {
    fontSize: 10,
    color: '#999',
  },
  btnRemover: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
  fabOcr: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabReceitas: {
    bottom: 180,
  },
});
