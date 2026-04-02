import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface Produto {
  id: string;
  nome: string;
  quantidade_disponivel: number;
  unidade: string;
  confianca_classificacao?: number;
  ingrediente_receita?: boolean;
}

export default function InventarioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      carregarInventario();
    }, [])
  );

  const carregarInventario = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventario');
      const data = response.data?.produtos || response.data?.data || [];
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
      Alert.alert('Erro', 'Falha ao carregar inventário');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarInventario();
    setRefreshing(false);
  };

  const abrirScanCupom = () => {
    router.push('/(app)/receita-ocr');
  };

  const gerarReceitas = () => {
    const nomes = produtos.map(p => p.nome);
    if (nomes.length === 0) {
      Alert.alert('Erro', 'Adicione produtos ao inventário primeiro');
      return;
    }
    router.push({
      pathname: '/(app)/receitas-geradas',
      params: { ingredientes_json: JSON.stringify(nomes) }
    });
  };

  const removerProduto = async (id: string) => {
    try {
      await api.delete(`/inventario/${id}`);
      setProdutos(produtos.filter(p => p.id !== id));
      Alert.alert('Sucesso', 'Produto removido');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao remover produto');
    }
  };

  const renderProdutoItem = ({ item }: { item: Produto }) => (
    <View style={styles.produtoCard}>
      <View style={styles.produtoInfo}>
        <Text style={styles.produtoNome}>{item.nome}</Text>
        <Text style={styles.produtoQtd}>
          {item.quantidade_disponivel} {item.unidade}
        </Text>
        {item.confianca_classificacao !== undefined && (
          <Text style={styles.confianca}>
            Confiança: {Math.round(item.confianca_classificacao)}%
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.btnRemover}
        onPress={() => removerProduto(item.id)}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com stats */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Inventário</Text>
          <Text style={styles.subtitle}>{produtos.length} produtos</Text>
        </View>
      </View>

      {/* Botões de ação */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.btnScan} onPress={abrirScanCupom}>
          <MaterialCommunityIcons name="barcode-scan" size={24} color="#fff" />
          <Text style={styles.btnScanText}>Escanear Cupom</Text>
        </TouchableOpacity>

        {produtos.length > 0 && (
          <TouchableOpacity style={styles.btnReceitas} onPress={gerarReceitas}>
            <MaterialCommunityIcons name="chef-hat" size={24} color="#fff" />
            <Text style={styles.btnReceitasText}>Gerar Receitas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de produtos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : produtos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="inbox-multiple-outline" size={64} color="#ddd" />
          <Text style={styles.emptyText}>Nenhum produto no inventário</Text>
          <Text style={styles.emptySubtext}>Escaneie um cupom para começar</Text>
        </View>
      ) : (
        <FlatList
          data={produtos}
          renderItem={renderProdutoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  btnScan: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnScanText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnReceitas: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnReceitasText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  produtoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  produtoQtd: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  confianca: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  btnRemover: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});
