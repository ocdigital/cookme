import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

interface InventarioItem {
  id: string;
  produto: { nome: string; nome_display?: string };
  quantidade: number;
  unidade_medida: string;
  data_validade: string;
}

interface Receita {
  id: string;
  titulo?: string;
  nome?: string;
  imagem_url?: string;
  tempo_preparo?: string | number;
  dificuldade?: string;
  cobertura?: number;
  disponivel?: boolean;
  usa_vencendo?: string[];
}

function diasRestantes(data: string): number {
  const diff = new Date(data).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function corValidade(dias: number) {
  if (dias <= 3) return C.red[500];
  if (dias <= 7) return C.amber[600];
  return C.green[600];
}

function bgValidade(dias: number) {
  if (dias <= 3) return '#FFF2F0';
  if (dias <= 7) return C.amber[50];
  return C.green[50];
}

function textoValidade(dias: number) {
  if (dias <= 0) return 'Venceu hoje';
  if (dias === 1) return 'Vence amanhã';
  return `${dias} dias`;
}

function nomeReceita(r: Receita) {
  return r.titulo || r.nome || '';
}

function ItemVencendo({ item }: { item: InventarioItem }) {
  const dias = diasRestantes(item.data_validade);
  const cor = corValidade(dias);
  const bg = bgValidade(dias);
  const nome = item.produto?.nome_display || item.produto?.nome || '';

  return (
    <View style={[styles.itemChip, { backgroundColor: bg, borderColor: cor + '40' }]}>
      <MaterialCommunityIcons name="clock-alert-outline" size={14} color={cor} />
      <Text style={[styles.itemNome, { color: cor }]}>{nome}</Text>
      <Text style={[styles.itemDias, { color: cor }]}>{textoValidade(dias)}</Text>
    </View>
  );
}

function ReceitaCard({ receita, onPress }: { receita: Receita; onPress: () => void }) {
  const [imgError, setImgError] = useState(false);
  const temImagem = !!receita.imagem_url && !imgError;
  const cobertura = receita.cobertura ?? 0;

  return (
    <TouchableOpacity style={styles.receitaCard} onPress={onPress} activeOpacity={0.85}>
      {temImagem ? (
        <Image
          source={{ uri: receita.imagem_url }}
          style={styles.receitaImg}
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[styles.receitaImg, styles.receitaImgFallback]}>
          <MaterialCommunityIcons name="chef-hat" size={28} color={C.ink[300]} />
        </View>
      )}
      {temImagem && (
        <LinearGradient
          colors={['transparent', 'rgba(10,7,3,0.75)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {receita.usa_vencendo && receita.usa_vencendo.length > 0 && (
        <View style={styles.urgenteBadge}>
          <MaterialCommunityIcons name="clock-alert-outline" size={11} color={C.ink[0]} />
          <Text style={styles.urgenteBadgeTxt}>
            Usa {receita.usa_vencendo.slice(0, 2).join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.receitaInfo}>
        <Text style={styles.receitaNome} numberOfLines={2}>{nomeReceita(receita)}</Text>
        <View style={styles.receitaMeta}>
          {receita.tempo_preparo ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaTxt}>
                {receita.tempo_preparo}{typeof receita.tempo_preparo === 'number' ? ' min' : ''}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name={cobertura >= 100 ? 'check-circle-outline' : 'fridge-outline'}
              size={12}
              color={cobertura >= 80 ? C.green[200] : C.amber[200]}
            />
            <Text style={[styles.metaTxt, { color: cobertura >= 80 ? C.green[200] : C.amber[200] }]}>
              {cobertura >= 100 ? 'Tem tudo' : `${cobertura}%`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function VencendoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [vencendo, setVencendo] = useState<InventarioItem[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);

  useFocusEffect(useCallback(() => { carregar(); }, []));

  const carregar = async () => {
    setLoading(true);
    try {
      const [invRes, recRes] = await Promise.allSettled([
        api.get('/inventario/vencendo?days=14'),
        api.get('/receitas/disponiveis'),
      ]);

      if (invRes.status === 'fulfilled') {
        const itens: InventarioItem[] = invRes.value.data || [];
        setVencendo(itens.sort((a, b) => diasRestantes(a.data_validade) - diasRestantes(b.data_validade)));
      }

      if (recRes.status === 'fulfilled') {
        const lista: Receita[] = recRes.value.data?.receitas || recRes.value.data || [];
        const comVencendo = lista
          .filter((r: Receita) => r.usa_vencendo && r.usa_vencendo.length > 0)
          .sort((a: Receita, b: Receita) => (b.cobertura ?? 0) - (a.cobertura ?? 0));
        setReceitas(comVencendo);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const urgentes = vencendo.filter(i => diasRestantes(i.data_validade) <= 3);
  const moderados = vencendo.filter(i => {
    const d = diasRestantes(i.data_validade);
    return d > 3 && d <= 14;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.ink[700]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitulo}>Vencendo em breve</Text>
          {!loading && (
            <Text style={styles.headerSub}>
              {vencendo.length} ingrediente{vencendo.length !== 1 ? 's' : ''} para usar logo
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.amber[500]} size="large" />
          <Text style={styles.loadingTxt}>Carregando...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Urgentes (≤ 3 dias) */}
          {urgentes.length > 0 && (
            <View style={styles.secao}>
              <View style={styles.secaoHeader}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={C.red[500]} />
                <Text style={[styles.secaoTitulo, { color: C.red[600] }]}>
                  Use hoje ou amanhã
                </Text>
              </View>
              <View style={styles.chips}>
                {urgentes.map(item => <ItemVencendo key={item.id} item={item} />)}
              </View>
            </View>
          )}

          {/* Moderados (4-14 dias) */}
          {moderados.length > 0 && (
            <View style={styles.secao}>
              <View style={styles.secaoHeader}>
                <MaterialCommunityIcons name="clock-alert-outline" size={18} color={C.amber[600]} />
                <Text style={[styles.secaoTitulo, { color: C.amber[700] }]}>
                  Próxima semana
                </Text>
              </View>
              <View style={styles.chips}>
                {moderados.map(item => <ItemVencendo key={item.id} item={item} />)}
              </View>
            </View>
          )}

          {/* Receitas sugeridas */}
          <View style={styles.secao}>
            <View style={styles.secaoHeader}>
              <MaterialCommunityIcons name="chef-hat" size={18} color={C.ink[600]} />
              <Text style={styles.secaoTitulo}>
                {receitas.length > 0
                  ? `${receitas.length} receita${receitas.length !== 1 ? 's' : ''} para aproveitar`
                  : 'Receitas sugeridas'}
              </Text>
            </View>

            {receitas.length === 0 ? (
              <View style={styles.vazioBox}>
                <MaterialCommunityIcons name="chef-hat" size={40} color={C.ink[300]} />
                <Text style={styles.vazioTxt}>
                  Nenhuma receita encontrada para esses ingredientes ainda.
                </Text>
                <TouchableOpacity
                  style={styles.gerarBtn}
                  onPress={() => router.push('/(app)/(tabs)/receitas' as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.gerarBtnTxt}>Gerar receitas</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.receitasGrid}>
                {receitas.map(r => (
                  <ReceitaCard
                    key={r.id}
                    receita={r}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/receita/[id]',
                        params: { id: r.id, dados: JSON.stringify(r) },
                      } as any)
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const CARD_W = '48%';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFAF5' },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.ink[0], alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitulo: { fontSize: 18, fontWeight: '800', color: C.ink[900], letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: C.ink[500], marginTop: 1 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: C.ink[400] },

  secao: { paddingHorizontal: 20, paddingTop: 24 },
  secaoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  secaoTitulo: { fontSize: 16, fontWeight: '700', color: C.ink[900] },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: radius.pill, borderWidth: 1,
  },
  itemNome: { fontSize: 13, fontWeight: '600' },
  itemDias: { fontSize: 12, fontWeight: '500', opacity: 0.85 },

  receitasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  receitaCard: {
    width: CARD_W, height: 180,
    borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: C.ink[100],
    justifyContent: 'flex-end',
    ...shadows.sm,
  },
  receitaImg: { ...StyleSheet.absoluteFillObject as any },
  receitaImgFallback: { alignItems: 'center', justifyContent: 'center' },
  urgenteBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.amber[500], borderRadius: radius.pill,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  urgenteBadgeTxt: { fontSize: 10, fontWeight: '700', color: C.ink[0] },
  receitaInfo: { padding: 10 },
  receitaNome: { fontSize: 13, fontWeight: '700', color: C.ink[0], lineHeight: 17, marginBottom: 4 },
  receitaMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  vazioBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  vazioTxt: { fontSize: 14, color: C.ink[400], textAlign: 'center', lineHeight: 20 },
  gerarBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: C.amber[500], borderRadius: radius.pill, marginTop: 4,
  },
  gerarBtnTxt: { fontSize: 14, fontWeight: '700', color: C.ink[900] },
});
