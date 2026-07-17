import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
}

interface Categoria { id: string; label: string; icon: string; total: number }

export default function PesquisaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ReceitaItem[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    api.get('/receitas/categorias').then((r) => setCategorias(r.data || [])).catch(() => {});
  }, []));

  // Busca com debounce ~350ms
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = termo.trim();
    if (q.length < 2) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await api.get('/receitas/buscar', { params: { q } });
        setResultados(res.data || []);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [termo]);

  const buscaAtiva = termo.trim().length >= 2;

  return (
    <ScreenWrapper>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={C.ink[700]} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={C.ink[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar receitas..."
            placeholderTextColor={C.ink[400]}
            value={termo}
            onChangeText={setTermo}
            autoFocus
            returnKeyType="search"
          />
          {termo.length > 0 && (
            <TouchableOpacity onPress={() => setTermo('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={C.ink[300]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!buscaAtiva ? (
        // Antes de digitar: atalhos por categoria
        <View style={styles.sugestoes}>
          <Text style={styles.sugestoesTitulo}>Explorar por categoria</Text>
          <View style={styles.chipsWrap}>
            {categorias.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.chip}
                onPress={() => router.push({ pathname: '/(app)/categoria/[id]', params: { id: c.id, label: c.label } })}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={c.icon as any} size={14} color={C.green[600]} />
                <Text style={styles.chipTxt}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : buscando ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.green[500]} />
        </View>
      ) : resultados.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="magnify-close" size={40} color={C.ink[300]} />
          <Text style={styles.emptyTitle}>Nenhuma receita para "{termo.trim()}"</Text>
        </View>
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 12,
    backgroundColor: C.ink[0], borderBottomWidth: 1, borderBottomColor: C.ink[150],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.ink[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: C.ink[200], paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, ...T.body, color: C.ink[900], padding: 0 } as any,

  sugestoes: { padding: 20, gap: 12 },
  sugestoesTitulo: { ...T.small, color: C.ink[500], fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.ink[0], borderRadius: radius.pill,
    borderWidth: 1, borderColor: C.ink[200], paddingHorizontal: 12, paddingVertical: 8,
    ...shadows.sm,
  },
  chipTxt: { ...T.small, color: C.ink[700], fontWeight: '600' },

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

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { ...T.body, color: C.ink[500], textAlign: 'center' },
});
