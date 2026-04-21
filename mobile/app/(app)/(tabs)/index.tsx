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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

interface Produto {
  id: string;
  nome: string;
  quantidade_disponivel: number;
  unidade: string;
  confianca_classificacao?: number;
  ingrediente_receita?: boolean;
}

function AIConfidenceBadge({ confidence }: { confidence: number }) {
  const high = confidence >= 75;
  return (
    <View style={[styles.badge, { backgroundColor: high ? C.green[50] : C.amber[50] }]}>
      <MaterialCommunityIcons
        name={high ? 'check' : 'alert'}
        size={11}
        color={high ? C.green[700] : C.amber[700]}
      />
      <Text style={[styles.badgeText, { color: high ? C.green[700] : C.amber[700] }]}>
        {Math.round(confidence)}%
      </Text>
    </View>
  );
}

function ProdutoItem({ item, onRemove }: { item: Produto; onRemove: () => void }) {
  const conf = item.confianca_classificacao ?? 90;
  return (
    <View style={styles.produtoCard}>
      <View style={[styles.produtoIconBox, { backgroundColor: item.ingrediente_receita !== false ? C.green[50] : C.ink[100] }]}>
        <MaterialCommunityIcons
          name={item.ingrediente_receita !== false ? 'food-apple-outline' : 'package-variant'}
          size={22}
          color={item.ingrediente_receita !== false ? C.green[500] : C.ink[400]}
        />
      </View>
      <View style={styles.produtoInfo}>
        <Text style={styles.produtoNome}>{item.nome}</Text>
        <View style={styles.produtoMeta}>
          <Text style={styles.produtoQtd}>{item.quantidade_disponivel} {item.unidade}</Text>
          {item.ingrediente_receita === false && (
            <View style={styles.tagNaoAlimento}>
              <Text style={styles.tagNaoAlimentoText}>não-alimento</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.produtoRight}>
        <AIConfidenceBadge confidence={conf} />
        <TouchableOpacity onPress={onRemove} style={styles.btnRemover} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={C.red[500]} />
        </TouchableOpacity>
      </View>
    </View>
  );
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

  const removerProduto = async (id: string) => {
    try {
      await api.delete(`/inventario/${id}`);
      setProdutos(produtos.filter(p => p.id !== id));
    } catch {
      Alert.alert('Erro', 'Falha ao remover produto');
    }
  };

  const gerarReceitas = () => {
    const nomes = produtos.filter(p => p.ingrediente_receita !== false).map(p => p.nome);
    if (nomes.length === 0) {
      Alert.alert('Aviso', 'Adicione ingredientes ao inventário primeiro');
      return;
    }
    router.push({ pathname: '/(app)/receitas-geradas', params: { ingredientes_json: JSON.stringify(nomes) } });
  };

  const alimentos = produtos.filter(p => p.ingrediente_receita !== false).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Minha despensa</Text>
          <Text style={styles.headerTitle}>{produtos.length} itens</Text>
        </View>
        <TouchableOpacity style={styles.btnScan} onPress={() => router.push('/(app)/receita-ocr')}>
          <MaterialCommunityIcons name="barcode-scan" size={20} color={C.ink[0]} />
        </TouchableOpacity>
      </View>

      {/* Insight card (só mostra se tiver itens) */}
      {produtos.length > 0 && !loading && (
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <MaterialCommunityIcons name="auto-fix" size={20} color={C.green[900]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightText}>
              {alimentos} ingredientes · receitas disponíveis
            </Text>
          </View>
          <TouchableOpacity onPress={gerarReceitas} style={styles.btnReceitas}>
            <MaterialCommunityIcons name="chef-hat" size={16} color={C.ink[0]} />
            <Text style={styles.btnReceitasText}>Gerar</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.green[500]} />
        </View>
      ) : produtos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="fridge-outline" size={52} color={C.green[500]} />
          </View>
          <Text style={styles.emptyTitle}>Despensa vazia</Text>
          <Text style={styles.emptySubtext}>
            Fotografe a nota fiscal do seu mercado e a IA cataloga tudo em segundos.
          </Text>
          <TouchableOpacity style={styles.btnScanLarge} onPress={() => router.push('/(app)/receita-ocr')}>
            <MaterialCommunityIcons name="barcode-scan" size={20} color={C.ink[0]} />
            <Text style={styles.btnScanLargeText}>Escanear nota fiscal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green[500]} />}
          renderItem={({ item }) => (
            <ProdutoItem item={item} onRemove={() => removerProduto(item.id)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.ink[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: C.ink[0],
    borderBottomWidth: 1,
    borderBottomColor: C.ink[150],
  },
  headerSubtitle: {
    ...T.micro,
    color: C.green[600],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  headerTitle: {
    ...T.h1,
    color: C.ink[900],
  },
  btnScan: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.green[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
    padding: 14,
    backgroundColor: C.green[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.green[100],
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.green[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    ...T.small,
    color: C.green[700],
    fontWeight: '600',
  },
  btnReceitas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.green[500],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  btnReceitasText: {
    ...T.small,
    color: C.ink[0],
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  produtoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.ink[0],
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: C.ink[150],
    ...shadows.sm,
  },
  produtoIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  produtoInfo: {
    flex: 1,
    minWidth: 0,
  },
  produtoNome: {
    ...T.h3,
    fontSize: 15,
    color: C.ink[900],
    marginBottom: 3,
  },
  produtoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  produtoQtd: {
    ...T.mono,
    color: C.ink[600],
  },
  tagNaoAlimento: {
    backgroundColor: C.ink[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tagNaoAlimentoText: {
    ...T.micro,
    color: C.ink[600],
    letterSpacing: 0,
  },
  produtoRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  btnRemover: {
    padding: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.green[50],
    borderWidth: 1,
    borderColor: C.green[200],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    ...T.h2,
    color: C.ink[900],
  },
  emptySubtext: {
    ...T.body,
    color: C.ink[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  btnScanLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.green[500],
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: radius.md,
    marginTop: 8,
    ...shadows.md,
  },
  btnScanLargeText: {
    ...T.body,
    color: C.ink[0],
    fontWeight: '700',
  },
});
