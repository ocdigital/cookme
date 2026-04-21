import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { colors as C, radius, typography as T, shadows } from '@/constants/theme';

interface Stats {
  totalProdutos: number;
  alimentos: number;
  listas: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalProdutos: 0, alimentos: 0, listas: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      carregarStats();
    }, [])
  );

  const carregarStats = async () => {
    try {
      const [inventario, listas] = await Promise.allSettled([
        api.get('/inventario'),
        api.get('/listas'),
      ]);
      const produtos = inventario.status === 'fulfilled'
        ? (inventario.value.data?.produtos || inventario.value.data?.data || [])
        : [];
      const listasData = listas.status === 'fulfilled'
        ? (listas.value.data?.listas || listas.value.data || [])
        : [];
      setStats({
        totalProdutos: produtos.length,
        alimentos: produtos.filter((p: any) => p.ingrediente_receita !== false).length,
        listas: listasData.filter((l: any) => l.status === 'ativa').length,
      });
    } catch {}
    finally { setLoading(false); }
  };

  const primeiroNome = (user?.name || user?.email || 'você').split(' ')[0];
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const acoes = [
    {
      icon: 'barcode-scan',
      label: 'Escanear\nNota Fiscal',
      color: C.green[500],
      bg: C.green[50],
      route: '/(app)/receita-ocr',
    },
    {
      icon: 'cart-plus',
      label: 'Nova Lista\nde Compras',
      color: C.amber[600],
      bg: C.amber[50],
      route: '/(app)/(tabs)/listas',
    },
    {
      icon: 'chef-hat',
      label: 'Gerar\nReceitas',
      color: C.ink[600],
      bg: C.ink[100],
      route: '/(app)/(tabs)/receitas',
    },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saudacao}>{saudacao},</Text>
            <Text style={styles.nome}>{primeiroNome} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(app)/(tabs)/perfil')}
          >
            <Text style={styles.avatarInitial}>
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {loading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator color={C.green[500]} />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(app)/(tabs)/despensa')} activeOpacity={0.7}>
              <MaterialCommunityIcons name="fridge-outline" size={22} color={C.green[600]} />
              <Text style={styles.statNum}>{stats.totalProdutos}</Text>
              <Text style={styles.statLbl}>na despensa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statCard, styles.statCardMid]} onPress={() => router.push('/(app)/(tabs)/despensa')} activeOpacity={0.7}>
              <MaterialCommunityIcons name="food-apple-outline" size={22} color={C.amber[600]} />
              <Text style={styles.statNum}>{stats.alimentos}</Text>
              <Text style={styles.statLbl}>ingredientes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(app)/(tabs)/listas')} activeOpacity={0.7}>
              <MaterialCommunityIcons name="cart-outline" size={22} color={C.ink[500]} />
              <Text style={styles.statNum}>{stats.listas}</Text>
              <Text style={styles.statLbl}>listas ativas</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ações rápidas */}
        <Text style={styles.sectionTitle}>Ações rápidas</Text>
        <View style={styles.acoesGrid}>
          {acoes.map((acao) => (
            <TouchableOpacity
              key={acao.label}
              style={styles.acaoCard}
              onPress={() => router.push(acao.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.acaoIcon, { backgroundColor: acao.bg }]}>
                <MaterialCommunityIcons name={acao.icon} size={28} color={acao.color} />
              </View>
              <Text style={styles.acaoLabel}>{acao.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner OCR */}
        <TouchableOpacity
          style={styles.banner}
          onPress={() => router.push('/(app)/receita-ocr')}
          activeOpacity={0.85}
        >
          <View style={styles.bannerIcon}>
            <MaterialCommunityIcons name="receipt" size={28} color={C.green[600]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Digitalizar cupom fiscal</Text>
            <Text style={styles.bannerSub}>A IA extrai e classifica os itens automaticamente</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={C.green[600]} />
        </TouchableOpacity>

        {/* Receitas */}
        {stats.alimentos > 0 && (
          <TouchableOpacity
            style={styles.receitasBanner}
            onPress={() => router.push('/(app)/(tabs)/receitas')}
            activeOpacity={0.85}
          >
            <View style={styles.receitasBannerContent}>
              <MaterialCommunityIcons name="chef-hat" size={24} color={C.amber[600]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.receitasBannerTitle}>Você tem {stats.alimentos} ingredientes</Text>
                <Text style={styles.receitasBannerSub}>Gerar sugestões de receitas agora</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={C.amber[600]} />
            </View>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink[50] },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saudacao: { ...T.small, color: C.ink[500] },
  nome: { ...T.h1, color: C.ink[900], marginTop: 2 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.green[500], alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: C.ink[0] },

  statsLoading: { height: 88, alignItems: 'center', justifyContent: 'center' },
  statsRow: {
    flexDirection: 'row', backgroundColor: C.ink[0],
    borderRadius: radius.lg, borderWidth: 1, borderColor: C.ink[150],
    overflow: 'hidden', ...shadows.sm,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statCardMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.ink[150] },
  statNum: { ...T.h2, color: C.ink[900] },
  statLbl: { ...T.micro, color: C.ink[400] },

  sectionTitle: { ...T.micro, color: C.ink[400], textTransform: 'uppercase', letterSpacing: 0.5 },

  acoesGrid: { flexDirection: 'row', gap: 10 },
  acaoCard: {
    flex: 1, backgroundColor: C.ink[0], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.ink[150], padding: 16,
    alignItems: 'center', gap: 10, ...shadows.sm,
  },
  acaoIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  acaoLabel: { ...T.small, color: C.ink[700], fontWeight: '600', textAlign: 'center' },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.green[50], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.green[200], padding: 16, ...shadows.sm,
  },
  bannerIcon: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: C.green[100], alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { ...T.h3, color: C.green[800] },
  bannerSub: { ...T.small, color: C.green[700], marginTop: 2 },

  receitasBanner: {
    backgroundColor: C.amber[50], borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.amber[200], padding: 16, ...shadows.sm,
  },
  receitasBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  receitasBannerTitle: { ...T.h3, color: C.amber[800] },
  receitasBannerSub: { ...T.small, color: C.amber[700], marginTop: 2 },
});
