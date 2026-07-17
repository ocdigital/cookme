import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ImageBackground, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';

interface Categoria {
  id: string;
  label: string;
  icon: string;
  total: number;
  imagem_url: string | null;
}

export default function CategoriasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { carregar(); }, []));

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await api.get('/receitas/categorias');
      setCategorias(res.data || []);
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
          <Text style={styles.headerSub}>Explore por tipo</Text>
          <Text style={styles.headerTitle}>Categorias</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.green[500]} />
        </View>
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/(app)/categoria/[id]', params: { id: c.id, label: c.label } })}
            >
              <ImageBackground
                source={c.imagem_url ? { uri: c.imagem_url } : undefined}
                style={styles.cardBg}
                imageStyle={styles.cardImg}
              >
                <View style={styles.cardOverlay} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>{c.label}</Text>
                  <Text style={styles.cardTotal}>{c.total} {c.total === 1 ? 'receita' : 'receitas'}</Text>
                </View>
              </ImageBackground>
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

  list: { padding: 16, gap: 14 },

  card: {
    height: 140, borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: C.ink[200], ...shadows.md,
  },
  cardBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardImg: { borderRadius: radius.lg },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  cardContent: { alignItems: 'center', gap: 4 },
  cardLabel: { ...T.h2, color: C.ink[0], textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6 } as any,
  cardTotal: { ...T.small, color: 'rgba(255,255,255,0.9)', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 } as any,
});
