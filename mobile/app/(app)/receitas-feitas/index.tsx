import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';

interface ReceitaExecutada {
  id: string;
  data_execucao: string;
  avaliacao: number | null;
  porcoes_feitas: number;
  tempo_real_preparo: number | null;
  receita: {
    id: string;
    nome: string;
    descricao?: string;
    tempo_preparo?: number;
    imagem_url?: string;
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReceitasFeitasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [execucoes, setExecucoes] = useState<ReceitaExecutada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { carregar(); }, []));

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await api.get('/receitas/executadas');
      console.log('[ReceitasFeitas] response:', JSON.stringify(res.data).slice(0, 300));
      setExecucoes(res.data || []);
    } catch (e: any) {
      setErro(e?.response?.data?.message || e?.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[700]} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>Histórico</Text>
          <Text style={styles.headerTitle}>Receitas Feitas</Text>
        </View>
      </View>

      {erro ? (
        <View style={styles.centered}>
          <Text style={{ color: 'red', padding: 16, textAlign: 'center' }}>{erro}</Text>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.green[500]} />
        </View>
      ) : execucoes.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="chef-hat" size={40} color={C.green[500]} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma receita feita ainda</Text>
          <Text style={styles.emptySub}>
            Execute uma receita para registrar aqui seu histórico de cozinha
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/(tabs)/receitas')}>
            <MaterialCommunityIcons name="chef-hat" size={16} color={C.ink[0]} />
            <Text style={styles.emptyBtnTxt}>Ver receitas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={execucoes}
          keyExtractor={(e) => e.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: e }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: e.receita.id } })}
              activeOpacity={0.88}
            >
              {e.receita.imagem_url ? (
                <Image source={{ uri: e.receita.imagem_url }} style={styles.cardImg} />
              ) : (
                <View style={[styles.cardImg, styles.cardImgFallback]}>
                  <MaterialCommunityIcons name="chef-hat" size={28} color={C.ink[300]} />
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardNome} numberOfLines={1}>{e.receita.nome}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="calendar-outline" size={12} color={C.ink[400]} />
                    <Text style={styles.metaTxt}>{formatDate(e.data_execucao)}</Text>
                  </View>
                  {e.avaliacao ? (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="star" size={12} color={C.amber[400]} />
                      <Text style={styles.metaTxt}>{e.avaliacao}/5</Text>
                    </View>
                  ) : null}
                  {e.porcoes_feitas > 1 ? (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="account-group-outline" size={12} color={C.ink[400]} />
                      <Text style={styles.metaTxt}>{e.porcoes_feitas} porções</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={C.ink[300]} />
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 14, paddingTop: 12,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  headerSub: { ...T.micro, color: C.green[500], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h2, color: C.ink[900] },

  list: { padding: 16, gap: 12 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], padding: 12, ...shadows.sm,
  },
  cardImg: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: C.ink[100] },
  cardImgFallback: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardNome: { ...T.body, fontWeight: '700', color: C.ink[900] },
  cardMeta: { flexDirection: 'row', gap: 10, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt: { ...T.micro, color: C.ink[400] },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.green[50], borderWidth: 1, borderColor: C.green[200], borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { ...T.h3, color: C.ink[900] },
  emptySub: { ...T.body, color: C.ink[500], textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green[500], paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: radius.md, marginTop: 4, ...shadows.sm,
  },
  emptyBtnTxt: { ...T.body, color: C.ink[0], fontWeight: '700' },
});
