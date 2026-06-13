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

interface ReceitaFav {
  id: string;
  titulo: string;
  descricao?: string;
  tempo_preparo?: string;
  dificuldade?: string;
  imagem_url?: string;
  avaliacao_media?: number;
  vezes_executada?: number;
}

export default function FavoritasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [receitas, setReceitas] = useState<ReceitaFav[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { carregar(); }, []));

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await api.get('/receitas/favoritas');
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
          <Text style={styles.headerSub}>Minhas preferidas</Text>
          <Text style={styles.headerTitle}>Favoritas</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.green[500]} />
        </View>
      ) : receitas.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="heart-outline" size={40} color={C.red[500]} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma receita favoritada</Text>
          <Text style={styles.emptySub}>
            Toque no ícone ❤️ na tela de uma receita para adicioná-la aqui
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(app)/(tabs)/receitas')}>
            <MaterialCommunityIcons name="chef-hat" size={16} color={C.ink[0]} />
            <Text style={styles.emptyBtnTxt}>Ver receitas</Text>
          </TouchableOpacity>
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
                  {(r.vezes_executada ?? 0) > 0 ? (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="repeat" size={12} color={C.ink[400]} />
                      <Text style={styles.metaTxt}>{r.vezes_executada}x feita</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <MaterialCommunityIcons name="heart" size={18} color={C.red[500]} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
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
  headerSub: { ...T.micro, color: C.red[500], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
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
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.red[50], borderWidth: 1, borderColor: C.red[200], borderStyle: 'dashed',
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
