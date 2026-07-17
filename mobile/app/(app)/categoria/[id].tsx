import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';

interface ReceitaItem {
  id: string;
  titulo: string;
  descricao?: string;
  tempo_preparo?: string;
  imagem_url?: string;
  avaliacao_media?: number;
  vezes_executada?: number;
}

export default function CategoriaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, label } = useLocalSearchParams<{ id: string; label?: string }>();
  const [receitas, setReceitas] = useState<ReceitaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { if (id) carregar(); }, [id]));

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/receitas/categoria/${id}`);
      setReceitas(res.data || []);
    } catch {
      // silencioso
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
          <Text style={styles.headerSub}>Categoria</Text>
          <Text style={styles.headerTitle}>{label || 'Receitas'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.green[500]} />
        </View>
      ) : receitas.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={40} color={C.ink[300]} />
          <Text style={styles.emptyTitle}>Nenhuma receita nesta categoria</Text>
        </View>
      ) : (
        <FlatList
          data={receitas}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: r }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/(app)/receita/[id]', params: { id: r.id } })}
              activeOpacity={0.88}
            >
              {r.imagem_url ? (
                <Image source={{ uri: r.imagem_url }} style={styles.cardImg} />
              ) : (
                <View style={[styles.cardImg, styles.cardImgFallback]}>
                  <MaterialCommunityIcons name="chef-hat" size={28} color={C.ink[300]} />
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardNome} numberOfLines={1}>{r.titulo}</Text>
                {r.descricao ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{r.descricao}</Text>
                ) : null}
                <View style={styles.cardMeta}>
                  {r.tempo_preparo ? (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={C.ink[400]} />
                      <Text style={styles.metaTxt}>{r.tempo_preparo}</Text>
                    </View>
                  ) : null}
                  {(r.avaliacao_media ?? 0) > 0 ? (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="star" size={12} color={C.amber[400]} />
                      <Text style={styles.metaTxt}>{parseFloat(String(r.avaliacao_media)).toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={C.ink[300]} />
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
  headerSub: { ...T.micro, color: C.green[600], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  headerTitle: { ...T.h2, color: C.ink[900] },

  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], padding: 12, ...shadows.sm,
  },
  cardImg: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: C.ink[100] },
  cardImgFallback: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 3 },
  cardNome: { ...T.body, fontWeight: '700', color: C.ink[900] },
  cardDesc: { ...T.micro, color: C.ink[500], lineHeight: 16 },
  cardMeta: { flexDirection: 'row', gap: 10, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt: { ...T.micro, color: C.ink[400] },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { ...T.body, color: C.ink[500], textAlign: 'center' },
});
