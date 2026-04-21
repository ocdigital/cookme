import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, RefreshControl,
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
      <MaterialCommunityIcons name={high ? 'check' : 'alert'} size={11} color={high ? C.green[700] : C.amber[700]} />
      <Text style={[styles.badgeText, { color: high ? C.green[700] : C.amber[700] }]}>{Math.round(confidence)}%</Text>
    </View>
  );
}

export default function DespensaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(React.useCallback(() => { carregarInventario(); }, []));

  const carregarInventario = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventario');
      setProdutos(response.data?.produtos || response.data?.data || []);
    } catch {
      Alert.alert('Erro', 'Falha ao carregar despensa');
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
      setProdutos(p => p.filter(x => x.id !== id));
    } catch {
      Alert.alert('Erro', 'Falha ao remover produto');
    }
  };

  const alimentos = produtos.filter(p => p.ingrediente_receita !== false).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Minha despensa</Text>
          <Text style={styles.headerTitle}>{produtos.length} itens</Text>
        </View>
        <TouchableOpacity style={styles.fabScan} onPress={() => router.push('/(app)/receita-ocr')}>
          <MaterialCommunityIcons name="barcode-scan" size={20} color={C.ink[0]} />
        </TouchableOpacity>
      </View>

      {produtos.length > 0 && !loading && (
        <View style={styles.insightCard}>
          <View style={styles.insightIconWrap}>
            <MaterialCommunityIcons name="auto-fix" size={18} color={C.green[0]} />
          </View>
          <Text style={styles.insightText}>{alimentos} ingredientes disponíveis</Text>
          <TouchableOpacity
            style={styles.btnGerar}
            onPress={() => router.push({ pathname: '/(app)/receitas-geradas', params: { ingredientes_json: JSON.stringify(produtos.filter(p => p.ingrediente_receita !== false).map(p => p.nome)) } })}
          >
            <MaterialCommunityIcons name="chef-hat" size={14} color={C.ink[0]} />
            <Text style={styles.btnGerarText}>Gerar</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={C.green[500]} /></View>
      ) : produtos.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="fridge-outline" size={52} color={C.green[500]} />
          </View>
          <Text style={styles.emptyTitle}>Despensa vazia</Text>
          <Text style={styles.emptySub}>Fotografe a nota fiscal e a IA cataloga tudo automaticamente.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/receita-ocr')}>
            <MaterialCommunityIcons name="barcode-scan" size={18} color={C.ink[0]} />
            <Text style={styles.emptyBtnText}>Escanear nota fiscal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green[500]} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: item.ingrediente_receita !== false ? C.green[50] : C.ink[100] }]}>
                <MaterialCommunityIcons
                  name={item.ingrediente_receita !== false ? 'food-apple-outline' : 'package-variant'}
                  size={22}
                  color={item.ingrediente_receita !== false ? C.green[500] : C.ink[400]}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{item.nome}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardQtd}>{item.quantidade_disponivel} {item.unidade}</Text>
                  {item.ingrediente_receita === false && (
                    <View style={styles.tagNaoAlimento}>
                      <Text style={styles.tagText}>não-alimento</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.cardRight}>
                <AIConfidenceBadge confidence={item.confianca_classificacao ?? 90} />
                <TouchableOpacity onPress={() => removerProduto(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={C.red[500]} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h1, color: C.ink[900] },
  fabScan: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center', ...shadows.md,
  },
  insightCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 14, marginBottom: 4,
    backgroundColor: C.green[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.green[100], padding: 12,
  },
  insightIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center',
  },
  insightText: { ...T.small, color: C.green[700], fontWeight: '600', flex: 1 },
  btnGerar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.green[500], paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm,
  },
  btnGerarText: { ...T.small, color: C.ink[0], fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.ink[0], borderRadius: radius.md,
    padding: 14, borderWidth: 1, borderColor: C.ink[150], ...shadows.sm,
  },
  cardIcon: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardNome: { ...T.h3, fontSize: 15, color: C.ink[900], marginBottom: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardQtd: { ...T.mono, color: C.ink[600] },
  tagNaoAlimento: { backgroundColor: C.ink[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  tagText: { ...T.micro, color: C.ink[600], letterSpacing: 0 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...T.h2, color: C.ink[900] },
  emptySub: { ...T.body, color: C.ink[500], textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green[500], paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: radius.md, marginTop: 8, ...shadows.md,
  },
  emptyBtnText: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
